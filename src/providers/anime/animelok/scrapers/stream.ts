import { lookerFetch } from "../lib/fetch";
import { buildFullSlug } from "../lib/slug";
import { QUALITY_ORDER } from "../lib/const";
import type {
  BilingualStreamResult,
  DirectStream,
  EmbedStream,
  LangTrack,
  ServerGroup,
  StreamResult,
} from "../lib/types";

// ─── Server categorisation ────────────────────────────────────────────────────

/**
 * Push a server entry into the correct bucket (direct HLS/MP4 vs embed).
 * Handles stringified JSON arrays (Pahe-style) and auto-detects quality.
 * Ported from animelok-worker/src/index.js → collectServer().
 */
function collectServer(
  srv: any,
  direct: DirectStream[],
  embeds: EmbedStream[],
) {
  const rawUrl = srv.url;
  if (!rawUrl) return;

  const serverName: string = srv.name || srv.server || "Unknown";
  let items: Array<{ url: string; quality: string; server: string }> = [];

  // 1. Try to parse JSON array (Pahe style)
  const trimmed = typeof rawUrl === "string" ? rawUrl.trim() : "";
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        items = parsed.map((p: any) => ({
          url: p.url,
          quality: p.quality || srv.quality || "unknown",
          server: serverName,
        }));
      }
    } catch {
      // Not valid JSON — fall through
    }
  }

  // 2. Fallback to single URL
  if (items.length === 0) {
    items.push({
      url: rawUrl,
      quality: srv.quality || "unknown",
      server: serverName,
    });
  }

  // 3. Normalise owocdn vault URLs to correct vault/shard
  for (const item of items) {
    item.url = item.url.replace(
      ///https:\/\/vault-\d+\.owocdn\.top\/stream\/\d+\/\d+\//,
      "https://vault-99.owocdn.top/stream/99/01",
      "https://vault-16.owocdn.top/stream/16/12",
    );
    item.url = item.url.replace(
      ///https:\/\/vault-\d+\.owocdn\.top\/stream\/\d+\/\d+\//,
      "https://vault-99.owocdn.top/stream/99/02",
      "https://vault-16.owocdn.top/stream/16/10",
    );
  }

  // 4. Categorise and auto-detect quality from URL
  for (const item of items) {
    if (!item.url) continue;

    const urlLower = item.url.toLowerCase();
    const type = (srv.type || "").toLowerCase();

    if (!item.quality || item.quality === "unknown") {
      if (urlLower.includes("master.m3u8")) item.quality = "Multi";
      else if (urlLower.includes("1080p") || urlLower.includes("/1080/")) item.quality = "1080p";
      else if (urlLower.includes("720p") || urlLower.includes("/720/")) item.quality = "720p";
      else if (urlLower.includes("480p") || urlLower.includes("/480/")) item.quality = "480p";
      else if (urlLower.includes("360p") || urlLower.includes("/360/")) item.quality = "360p";
    }

    const isDirect =
      type === "hls" ||
      type === "m3u8" ||
      type === "mp4" ||
      urlLower.includes(".m3u8") ||
      urlLower.includes(".mp4");

    if (isDirect) {
      direct.push({ url: item.url, quality: item.quality || "unknown", server: item.server });
    } else {
      embeds.push({ url: item.url, server: item.server });
    }
  }
}

// ─── Per-language helper ──────────────────────────────────────────────────────

/**
 * Given the raw server list from the API, extract and group streams for a
 * single language. Mutates nothing; returns a self-contained LangTrack.
 */
function buildLangTrack(
  rawServers: any[],
  langUpper: string,
  preferQuality: string,
): LangTrack {
  const direct: DirectStream[] = [];
  const embeds: EmbedStream[] = [];

  // First pass: language-matched servers only
  for (const srv of rawServers) {
    const hasLang = !srv.languages?.length || srv.languages.includes(langUpper);
    if (!hasLang) continue;
    collectServer(srv, direct, embeds);
  }

  // Fallback: all servers when nothing matched
  if (direct.length === 0 && embeds.length === 0) {
    for (const srv of rawServers) collectServer(srv, direct, embeds);
  }

  // Sort by preferred quality then global QUALITY_ORDER
  direct.sort((a, b) => {
    if (a.quality === preferQuality && b.quality !== preferQuality) return -1;
    if (b.quality === preferQuality && a.quality !== preferQuality) return 1;
    const idxA = QUALITY_ORDER.indexOf(a.quality);
    const idxB = QUALITY_ORDER.indexOf(b.quality);
    const rankA = idxA === -1 ? QUALITY_ORDER.length - 1.5 : idxA;
    const rankB = idxB === -1 ? QUALITY_ORDER.length - 1.5 : idxB;
    return rankA - rankB;
  });

  // Group by server name
  const serverMap = new Map<string, Omit<DirectStream, "server">[]>();
  for (const { url, quality, server } of direct) {
    const key = server.toLowerCase();
    if (!serverMap.has(key)) serverMap.set(key, []);
    serverMap.get(key)!.push({ url, quality });
  }
  const servers: ServerGroup[] = Array.from(serverMap.entries()).map(
    ([server, streams]) => ({ server, streams }),
  );

  // Extract hash from first embed URL matching .../video/{hash}
  const hashMatch = embeds
    .map((e) => e.url?.match(/\/video\/([a-f0-9]+)$/i))
    .find(Boolean);
  const hash = hashMatch ? hashMatch[1] : null;

  return { hash, servers, embeds, best: direct[0]?.url ?? embeds[0]?.url ?? null };
}

// ─── Stream scraper ───────────────────────────────────────────────────────────

/**
 * Fetch stream sources for a single episode (one language).
 *
 * Maps to: GET /anime/animelok/stream/:anilistId/:episode?title=&lang=&quality=
 */
export async function scrapeStream(
  anilistId: string,
  episodeNumber: string,
  title: string,
  lang: string = "JAPANESE",
  preferQuality: string = "1080p",
): Promise<StreamResult> {
  const fullSlug = buildFullSlug(title, anilistId);
  const apiPath = `/api/anime/${fullSlug}/episodes/${episodeNumber}`;
  const data = await lookerFetch(apiPath, fullSlug);
  const rawServers: any[] = data.episode?.servers ?? [];

  const langUpper = lang.toUpperCase();
  const track = buildLangTrack(rawServers, langUpper, preferQuality);

  return {
    episodeNumber: parseInt(episodeNumber, 10),
    lang: langUpper,
    ...track,
  };
}

/**
 * Fetch Japanese (sub) and English (dub) streams in parallel for one episode.
 * The raw server list is fetched ONCE; both language tracks are derived from
 * the same payload — no duplicate network requests.
 *
 * Maps to: GET /anime/animelok/stream/:anilistId/:episode?title=&quality=
 */
export async function scrapeStreamBilingual(
  anilistId: string,
  episodeNumber: string,
  title: string,
  preferQuality: string = "1080p",
): Promise<BilingualStreamResult> {
  const fullSlug = buildFullSlug(title, anilistId);
  const apiPath = `/api/anime/${fullSlug}/episodes/${episodeNumber}`;
  const data = await lookerFetch(apiPath, fullSlug);
  const rawServers: any[] = data.episode?.servers ?? [];

  // Derive both language tracks from the same raw server list (no extra fetches)
  const [sub, dub] = await Promise.all([
    Promise.resolve(buildLangTrack(rawServers, "JAPANESE", preferQuality)),
    Promise.resolve(buildLangTrack(rawServers, "ENGLISH", preferQuality)),
  ]);

  return {
    episodeNumber: parseInt(episodeNumber, 10),
    preferQuality,
    sub,
    dub,
  };
}