import { Cache } from "../../../core/cache";
import { Logger } from "../../../core/logger";
import { type ProxyHeaders, proxyUrl } from "../../../core/proxy";
import { extractAniZipImages, fetchWithRetry } from "../../meta/anilist/lib/helpers";
import { miruro as MIRURO_URL } from "../../origins";
import { MEDIA_FULL_FIELDS, MEDIA_LIST_FIELDS, decodeCatalog } from "./utils";

const ANILIST_URL = "https://graphql.anilist.co";
const CATALOG_URL = `${MIRURO_URL}/api/v1`;
const CATALOG_ATTEMPTS = 3;
const LOOKUP_TTL = 7 * 24 * 3600;

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  Referer: `${MIRURO_URL}/`,
};

const SORTS = new Set([
  "SCORE_DESC",
  "POPULARITY_DESC",
  "TRENDING_DESC",
  "START_DATE_DESC",
  "FAVOURITES_DESC",
  "UPDATED_AT_DESC",
]);

const ENUMS: Record<string, [string, string[]]> = {
  season: ["MediaSeason", ["WINTER", "SPRING", "SUMMER", "FALL"]],
  format: ["MediaFormat", ["TV", "TV_SHORT", "MOVIE", "SPECIAL", "OVA", "ONA", "MUSIC"]],
  status: ["MediaStatus", ["FINISHED", "RELEASING", "NOT_YET_RELEASED", "CANCELLED", "HIATUS"]],
};

type CatalogEntry = { id: string; format: string | null };

type CatalogEpisode = {
  episode_number: number;
  title: string | null;
  synopsis: string | null;
  thumbnail_url: string | null;
  aired_on: string | null;
  duration_seconds: number | null;
  canon_type: string | null;
  skip_times?: { kind: string; start_seconds: number; end_seconds: number }[];
};

type PlaybackServer = {
  server: string;
  headers?: ProxyHeaders;
  streams: { url: string; format: string }[];
};

type PlaybackProvider = {
  provider: string;
  subtitles?: { file: string }[];
  servers: PlaybackServer[];
};

type Playback = {
  tracks: { track: string; providers: PlaybackProvider[] }[];
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const aniZip = (anilistId: string | number) =>
  fetchWithRetry(`https://api.ani.zip/mappings?anilist_id=${anilistId}`)
    .then((res) => res.json())
    .catch(() => null);

function withArtwork(media: any, mappings: unknown) {
  const { banner, logo } = extractAniZipImages(mappings);
  media.bannerImage = banner || media.bannerImage;
  media.logo = logo || media.logo;
  return media;
}

function paged(pageInfo: any, page: number, perPage: number) {
  return {
    page: pageInfo?.currentPage || page,
    perPage: pageInfo?.perPage || perPage,
    total: pageInfo?.total || 0,
    hasNextPage: pageInfo?.hasNextPage || false,
  };
}

function playbackHeaders(headers: ProxyHeaders = {}): ProxyHeaders {
  if (headers.Origin || !headers.Referer || !URL.canParse(headers.Referer)) return headers;
  return { ...headers, Origin: new URL(headers.Referer).origin };
}

function withProxies(provider: PlaybackProvider) {
  const subtitleHeaders = playbackHeaders(provider.servers[0]?.headers);
  return {
    ...provider,
    subtitles: provider.subtitles?.map((subtitle) => ({
      ...subtitle,
      proxiedUrl: proxyUrl(subtitle.file, subtitleHeaders, "file"),
    })),
    servers: provider.servers.map((server) => {
      const headers = playbackHeaders(server.headers);
      return {
        ...server,
        streams: server.streams.map((stream) => ({
          ...stream,
          proxiedUrl: proxyUrl(stream.url, headers, stream.format === "hls" ? "hls" : "mp4"),
        })),
      };
    }),
  };
}

async function catalog<T>(path: string): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${CATALOG_URL}/${path}`, { headers: HEADERS });
      if (!res.ok) {
        throw Object.assign(new Error(`Miruro catalog responded ${res.status} for ${path}`), {
          status: res.status,
        });
      }
      return decodeCatalog(
        res.headers.get("content-type"),
        new Uint8Array(await res.arrayBuffer()),
      );
    } catch (err) {
      const status = (err as { status?: number }).status ?? 0;
      if (attempt >= CATALOG_ATTEMPTS || (status >= 400 && status < 500)) throw err;
      await sleep(250 * attempt);
    }
  }
}

export function invalidFilter(params: Record<string, string | undefined>) {
  for (const [name, [, values]] of Object.entries(ENUMS)) {
    const value = params[name]?.toUpperCase();
    if (value && !values.includes(value))
      return `Invalid ${name}; expected one of ${values.join(", ")}`;
  }
  return null;
}

export class Miruro {
  private static async anilistQuery(query: string, variables?: Record<string, unknown>) {
    const res = await fetch(ANILIST_URL, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) throw new Error(`AniList query failed: HTTP ${res.status}`);
    const json = await res.json();
    return json.data || {};
  }

  private static async lookup(anilistId: string | number): Promise<CatalogEntry | null> {
    const id = Number(anilistId);
    if (!Number.isSafeInteger(id) || id <= 0) return null;

    const { data } = await Cache.remember(`miruro:catalog:${id}`, LOOKUP_TTL, async () => {
      const { data: matches } = await catalog<{
        data: (CatalogEntry & { external_ids?: { anilist?: string[] } })[];
      }>(`anime?anilist_id_in=${id}&limit=100`);
      const match = matches.find((item) => item.external_ids?.anilist?.includes(String(id)));
      return match ? { id: match.id, format: match.format } : null;
    });
    return data;
  }

  static async search(query: string, page = 1, perPage = 20) {
    try {
      const data = await this.anilistQuery(
        `query ($search: String, $page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            pageInfo { total currentPage lastPage hasNextPage perPage }
            media(search: $search, type: ANIME, sort: SEARCH_MATCH, isAdult: false) {
              ${MEDIA_LIST_FIELDS}
            }
          }
        }`,
        { search: query, page, perPage },
      );
      return {
        ...paged(data.Page?.pageInfo, page, perPage),
        results: data.Page?.media || [],
      };
    } catch (err) {
      Logger.error(`[Miruro] search failed: ${String(err)}`);
      return null;
    }
  }

  static async suggestions(query: string) {
    try {
      const data = await this.anilistQuery(
        `query ($search: String) {
          Page(page: 1, perPage: 8) {
            media(search: $search, type: ANIME, sort: SEARCH_MATCH, isAdult: false) {
              id
              title { romaji english }
              coverImage { large }
              format
              status
              startDate { year }
              episodes
            }
          }
        }`,
        { search: query },
      );
      return {
        suggestions: (data.Page?.media || []).map((item: any) => ({
          id: item.id,
          title: item.title?.english || item.title?.romaji,
          title_romaji: item.title?.romaji,
          poster: item.coverImage?.large,
          format: item.format,
          status: item.status,
          year: item.startDate?.year,
          episodes: item.episodes,
        })),
      };
    } catch (err) {
      Logger.error(`[Miruro] suggestions failed: ${String(err)}`);
      return null;
    }
  }

  static async filter(params: Record<string, string | undefined>) {
    try {
      const sort = SORTS.has(params.sort ?? "") ? params.sort : "POPULARITY_DESC";
      const args = ["type: ANIME", `sort: [${sort}]`, "isAdult: false"];
      const types = ["$page: Int", "$perPage: Int"];
      const variables: Record<string, unknown> = {
        page: Number(params.page) || 1,
        perPage: Number(params.perPage ?? params.per_page) || 20,
      };
      const add = (name: string, type: string, value: unknown) => {
        args.push(`${name}: $${name}`);
        types.push(`$${name}: ${type}`);
        variables[name] = value;
      };

      if (params.genre) add("genre", "String", params.genre);
      if (params.tag) add("tag", "String", params.tag);
      if (params.year) add("seasonYear", "Int", Number(params.year));
      for (const [name, [type, values]] of Object.entries(ENUMS)) {
        const value = params[name]?.toUpperCase();
        if (value && values.includes(value)) add(name, type, value);
      }

      const data = await this.anilistQuery(
        `query (${types.join(", ")}) {
          Page(page: $page, perPage: $perPage) {
            pageInfo { total currentPage lastPage hasNextPage perPage }
            media(${args.join(", ")}) {
              ${MEDIA_LIST_FIELDS}
            }
          }
        }`,
        variables,
      );
      return {
        ...paged(data.Page?.pageInfo, variables.page as number, variables.perPage as number),
        results: data.Page?.media || [],
      };
    } catch (err) {
      Logger.error(`[Miruro] filter failed: ${String(err)}`);
      return null;
    }
  }

  private static async collection(
    sort: string,
    status: string | null,
    page: number,
    perPage: number,
    allowAll: boolean,
  ) {
    try {
      const filters = `${status ? `, status: ${status}` : ""}${allowAll ? "" : ', countryOfOrigin: "JP"'}`;
      const data = await this.anilistQuery(
        `query ($page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            pageInfo { total currentPage lastPage hasNextPage perPage }
            media(type: ANIME, sort: [${sort}]${filters}, isAdult: false) {
              ${MEDIA_LIST_FIELDS}
            }
          }
        }`,
        { page, perPage },
      );
      return {
        ...paged(data.Page?.pageInfo, page, perPage),
        results: data.Page?.media || [],
      };
    } catch (err) {
      Logger.error(`[Miruro] ${sort} collection failed: ${String(err)}`);
      return null;
    }
  }

  static trending(page = 1, perPage = 20, allowAll = false) {
    return this.collection("TRENDING_DESC", null, page, perPage, allowAll);
  }

  static popular(page = 1, perPage = 20, allowAll = false) {
    return this.collection("POPULARITY_DESC", null, page, perPage, allowAll);
  }

  static upcoming(page = 1, perPage = 20, allowAll = false) {
    return this.collection("POPULARITY_DESC", "NOT_YET_RELEASED", page, perPage, allowAll);
  }

  static recent(page = 1, perPage = 20, allowAll = false) {
    return this.collection("START_DATE_DESC", "RELEASING", page, perPage, allowAll);
  }

  static async spotlight(allowAll = false) {
    try {
      const data = await this.anilistQuery(
        `query {
          Page(page: 1, perPage: 10) {
            media(sort: [TRENDING_DESC, POPULARITY_DESC], type: ANIME${allowAll ? "" : ', countryOfOrigin: "JP"'}, isAdult: false) {
              ${MEDIA_LIST_FIELDS}
              description(asHtml: false)
            }
          }
        }`,
      );
      const results = await Promise.all(
        (data.Page?.media || []).map(async (media: any) =>
          withArtwork(media, await aniZip(media.id)),
        ),
      );
      return { results };
    } catch (err) {
      Logger.error(`[Miruro] spotlight failed: ${String(err)}`);
      return null;
    }
  }

  static async schedule(page = 1, perPage = 20) {
    try {
      const data = await this.anilistQuery(
        `query ($page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            pageInfo { total currentPage lastPage hasNextPage perPage }
            airingSchedules(notYetAired: true, sort: TIME) {
              episode
              airingAt
              timeUntilAiring
              media {
                ${MEDIA_LIST_FIELDS}
              }
            }
          }
        }`,
        { page, perPage },
      );
      return {
        ...paged(data.Page?.pageInfo, page, perPage),
        results: (data.Page?.airingSchedules || []).map((item: any) => ({
          ...item.media,
          next_episode: item.episode,
          airingAt: item.airingAt,
          timeUntilAiring: item.timeUntilAiring,
        })),
      };
    } catch (err) {
      Logger.error(`[Miruro] schedule failed: ${String(err)}`);
      return null;
    }
  }

  static async info(anilistId: string | number) {
    try {
      const [data, mappings] = await Promise.all([
        this.anilistQuery(
          `query ($id: Int) {
            Media(id: $id, type: ANIME) {
              ${MEDIA_FULL_FIELDS}
            }
          }`,
          { id: Number(anilistId) },
        ),
        aniZip(anilistId),
      ]);
      return data.Media ? withArtwork(data.Media, mappings) : null;
    } catch (err) {
      Logger.error(`[Miruro] info failed for ${anilistId}: ${String(err)}`);
      return null;
    }
  }

  static async characters(anilistId: string | number, page = 1, perPage = 25) {
    try {
      const data = await this.anilistQuery(
        `query ($id: Int, $page: Int, $perPage: Int) {
          Media(id: $id, type: ANIME) {
            id
            title { romaji english }
            characters(sort: [ROLE, RELEVANCE], page: $page, perPage: $perPage) {
              pageInfo { total currentPage lastPage hasNextPage perPage }
              edges {
                role
                node {
                  id
                  name { full native userPreferred }
                  image { large medium }
                  description
                  gender
                  dateOfBirth { year month day }
                  age
                  favourites
                  siteUrl
                }
                voiceActors {
                  id
                  name { full native }
                  image { large }
                  languageV2
                }
              }
            }
          }
        }`,
        { id: Number(anilistId), page, perPage },
      );
      const characters = data.Media?.characters;
      return {
        ...paged(characters?.pageInfo, page, perPage),
        characters: characters?.edges || [],
      };
    } catch (err) {
      Logger.error(`[Miruro] characters failed for ${anilistId}: ${String(err)}`);
      return null;
    }
  }

  static async relations(anilistId: string | number) {
    try {
      const data = await this.anilistQuery(
        `query ($id: Int) {
          Media(id: $id, type: ANIME) {
            id
            title { romaji english }
            relations {
              edges {
                relationType(version: 2)
                node {
                  id
                  title { romaji english native }
                  coverImage { large }
                  bannerImage
                  format
                  type
                  status
                  episodes
                  chapters
                  meanScore
                  averageScore
                  popularity
                  startDate { year month day }
                }
              }
            }
          }
        }`,
        { id: Number(anilistId) },
      );
      if (!data.Media) return null;
      return {
        id: data.Media.id,
        title: data.Media.title,
        relations: data.Media.relations?.edges || [],
      };
    } catch (err) {
      Logger.error(`[Miruro] relations failed for ${anilistId}: ${String(err)}`);
      return null;
    }
  }

  static async recommendations(anilistId: string | number, page = 1, perPage = 10) {
    try {
      const data = await this.anilistQuery(
        `query ($id: Int, $page: Int, $perPage: Int) {
          Media(id: $id, type: ANIME) {
            id
            title { romaji english }
            recommendations(sort: RATING_DESC, page: $page, perPage: $perPage) {
              pageInfo { total currentPage lastPage hasNextPage perPage }
              nodes {
                rating
                mediaRecommendation {
                  id
                  title { romaji english native }
                  coverImage { large extraLarge }
                  bannerImage
                  format
                  episodes
                  status
                  meanScore
                  averageScore
                  popularity
                  genres
                  startDate { year }
                }
              }
            }
          }
        }`,
        { id: Number(anilistId), page, perPage },
      );
      const recommendations = data.Media?.recommendations;
      return {
        ...paged(recommendations?.pageInfo, page, perPage),
        recommendations: recommendations?.nodes || [],
      };
    } catch (err) {
      Logger.error(`[Miruro] recommendations failed for ${anilistId}: ${String(err)}`);
      return null;
    }
  }

  static async episodes(anilistId: string | number) {
    try {
      const entry = await this.lookup(anilistId);
      if (!entry) return null;

      const kind = entry.format === "MOVIE" ? "film" : "regular";
      const { data } = await catalog<{ data: CatalogEpisode[] }>(
        `anime/${entry.id}/episodes?kind=${kind}&limit=10000`,
      );
      return {
        id: entry.id,
        anilistId: Number(anilistId),
        episodes: data.map((ep) => ({
          id: `watch/all/${Number(anilistId)}/all/${ep.episode_number}`,
          number: ep.episode_number,
          title: ep.title,
          description: ep.synopsis,
          image: ep.thumbnail_url,
          airDate: ep.aired_on,
          duration: ep.duration_seconds,
          filler: ep.canon_type === "filler",
          skipTimes: (ep.skip_times ?? []).map((skip) => ({
            type: skip.kind,
            start: skip.start_seconds,
            end: skip.end_seconds,
          })),
        })),
      };
    } catch (err) {
      Logger.error(`[Miruro] episodes failed for ${anilistId}: ${String(err)}`);
      return null;
    }
  }

  static async watch(provider: string, anilistId: string | number, category: string, slug: string) {
    try {
      const episode = Number(slug.match(/(\d+)$/)?.[1]);
      if (!episode) return null;

      const entry = await this.lookup(anilistId);
      if (!entry) return null;

      const { tracks } = await catalog<Playback>(`anime/${entry.id}/episodes/${episode}/play`);
      const matched = tracks
        .filter(({ track }) => category === "all" || track === category)
        .map(({ track, providers }) => ({
          track,
          providers: providers
            .filter((item) => provider === "all" || item.provider === provider)
            .map(withProxies),
        }))
        .filter(({ providers }) => providers.length > 0);

      return matched.length ? { anilistId: Number(anilistId), episode, tracks: matched } : null;
    } catch (err) {
      Logger.error(`[Miruro] watch failed for ${anilistId}/${slug}: ${String(err)}`);
      return null;
    }
  }
}
