import * as cheerio from "cheerio";
import { fetcher } from "../../../core/lib/fetcher";
import { Logger } from "../../../core/logger";
import { proxyUrl } from "../../../core/proxy";
import { animepahe as BASE_URL } from "../../origins";
import {
  decrypt,
  substringAfter,
  substringAfterLast,
  substringBefore,
  unpackJsAndCombine,
  USER_AGENT,
} from "./scraper";
import type {
  AiringItem,
  AiringResponse,
  AnimeMeta,
  AnimeSearchItem,
  Episode,
  ReleaseResponse,
  SearchResponse,
  StreamResult,
} from "./types";

const IMAGE_BASE = BASE_URL.replace("://", "://i.");
const SITE_HEADERS = { Referer: `${BASE_URL}/`, "User-Agent": USER_AGENT };
const KWIK_HEADERS = { Referer: "https://kwik.cx/" };
const DOWNLOAD_ATTEMPTS = 20;

const list = <T>(value: T[] | undefined): T[] => (Array.isArray(value) ? value : []);

const image = (path: string | undefined, folder: string) =>
  !path || path.startsWith("http") ? (path ?? "") : `${IMAGE_BASE}/${folder}/${path}`;

const isoDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
};

export class AnimepaheUnavailable extends Error {}

export class Animepahe {
  private static async load(url: string): Promise<string | null> {
    const res = await fetcher(url, true, "animepahe");
    if (res?.success) return res.text;
    if (res?.status === 404) return null;
    throw new AnimepaheUnavailable(`Animepahe responded ${res?.status ?? "with no response"}`);
  }

  private static async api<T>(query: string): Promise<T | null> {
    const text = await this.load(`${BASE_URL}/api?${query}`);
    if (text === null) return null;
    try {
      return JSON.parse(text) as T;
    } catch (err) {
      Logger.warn(`[Animepahe] API returned invalid JSON for ${query}: ${String(err)}`);
      throw new AnimepaheUnavailable("Animepahe returned an invalid response");
    }
  }

  private static async page(path: string) {
    const text = await this.load(`${BASE_URL}${path}`);
    return text === null ? null : cheerio.load(text);
  }

  static async search(query: string): Promise<AnimeSearchItem[]> {
    const json = await this.api<SearchResponse>(`m=search&l=8&q=${encodeURIComponent(query)}`);
    return list(json?.data).map((item) => ({
      id: item.session,
      title: item.title,
      type: item.type,
      episodes: item.episodes,
      status: item.status,
      year: item.year,
      score: item.score,
      poster: image(item.poster, "posters"),
      session: item.session,
    }));
  }

  static async latest(): Promise<AiringItem[]> {
    const json = await this.api<AiringResponse>("m=airing&page=1");
    return list(json?.data).map((item) => ({
      id: item.anime_session,
      title: item.anime_title,
      episode: item.episode,
      snapshot: image(item.snapshot, "screenshots"),
      session: item.session,
      fansub: item.fansub,
      created_at: item.created_at,
    }));
  }

  static async info(id: string): Promise<AnimeMeta | null> {
    try {
      const $ = await this.page(`/anime/${id}`);
      if (!$) return null;

      const synopsis = $(".anime-synopsis");
      synopsis.find("br").replaceWith("\n");
      const background = $("div.anime-cover").attr("data-src")?.trim();

      let aired = "";
      let duration = "";
      $(".anime-info p").each((_, el) => {
        const text = $(el).text().replace(/\s+/g, " ").trim();
        if (text.startsWith("Aired:")) aired = text.replace("Aired:", "").trim();
        else if (text.startsWith("Duration:")) duration = text.replace("Duration:", "").trim();
      });

      return {
        id,
        name: $('span[style="user-select:text"]').text().trim(),
        description: synopsis.text().trim(),
        poster: $("div.anime-poster a").attr("href")?.trim() || null,
        background: background
          ? background.startsWith("http")
            ? background
            : `https:${background}`
          : null,
        aired,
        duration,
        genres: $(".anime-genre li")
          .toArray()
          .map((el) => $(el).text().trim()),
        externalLinks: $(".external-links a")
          .toArray()
          .flatMap((el) => {
            const href = $(el).attr("href");
            if (!href) return [];
            try {
              return [new URL(href, BASE_URL).href];
            } catch {
              return [];
            }
          }),
      };
    } catch (err) {
      if (err instanceof AnimepaheUnavailable) throw err;
      Logger.error(`[Animepahe] info failed for ${id}: ${String(err)}`);
      return null;
    }
  }

  static async fetchAllEpisodes(id: string): Promise<Episode[] | null> {
    const first = await this.api<ReleaseResponse>(`m=release&id=${id}&sort=episode_dsc&page=1`);
    if (!first) return null;

    const rest = await Promise.all(
      Array.from({ length: Math.max((first.last_page ?? 1) - 1, 0) }, (_, i) =>
        this.api<ReleaseResponse>(`m=release&id=${id}&sort=episode_dsc&page=${i + 2}`),
      ),
    );

    return [first, ...rest]
      .flatMap((page) => list(page?.data))
      .map((ep) => ({
        title: ep.title || `Episode ${ep.episode}`,
        episode: ep.episode,
        released: isoDate(ep.created_at),
        snapshot: image(ep.snapshot, "screenshots"),
        duration: ep.duration,
        filler: ep.filler === 1,
        session: ep.session,
      }))
      .sort((a, b) => a.episode - b.episode);
  }

  static async *streams(animeId: string, episodeSession: string): AsyncGenerator<StreamResult> {
    try {
      const $ = await this.page(`/play/${animeId}/${episodeSession}`);
      if (!$) return;

      const heading = $(".theatre-info h1 a");
      const animeName = heading.attr("title")?.trim() || heading.text().trim() || "Anime";
      const episode =
        $("#episodeMenu")
          .text()
          .match(/\d+(?:\.\d+)?/)?.[0] || "X";
      const downloads = $("div#pickDownload > a").toArray();
      const candidates = $("div#resolutionMenu > button")
        .toArray()
        .map((el, i) => ({
          audio: $(el).attr("data-audio") ?? "unknown",
          quality: $(el).attr("data-resolution") ?? "unknown",
          kwikLink: $(el).attr("data-src") ?? "",
          paheWinLink: (downloads[i] && $(downloads[i]).attr("href")) ?? "",
        }))
        .filter(({ kwikLink }) => kwikLink);

      const extractions = candidates.map(({ kwikLink, paheWinLink }) =>
        this.extractDirectUrl(kwikLink, paheWinLink),
      );

      for (const [i, { audio, quality, kwikLink, paheWinLink }] of candidates.entries()) {
        const directUrl = await extractions[i];
        if (!directUrl) continue;
        yield {
          id: `${animeId}--${quality}--${audio}`,
          title: `${audio} / ${quality}p`,
          url: kwikLink,
          directUrl,
          proxiedUrl: proxyUrl(directUrl, KWIK_HEADERS),
          quality,
          audio,
          downloadUrl:
            this.downloadUrl(directUrl, animeName, episode, audio, quality) || paheWinLink || null,
          corsHeaders: KWIK_HEADERS,
        };
      }
    } catch (err) {
      if (err instanceof AnimepaheUnavailable) throw err;
      Logger.error(`[Animepahe] streams failed for ${animeId}/${episodeSession}: ${String(err)}`);
    }
  }

  private static async extractDirectUrl(
    kwikLink: string,
    paheWinLink: string,
  ): Promise<string | null> {
    try {
      return await this.extractFromEmbed(kwikLink);
    } catch (err) {
      Logger.warn(`[Animepahe] Kwik embed extraction failed for ${kwikLink}: ${String(err)}`);
    }
    if (!paheWinLink) return null;
    try {
      return await this.extractFromDownload(paheWinLink);
    } catch (err) {
      Logger.warn(`[Animepahe] Download extraction failed for ${paheWinLink}: ${String(err)}`);
      return null;
    }
  }

  private static async extractFromEmbed(kwikLink: string): Promise<string> {
    const res = await fetcher(kwikLink, true, "kwik", {
      headers: { Referer: SITE_HEADERS.Referer },
    });
    if (!res?.success) throw new Error(`Kwik page responded ${res?.status ?? "with no response"}`);
    const $ = cheerio.load(res.text);
    const packed = $("script")
      .toArray()
      .map((el) => $(el).html() ?? "")
      .findLast((script) => script.includes("eval(function"));
    if (!packed) throw new Error("No packed script found on Kwik page");

    const unpacked = unpackJsAndCombine(
      `eval(function(${substringAfterLast(packed, "eval(function(")}`,
    );
    const url = substringBefore(substringAfter(unpacked, "const source='"), "';");
    if (!url.startsWith("http")) throw new Error("Failed to extract video URL from unpacked JS");
    return url;
  }

  private static async extractFromDownload(paheWinLink: string): Promise<string> {
    const redirect = await fetch(`${paheWinLink}/i`, { redirect: "manual", headers: SITE_HEADERS });
    const location = redirect.headers.get("location");
    if (!location) throw new Error("Failed to get kwik location from redirect");

    const kwik = await fetch(`https://${substringAfterLast(location, "https://")}`, {
      headers: KWIK_HEADERS,
    });
    const parts = (await kwik.text()).match(/"(\S+)",\d+,"(\S+)",(\d+),(\d+)/);
    if (!parts) throw new Error("Failed to extract token parts from kwik page");

    const form = decrypt(parts[1]!, parts[2]!, parts[3]!, parseInt(parts[4]!, 10));
    const action = form.match(/action="([^"]+)"/)?.[1];
    const token = form.match(/value="([^"]+)"/)?.[1];
    if (!action || !token) throw new Error("Failed to extract action URL or token from form");

    const cookie = kwik.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");

    for (let attempt = 1; attempt <= DOWNLOAD_ATTEMPTS; attempt++) {
      const res = await fetch(action, {
        method: "POST",
        redirect: "manual",
        headers: {
          Referer: kwik.url,
          Cookie: cookie,
          "User-Agent": USER_AGENT,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ _token: token }).toString(),
      });
      if (res.status === 302) {
        const url = res.headers.get("location");
        if (url) return url;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error("Download link extraction failed");
  }

  private static downloadUrl(
    directUrl: string,
    title: string,
    episode: string | number,
    audio: string,
    quality: string,
  ): string | null {
    if (!directUrl.includes("/stream/") || !URL.canParse(directUrl)) return null;

    const url = new URL(directUrl);
    url.pathname = url.pathname.replace("/stream/", "/mp4/").replace(/(\/uwu)?\.m3u8$/, "");

    const name = title.replace(/[^a-z0-9]/gi, "_").replace(/_+/g, "_");
    url.searchParams.set(
      "file",
      `${name}_-_${audio === "eng" ? "Dub" : "Sub"}_-_${quality}p_-_Episode_${episode}.mp4`,
    );
    return url.href;
  }
}
