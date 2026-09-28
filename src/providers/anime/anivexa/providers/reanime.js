import { getMedia } from "../core/anilist.js";
import { memo, TTL } from "../core/cache.js";
import { fetchJson, fetchText, notFound, UA, withStatus } from "../core/http.js";
import { buildTitles, uniqueBy, watchId } from "../core/utils.js";
import { extractFlixcloud } from "../extractors/flixcloud.js";
import { flixcloudHlsUrl } from "../extractors/flixcloud-hls.js";

const BASE = "https://reanime.to";
const FLIX = "https://flixcloud.cc";
const LABEL = "reanime";
const HEADERS = { "User-Agent": UA, Accept: "application/json, */*" };
const SERVER_ORDER = { "HD-2": 0, "HD-1": 1 };

function api(path) {
  return fetchJson(`${BASE}${path}`, { label: LABEL, headers: HEADERS });
}

function embedUrl(link, audio) {
  if (audio !== "dub" || !URL.canParse(link)) return link;
  const url = new URL(link);
  url.searchParams.set("a", "1");
  return url.href;
}

function coverAnilistId(cover) {
  for (const url of [cover?.extra_large, cover?.large, cover?.medium].filter(Boolean)) {
    const id = url.match(/anilist\.co\/.*\/bx(\d+)-/)?.[1];
    if (id) return Number(id);
  }
  return null;
}

function count(value) {
  return Number.isFinite(value) ? value : null;
}

function identity(animeId, source, anilistId, matchType, matchScore, malId = null) {
  return {
    animeId,
    title: source.title?.english || source.title?.romaji || animeId,
    anilistId: Number(anilistId),
    malId,
    subbed: count(source.subbed),
    dubbed: count(source.dubbed),
    episodesCount: count(source.episodes),
    matchType,
    matchScore,
  };
}

function resolveSeries(anilistId, ctx = {}) {
  return memo(`series:reanime:${anilistId}`, TTL.identity, async () => {
    const media = ctx.media ?? (await getMedia(anilistId));
    const results = await Promise.all(
      buildTitles(media, ctx.anizip)
        .slice(0, 5)
        .map((query) =>
          api(`/api/v1/search?${new URLSearchParams({ q: query, limit: 10 })}`)
            .then((data) => (Array.isArray(data?.results) ? data.results : []))
            .catch(() => []),
        ),
    );
    const candidates = uniqueBy(
      results.flat().filter((result) => result?.anime_id),
      (result) => result.anime_id,
    );
    const byCover = candidates.find(
      (result) => coverAnilistId(result.cover_image) === Number(anilistId),
    );
    if (byCover) return identity(byCover.anime_id, byCover, anilistId, "cover_image", 1);
    const details = await Promise.all(
      candidates
        .filter((result) => coverAnilistId(result.cover_image) === null)
        .map(async (result) => ({
          result,
          detail: await api(`/api/v1/anime/${result.anime_id}`).catch(() => null),
        })),
    );
    const byAnilist = details.find(
      ({ detail }) => Number(detail?.anilist_id) === Number(anilistId),
    );
    if (byAnilist)
      return {
        ...identity(
          byAnilist.result.anime_id,
          byAnilist.detail,
          anilistId,
          "anilist",
          1,
          byAnilist.detail.mal_id || null,
        ),
        title:
          byAnilist.detail.title?.english ||
          byAnilist.detail.title?.romaji ||
          byAnilist.result.title?.english ||
          byAnilist.result.anime_id,
      };
    const malId = Number(media?.idMal) || null;
    const byMal =
      malId && details.find(({ detail }) => detail?.mal_id && Number(detail.mal_id) === malId);
    if (byMal) return identity(byMal.result.anime_id, byMal.detail, anilistId, "mal", 0.9, malId);
    throw new Error(`No confirmed reanime match for AniList ${anilistId}`);
  });
}

function mergeEpisode(anilistId, episode, meta, audio) {
  const number = episode.episode_number;
  return {
    id: watchId("reanime", anilistId, audio, number),
    number,
    title: meta?.title?.en || meta?.title?.["x-jat"] || episode.title || `Episode ${number}`,
    titleJapanese: meta?.title?.ja || episode.title_japanese || null,
    titleRomanji: meta?.title?.["x-jat"] || episode.title_romanji || null,
    image: meta?.image || episode.thumbnail || null,
    airDate: meta?.airdate || episode.aired || null,
    duration: meta?.runtime ? meta.runtime * 60 : episode.duration ? episode.duration * 60 : null,
    score: null,
    filler: episode.is_filler ?? meta?.filler ?? false,
    recap: episode.is_recap ?? false,
    description: meta?.overview || episode.description || null,
    audio,
  };
}

export async function getEpisodes(anilistId, ctx = {}) {
  const series = await resolveSeries(anilistId, ctx);
  const data = await api(
    `/api/v1/anime/${series.animeId}/episodes?${new URLSearchParams({ limit: 2000 })}`,
  );
  const episodes = Array.isArray(data?.data) ? data.data : [];
  if (!episodes.length)
    throw new Error(`No reanime episodes found for AniList ${anilistId} (slug ${series.animeId})`);
  const hasSub = series.subbed == null || series.subbed > 0;
  const dubCount = series.dubbed ?? 0;
  const sub = [];
  const dub = [];
  for (const episode of episodes) {
    const meta = ctx.anizip?.episodes?.[String(episode.episode_number)] ?? null;
    if (hasSub) sub.push(mergeEpisode(anilistId, episode, meta, "sub"));
    if (dubCount > 0 && episode.episode_number <= dubCount)
      dub.push(mergeEpisode(anilistId, episode, meta, "dub"));
  }
  sub.sort((a, b) => a.number - b.number);
  dub.sort((a, b) => a.number - b.number);
  return {
    meta: { title: series.title, malId: series.malId, animeId: series.animeId },
    episodes: { sub, dub },
  };
}

async function resolveStreams(anilistId, audio, episode) {
  const series = await resolveSeries(anilistId);
  const flixData = await api(`/api/flix/${anilistId}/${episode}`).catch(() => null);
  const links = flixData?.success ? (flixData.servers ?? []) : [];
  const types = audio === "sub" ? ["sub", "s-sub"] : ["dub", "s-dub"];
  const servers = uniqueBy(
    links
      .filter((server) => types.includes(server.dataType))
      .sort((a, b) => (SERVER_ORDER[a.serverName] ?? 9) - (SERVER_ORDER[b.serverName] ?? 9)),
    (server) => `${server.serverName}:${server.dataType}:${server.dataLink}`,
  );
  if (!servers.length) throw notFound(`No ${audio} servers for "${series.title}" ep ${episode}`);
  const decrypted = await Promise.all(
    servers.map(async (server, index) => {
      const embed = embedUrl(server.dataLink, audio);
      try {
        const html = await fetchText(embed, {
          label: LABEL,
          headers: { ...HEADERS, Referer: `${BASE}/` },
        });
        const stream = await extractFlixcloud(html, {
          apiBase: FLIX,
          headers: HEADERS,
          referer: `${BASE}/`,
        });
        return { server, embed, stream, index };
      } catch (error) {
        return { server, error: error.message, index };
      }
    }),
  );
  const streams = decrypted.filter((item) => item.stream?.url);
  if (!streams.length)
    throw withStatus(
      new Error(decrypted.find((item) => item.error)?.error || "No decrypted streams"),
      502,
    );
  return { series, servers, streams, failed: decrypted.filter((item) => item.error) };
}

export async function watch(anilistId, audio, episode, { basePath = "" } = {}) {
  const { series, servers, streams, failed } = await resolveStreams(anilistId, audio, episode);
  const [{ stream, server }] = streams;
  return {
    anime: series.title,
    slug: series.animeId,
    ep: episode,
    audio,
    server: server.serverName,
    stream_url: stream.url,
    proxiedUrl: flixcloudHlsUrl(stream, basePath),
    streams: uniqueBy(
      streams.map((item) => ({
        server: item.server.serverName,
        audio: item.server.dataType,
        index: item.index,
        url: item.stream.url,
        proxiedUrl: flixcloudHlsUrl(item.stream, basePath),
        type: "hls",
        embed: item.embed,
        subtitles: item.stream.subtitles ?? [],
        thumbnails_vtt: item.stream.thumbnails_vtt ?? null,
        video_title: item.stream.video_title ?? null,
        intro: item.stream.intro_chapter ?? null,
        outro: item.stream.outro_chapter ?? null,
      })),
      (item) => item.url,
    ),
    subtitles: stream.subtitles,
    thumbnails_vtt: stream.thumbnails_vtt,
    video_title: stream.video_title,
    intro: stream.intro_chapter,
    outro: stream.outro_chapter,
    embeds: servers.map((item) => ({
      name: item.serverName,
      type: item.dataType,
      url: embedUrl(item.dataLink, audio),
    })),
    allServers: servers.map((item) => ({
      name: item.serverName,
      type: item.dataType,
      embed: embedUrl(item.dataLink, audio),
    })),
    failedServers: failed.map((item) => ({
      name: item.server.serverName,
      type: item.server.dataType,
      error: item.error,
    })),
  };
}

export async function stream(anilistId, audio, episode, { basePath = "" } = {}) {
  const [first] = (await resolveStreams(anilistId, audio, episode)).streams;
  return flixcloudHlsUrl(first.stream, basePath);
}
