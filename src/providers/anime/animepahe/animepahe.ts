import * as cheerio from "cheerio";
import { compareTwoStrings } from "string-similarity";
import { Logger } from "../../../core/logger";
import {
  DDOS_GUARD_HEADERS,
  decrypt,
  getMapValue,
  substringAfter,
  substringAfterLast,
  substringBefore,
  unpackJsAndCombine,
  USER_AGENT,
} from "./scraper";
import type {
  AiringItem,
  AnimeMeta,
  AnimeSearchItem,
  Episode,
  StreamResult,
} from "./types";
import {
  airingSchema,
  releaseSchema,
  searchSchema,
} from "./types";


import { animepahe as ANIMEPAHE_BASE_URL } from "../../origins";
import { proxifySource } from "../../../core/proxy";

// ─── Regex for external ID extraction ──────────────────────────────────────

const MAL_ID_REGEX = /myanimelist\.net\/anime\/(\d+)/;
const ANILIST_ID_REGEX = /anilist\.co\/anime\/(\d+)/;

export class Animepahe {
  private static headers(): Record<string, string> {
    return { ...DDOS_GUARD_HEADERS };
  }

  // ── Search ──────────────────────────────────────────────────────────────

  static async search(query: string): Promise<AnimeSearchItem[]> {
    try {
      const res = await fetch(
        `${ANIMEPAHE_BASE_URL}/api?m=search&l=8&q=${encodeURIComponent(query)}`,
        { headers: this.headers() },
      );

      const json = await res.json().catch(() => null);
      if (!json) return [];

      const parsed = searchSchema.safeParse(json);
      if (!parsed.success) return [];

      return parsed.data.data.map((item) => ({
        id: item.session,
        title: item.title,
        type: item.type,
        episodes: item.episodes,
        status: item.status,
        year: item.year,
        score: item.score,
        poster: item.poster.startsWith("http") ? item.poster : `https://i.animepahe.si/posters/${item.poster}`,
        session: item.session,
      }));
    } catch {
      return [];
    }
  }

  // ── Latest / Airing ────────────────────────────────────────────────────

  static async latest(): Promise<AiringItem[]> {
    try {
      const res = await fetch(`${ANIMEPAHE_BASE_URL}/api?m=airing&page=1`, {
        headers: this.headers(),
      });

      const json = await res.json().catch(() => null);
      if (!json) return [];

      const parsed = airingSchema.safeParse(json);
      if (!parsed.success) return [];

      return parsed.data.data.map((item) => ({
        id: item.anime_session,
        title: item.anime_title,
        episode: item.episode,
        snapshot: item.snapshot.startsWith("http")
          ? item.snapshot
          : `https://i.animepahe.si/screenshots/${item.snapshot}`,
        session: item.session,
        fansub: item.fansub,
        created_at: item.created_at,
      }));
    } catch (err) {
      Logger.error(`AnimePahe latest error: ${String(err)}`);
      return [];
    }
  }

  // ── Info (meta + episodes + mappings) ──────────────────────────────────

  static async info(id: string): Promise<any | null> {
    try {
      const pageRes = await fetch(`${ANIMEPAHE_BASE_URL}/anime/${id}`, {
        headers: this.headers(),
      });
      const html = await pageRes.text();
      const $ = cheerio.load(html);

      const description =
        $(".anime-synopsis")
          .html()
          ?.replace(/<br\s*\/?>/g, "\n")
          .trim() ?? "";

      const name =
        $('span[style="user-select:text"]').text().trim() ?? "";

      const poster =
        $('img[data-src$=".jpg"]').attr("data-src")?.trim() ?? "";

      const backgroundSrc = $("div.anime-cover").attr("data-src")?.trim() ?? "";
      const background = backgroundSrc
        ? (backgroundSrc.startsWith("http") ? backgroundSrc : `https:${backgroundSrc}`)
        : "";

      let aired = "";
      let duration = "";
      $(".anime-info p").each((_, el) => {
        const text = $(el).text().replace(/\s+/g, " ").trim();
        if (text.startsWith("Aired:")) {
          aired = text.replace("Aired:", "").trim();
        } else if (text.startsWith("Duration:")) {
          duration = text.replace("Duration:", "").trim();
        }
      });

      const genres: string[] = [];
      $(".anime-genre li").each((_, el) => {
        genres.push($(el).text().trim());
      });

      let malId: number | null = null;
      let anilistId: number | null = null;
      const externalLinks: string[] = [];

      $(".external-links a").each((_, el) => {
        const href = $(el).attr("href");
        if (!href) return;
        try {
          const url = new URL(href, ANIMEPAHE_BASE_URL).href;
          externalLinks.push(url);
          const malMatch = MAL_ID_REGEX.exec(url);
          if (malMatch?.[1]) malId = parseInt(malMatch[1], 10);
          const anilistMatch = ANILIST_ID_REGEX.exec(url);
          if (anilistMatch?.[1]) anilistId = parseInt(anilistMatch[1], 10);
        } catch { /* ignore */ }
      });

      const episodes = await this.fetchAllEpisodes(id);
      const mappings = (malId || anilistId ? {
        mal_id: malId,
        anilist_id: anilistId,
        themoviedb_id: null,
        imdb_id: null,
        thetvdb_id: null,
        kitsu_id: null,
        anidb_id: null,
        anisearch_id: null,
        livechart_id: null,
        animeplanet_id: null,
        notifymoe_id: null,
      } : null);

      return {
        id, name, description,
        poster: poster || null,
        background: background || null,
        aired, duration, genres, externalLinks, mappings, episodes,
      };
    } catch (err) {
      Logger.error(`AnimePahe info error: ${String(err)}`);
      return null;
    }
  }

  // ── Streams ────────────────────────────────────────────────────────────

  static async streams(
    animeId: string,
    episodeSession: string,
  ): Promise<StreamResult[]> {
    try {
      const [animeData, res] = await Promise.all([
        this.getMappingsAndName(animeId).catch(() => null),
        fetch(`${ANIMEPAHE_BASE_URL}/play/${animeId}/${episodeSession}`, {
          headers: this.headers(),
        })
      ]);

      const animeTitle = animeData?.name || "Anime";
      const html = await res.text();
      const $ = cheerio.load(html);

      const buttons = $("div#resolutionMenu > button").toArray();
      const downloadLinks = $("div#pickDownload > a").toArray();
      const results: StreamResult[] = [];

      const corsHeaders = {
        // "Origin": "https://animepahe.si",
        "Referer": "https://kwik.cx/",
        // "User-Agent": USER_AGENT,
      }

      // Try to find the episode number for the filename
      const episodes = await this.fetchAllEpisodes(animeId).catch(() => []);
      const episode = episodes.find(ep => ep.session === episodeSession);
      const epNum = episode?.episode || "X";

      for (let i = 0; i < buttons.length; i++) {
        const btn = $(buttons[i]);
        const audio = btn.attr("data-audio") ?? "unknown";
        const kwikLink = btn.attr("data-src") ?? "";
        const quality = btn.attr("data-resolution") ?? "unknown";
        const paheWinLink = $(downloadLinks[i]).attr("href") ?? "";

        if (kwikLink) {
          const directUrl = await this.extractDirectUrl(kwikLink, paheWinLink);
          if (!directUrl) continue;

          // Generate direct download URL (no tpahe) with filename
          const downloadUrl = this.generateDownloadUrl(
            directUrl,
            animeTitle,
            epNum,
            audio,
            quality
          ) || paheWinLink || null;

          const result = {
            id: `${animeId}--${quality}--${audio}`,
            title: `${audio} / ${quality}p`,
            url: kwikLink,
            directUrl,
            proxiedUrl: proxifySource(directUrl, corsHeaders),
            quality,
            audio,
            downloadUrl,
            corsHeaders
          }

          results.push(result);
        }
      }

      results.sort((a, b) => parseInt(b.quality) - parseInt(a.quality));
      Logger.info(`Found ${results.length} stream options for ${animeId}/${episodeSession}`);
      return results;
    } catch (err) {
      Logger.error(`AnimePahe streams error: ${String(err)}`);
      return [];
    }
  }

  // ── Resolve external IDs → AnimePahe ID ────────────────────────────────

  static async resolveByExternalId(params: {
    mal_id?: number;
    anilist_id?: number;
  }): Promise<string | null> {
    const lookupResult = await this.lookup(params);
    if (lookupResult.bestMatch) {
      Logger.info(`Resolved external ID to AnimePahe ID ${lookupResult.bestMatch.id}`);
      return lookupResult.bestMatch.id;
    }
    Logger.warn(`Could not resolve external IDs to AnimePahe ID`);
    return null;
  }

  // ── Get episode session by episode number ──────────────────────────────

  static async getEpisodeSession(
    animePaheId: string,
    episodeNumber: number,
  ): Promise<string | null> {
    try {
      const episodes = await this.fetchAllEpisodes(animePaheId);
      const episode = episodes.find(ep => ep.episode === episodeNumber);
      if (episode) {
        Logger.info(`Found episode ${episodeNumber} session: ${episode.session}`);
        return episode.session;
      }
      Logger.warn(`Episode ${episodeNumber} not found for anime ${animePaheId}`);
      return null;
    } catch (err) {
      Logger.error(`Error getting episode session: ${String(err)}`);
      return null;
    }
  }

  // ── Lookup by external ID ──────────────────────────────────────────────

  static async lookup(params: {
    mal_id?: number;
    anilist_id?: number;
  }): Promise<{
    mappings: any | null;
    results: Array<AnimeSearchItem & { similarity: number }>;
    bestMatch: (AnimeSearchItem & { similarity: number }) | null;
  }> {
    try {
      const results = await this.search(""); // This would need a proper title, but since we are removing anizip, we might not have it here
      // For now, removing anizip mapping means lookup might be limited
      return { mappings: null, results: [], bestMatch: null };
    } catch (err) {
      Logger.error(`AnimePahe lookup error: ${String(err)}`);
      return { mappings: null, results: [], bestMatch: null };
    }
  }

  // ── Get Mappings + Name (lightweight) ──────────────────────────────────

  static async getMappingsAndName(id: string): Promise<{ mappings: any | null; name: string } | null> {
    try {
      const pageRes = await fetch(`${ANIMEPAHE_BASE_URL}/anime/${id}`, {
        headers: this.headers(),
      });
      const html = await pageRes.text();
      const $ = cheerio.load(html);

      const name = $('span[style="user-select:text"]').text().trim() || "";

      let malId: number | null = null;
      let anilistId: number | null = null;

      $(".external-links a").each((_, el) => {
        const href = $(el).attr("href");
        if (!href) return;
        try {
          const url = new URL(href, ANIMEPAHE_BASE_URL).href;
          const malMatch = MAL_ID_REGEX.exec(url);
          if (malMatch?.[1]) malId = parseInt(malMatch[1], 10);
          const anilistMatch = ANILIST_ID_REGEX.exec(url);
          if (anilistMatch?.[1]) anilistId = parseInt(anilistMatch[1], 10);
        } catch { /* ignore */ }
      });

      const mappings = (malId || anilistId) ? {
          mal_id: malId, anilist_id: anilistId,
          themoviedb_id: null, imdb_id: null, thetvdb_id: null,
          kitsu_id: null, anidb_id: null, anisearch_id: null, livechart_id: null,
          animeplanet_id: null, notifymoe_id: null,
      } : null;
      return { mappings, name };
    } catch (err) {
      Logger.error(`Failed to get mappings for anime ${id}:`, err);
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ═══════════════════════════════════════════════════════════════════════



  static async fetchAllEpisodes(id: string): Promise<Episode[]> {
    try {
      const firstPage = await this.fetchReleasePage(id, 1);
      if (!firstPage) return [];

      const parsed = releaseSchema.safeParse(firstPage);
      if (!parsed.success) return [];

      let allData = [...parsed.data.data];

      if (parsed.data.last_page > 1) {
        const pages = Array.from(
          { length: parsed.data.last_page - 1 },
          (_, i) => i + 2,
        );
        const remaining = await Promise.all(
          pages.map((page) => this.fetchReleasePage(id, page)),
        );
        for (const pageData of remaining) {
          if (!pageData?.data) continue;
          const pageParsed = releaseSchema.safeParse(pageData);
          if (pageParsed.success) {
            allData = allData.concat(pageParsed.data.data);
          }
        }
      }

      const episodes: Episode[] = allData.map((ep) => ({
        title: ep.title || `Episode ${ep.episode}`,
        episode: ep.episode,
        released: new Date(ep.created_at).toISOString(),
        snapshot: ep.snapshot.startsWith("http")
          ? ep.snapshot
          : `https://i.animepahe.si/screenshots/${ep.snapshot}`,
        duration: ep.duration,
        filler: ep.filler === 1,
        session: ep.session,
      }));

      episodes.sort((a, b) => a.episode - b.episode);
      return episodes;
    } catch (err) {
      Logger.error(`AnimePahe fetchAllEpisodes error: ${String(err)}`);
      return [];
    }
  }

  private static async fetchReleasePage(
    id: string,
    page: number,
  ): Promise<Record<string, unknown> | null> {
    try {
      const res = await fetch(
        `${ANIMEPAHE_BASE_URL}/api?m=release&id=${id}&sort=episode_dsc&page=${page}`,
        { headers: this.headers() },
      );
      return (await res.json()) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  // ── Direct Stream Extraction ──────────────────────────────────────────

  private static async extractDirect(kwikLink: string): Promise<string> {
    const res = await fetch(kwikLink, {
      headers: { Referer: "https://animepahe.com", "User-Agent": USER_AGENT },
    });
    const body = await res.text();
    const $ = cheerio.load(body);

    let packedScript = "";
    $("script").each((_, el) => {
      const content = $(el).html() ?? "";
      if (content.includes("eval(function")) packedScript = content;
    });

    if (!packedScript) throw new Error("No packed script found on Kwik page");

    const scriptPart = substringAfterLast(packedScript, "eval(function(");
    const unpacked = unpackJsAndCombine("eval(function(" + scriptPart);
    const videoUrl = substringBefore(substringAfter(unpacked, "const source='"), "';");

    if (!videoUrl || !videoUrl.startsWith("http")) {
      throw new Error("Failed to extract video URL from unpacked JS");
    }
    return videoUrl;
  }

  // ── HLS Stream Extraction ─────────────────────────────────────────────

  private static async extractHls(
    paheWinLink: string,
    originalRes: Response,
  ): Promise<string> {
    const kwikHeadersRes = await fetch(`${paheWinLink}/i`, {
      redirect: "manual",
      headers: { Referer: "https://animepahe.com" },
    });

    const kwikLocation = getMapValue(
      JSON.stringify(Object.fromEntries(kwikHeadersRes.headers.entries())),
      "location",
    );
    if (!kwikLocation) throw new Error("Failed to get kwik location from redirect");

    const kwikUrl = `https://${substringAfterLast(kwikLocation, "https://")}`;
    const kwikRes = await fetch(kwikUrl, { headers: { Referer: "https://kwik.cx/" } });
    const kwikBody = await kwikRes.text();

    const tokenRegex = /"(\S+)",\d+,"(\S+)",(\d+),(\d+)/;
    const matches = kwikBody.match(tokenRegex);
    if (!matches || matches.length < 5) {
      throw new Error("Failed to extract token parts from kwik page");
    }

    const formHtml = decrypt(matches[1]!, matches[2]!, matches[3]!, parseInt(matches[4]!, 10));
    const urlMatch = formHtml.match(/action="([^"]+)"/);
    const tokMatch = formHtml.match(/value="([^"]+)"/);
    if (!urlMatch?.[1] || !tokMatch?.[1]) {
      throw new Error("Failed to extract action URL or token from decrypted form");
    }

    const actionUrl = urlMatch[1];
    const token = tokMatch[1];
    let statusCode = 419;
    let attempts = 0;
    let location = "";

    while (statusCode !== 302 && attempts < 20) {
      const originalHeaders = Object.fromEntries(originalRes.headers.entries());
      let cookie = originalHeaders["cookie"] ?? "";
      const setCookie = Object.fromEntries(kwikRes.headers.entries())["set-cookie"] ?? "";
      cookie += `; ${setCookie.replace("path=/;", "")}`;

      const postRes = await fetch(actionUrl, {
        method: "POST",
        redirect: "manual",
        headers: {
          Referer: kwikRes.url,
          Cookie: cookie,
          "User-Agent": originalHeaders["user-agent"] ?? USER_AGENT,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ _token: token }).toString(),
      });

      statusCode = postRes.status;
      attempts++;
      if (statusCode === 302) {
        location = getMapValue(
          JSON.stringify(Object.fromEntries(postRes.headers.entries())),
          "location",
        ) ?? "";
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (!location) throw new Error(`HLS extraction failed after ${attempts} attempts`);
    return location;
  }

  private static async extractDirectUrl(kwikLink: string, paheWinLink?: string): Promise<string | null> {
    try {
      return await this.extractDirect(kwikLink);
    } catch (directError) {
      Logger.error(`Direct extraction failed: ${directError}`);
      if (paheWinLink) {
        try {
          const res = await fetch(kwikLink, { headers: this.headers() });
          return await this.extractHls(paheWinLink, res);
        } catch (hlsError) {
          Logger.error(`HLS extraction failed: ${hlsError}`);
        }
      }
      return null;
    }
  }

  private static generateDownloadUrl(
    directUrl: string,
    animeTitle: string,
    episode: string | number,
    audio: string,
    quality: string
  ): string | null {
    const mp4Base = this.getMp4Url(directUrl);
    if (!mp4Base) return null;

    const safeTitle = animeTitle.replace(/[^a-z0-9]/gi, "_").replace(/_+/g, "_");
    const epStr = String(episode);
    const audioStr = audio === "eng" ? "Dub" : "Sub";

    // Format: Title_-_Audio_-_Qualityp_-_Episode_X.mp4
    const filename = `${safeTitle}_-_${audioStr}_-_${quality}p_-_Episode_${epStr}.mp4`;
    return `${mp4Base}?file=${filename}`;
  }

  private static getMp4Url(m3u8Url: string): string | null {
    if (!m3u8Url || !m3u8Url.includes("/stream/")) return null;

    try {
      const urlObj = new URL(m3u8Url);
      const kwikDomain = "kwik.cx";

      const hostParts = urlObj.hostname.split(".");
      if (hostParts[0]?.startsWith("vault-")) {
        urlObj.hostname = `${hostParts[0]}.${kwikDomain}`;
      } else {
        urlObj.hostname = kwikDomain;
      }

      urlObj.pathname = urlObj.pathname.replace("/stream/", "/mp4/");

      if (urlObj.pathname.endsWith("/uwu.m3u8")) {
        urlObj.pathname = urlObj.pathname.replace("/uwu.m3u8", "");
      } else if (urlObj.pathname.endsWith(".m3u8")) {
        urlObj.pathname = urlObj.pathname.replace(".m3u8", "");
      }

      return urlObj.toString();
    } catch (_e) {
      // Fallback for simple replacement if URL object fails
      return m3u8Url
        .replace(".uwucdn.top", ".kwik.cx")
        .replace("/stream/", "/mp4/")
        .replace("/uwu.m3u8", "")
        .replace(".m3u8", "");
    }
  }
}
