import crypto from "node:crypto";
import { SERVER_ORIGIN } from "../../../../core/config";
import { proxyUrl } from "../../../../core/proxy";
import { isAllowed } from "../../../../core/proxyRoutes";
import { getMedia } from "../core/anilist.js";
import {
  browserFetch,
  fetchJson,
  notFound,
  parseJson,
  request,
  upstreamError,
  withStatus,
} from "../core/http.js";
import { episodeMeta, watchId } from "../core/utils.js";

const BASE = "https://senshi.to";
const VID_CLOUD = "https://s.vidcloud.se";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36";
const HEADERS = { "User-Agent": UA, Referer: `${BASE}/` };
const MEDIA_HEADERS = { ...HEADERS, Origin: BASE };
const PROXY_HEADERS = { Referer: `${BASE}/`, Origin: BASE };
const LABEL = "Senshi";
const HLS_ROUTE = "/hls/senshi/playlist.m3u8";
const CDN = /(?:^|\.)bcdn\d*\.se$/i;
const TIMEOUT = 15_000;
const MAX_REDIRECTS = 3;
const PLAYLIST_LIMIT = 5 * 1024 * 1024;
const ENCRYPTED = "EM3U8v1:";
const PLAYLIST_KEY = Buffer.from(
  "6ee2721327ed469bb6d93ab9b7a838045190b5ba85d9cea3b1e17805f7b4aef6",
  "hex",
);
const PLAYLIST_TAG = /^#EXT-X-(?:MEDIA|I-FRAME-STREAM-INF)\b/;
const CORS = { "Access-Control-Allow-Origin": "*" };

async function malIdFor(anilistId, ctx) {
  const media = ctx?.media ?? (await getMedia(anilistId));
  if (!media?.idMal) throw notFound(`Senshi: no MAL ID found for AniList ${anilistId}`);
  return media.idMal;
}

function playlistUrl(url, basePath) {
  return `${SERVER_ORIGIN}${basePath}${HLS_ROUTE}?url=${encodeURIComponent(url)}`;
}

function absolute(uri, base) {
  try {
    const url = new URL(uri, base);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function trusted(url) {
  return url?.protocol === "https:" && CDN.test(url.hostname);
}

function streamUrl(src, basePath) {
  return trusted(absolute(src))
    ? playlistUrl(src, basePath)
    : proxyUrl(src, PROXY_HEADERS, "hls");
}

async function fetchPlaylist(url, signal, hop = 0) {
  if (!trusted(url) || !(await isAllowed(url)))
    throw withStatus(new Error(`Senshi redirected off-network: ${url}`), 502);
  const response = await request(url, { headers: MEDIA_HEADERS, redirect: "manual", signal });
  const location =
    response.status >= 300 && response.status < 400 && response.headers.get("location");
  if (location && hop < MAX_REDIRECTS) {
    void response.body?.cancel();
    return fetchPlaylist(new URL(location, url), signal, hop + 1);
  }
  if (Number(response.headers.get("content-length")) > PLAYLIST_LIMIT) {
    void response.body?.cancel();
    throw withStatus(new Error("Senshi playlist too large"), 413);
  }
  const text = await response.text();
  if (!response.ok)
    throw withStatus(
      upstreamError(`Senshi playlist HTTP ${response.status}`, text, response.status),
      502,
    );
  return { text, base: url.href };
}

function decryptPlaylist(text) {
  if (!text.startsWith(ENCRYPTED)) return text;
  const bytes = Buffer.from(text.slice(ENCRYPTED.length), "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", PLAYLIST_KEY, bytes.subarray(0, 12));
  decipher.setAuthTag(bytes.subarray(-16));
  return Buffer.concat([decipher.update(bytes.subarray(12, -16)), decipher.final()]).toString(
    "utf8",
  );
}

function rewritePlaylist(playlist, base, basePath) {
  const master = playlist.includes("#EXT-X-STREAM-INF");
  const link = (uri, kind) => {
    const url = absolute(uri, base);
    if (!url) return uri;
    return kind === "playlist"
      ? streamUrl(url.href, basePath)
      : proxyUrl(url.href, PROXY_HEADERS, kind);
  };
  return playlist
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      if (!trimmed.startsWith("#")) return link(trimmed, master ? "playlist" : "segment");
      const kind = PLAYLIST_TAG.test(trimmed) ? "playlist" : "file";
      return trimmed.replace(/URI="([^"]+)"/g, (_, uri) => `URI="${link(uri, kind)}"`);
    })
    .join("\n");
}

export async function playlist({ url, basePath = "", request: incoming }) {
  const raw = url.searchParams.get("url") ?? "";
  const target = URL.canParse(raw) ? new URL(raw) : null;
  if (!target) throw withStatus(new Error("Invalid url"), 400);
  if (!trusted(target) || !(await isAllowed(target)))
    throw withStatus(new Error("Forbidden url"), 403);
  const timeout = AbortSignal.timeout(TIMEOUT);
  const signal = incoming?.signal ? AbortSignal.any([incoming.signal, timeout]) : timeout;
  const { text, base } = await fetchPlaylist(target, signal).catch((error) =>
    Promise.reject(error?.status ? error : withStatus(error, 502)),
  );
  let decoded;
  try {
    decoded = decryptPlaylist(text);
  } catch {
    throw withStatus(upstreamError("Senshi playlist could not be decrypted", text), 502);
  }
  if (!decoded.startsWith("#EXTM3U"))
    throw withStatus(upstreamError("Senshi playlist is not HLS", text), 502);
  return new Response(rewritePlaylist(decoded, base, basePath), {
    headers: {
      ...CORS,
      "Content-Type": "application/vnd.apple.mpegurl",
      "Cache-Control": "no-store",
    },
  });
}

async function listJson(path) {
  const data = await fetchJson(`${BASE}${path}`, { label: LABEL, headers: HEADERS });
  return Array.isArray(data) ? data : [];
}

function isDub(status) {
  return String(status ?? "").toLowerCase() === "dub";
}

function mapTrack(track) {
  const url = track?.vtt_url || track?.url;
  const label = track?.label || "English";
  if (!url || label.toLowerCase() === "chapter") return null;
  const lang = label.toLowerCase().split(/\s+/)[0];
  return {
    url,
    label,
    srclang: lang === "english" ? "en" : lang.slice(0, 2),
    default: Boolean(track.default),
  };
}

async function vidCloudSources(remoteSourceId) {
  const response = await browserFetch(
    `${VID_CLOUD}/_v1/sources?id=${encodeURIComponent(remoteSourceId)}`,
    {
      session: "senshi",
      headers: { ...HEADERS, Accept: "application/json,*/*", Origin: BASE },
    },
  );
  const text = await response.text();
  if (!response.ok)
    throw upstreamError(`Senshi vidcloud HTTP ${response.status}`, text, response.status);
  const data = parseJson(text, LABEL);
  return Array.isArray(data) ? data : data ? [data] : [];
}

export async function getEpisodes(anilistId, ctx = {}) {
  const malId = await malIdFor(anilistId, ctx);
  const [items, probe] = await Promise.all([
    listJson(`/episodes/${malId}`),
    listJson(`/episode-embeds/${malId}/1`).catch(() => []),
  ]);
  if (!items.length) throw new Error(`Senshi: no episodes for AniList ${anilistId} (MAL ${malId})`);
  const hasDub = probe.some((entry) => isDub(entry.status));
  const sub = [];
  const dub = [];
  for (const item of items) {
    const number = item.ep_id;
    const meta = episodeMeta(number, ctx);
    const base = {
      number,
      title: item.ep_title || meta.title || `Episode ${number}`,
      duration: meta.duration,
      filler: item.ep_filler || meta.filler || false,
      recap: item.ep_recap || false,
      uncensored: false,
      description: meta.description,
      image: item.ep_thumbnail || meta.image,
      airDate: meta.airDate,
    };
    sub.push({ id: watchId("senshi", anilistId, "sub", number), ...base, audio: "sub" });
    if (hasDub)
      dub.push({ id: watchId("senshi", anilistId, "dub", number), ...base, audio: "dub" });
  }
  sub.sort((a, b) => a.number - b.number);
  dub.sort((a, b) => a.number - b.number);
  return {
    meta: {
      title: ctx.media?.title?.english ?? ctx.media?.title?.romaji ?? null,
      malId,
      source: "senshi",
    },
    episodes: { sub, dub },
  };
}

export async function watch(anilistId, audio, episode, { basePath = "" } = {}) {
  const malId = await malIdFor(anilistId);
  const [embeds, list] = await Promise.all([
    listJson(`/episode-embeds/${malId}/${episode}`),
    listJson(`/episodes/${malId}`).catch(() => []),
  ]);
  if (!embeds.length) throw notFound(`Senshi: no sources for episode ${episode}`);
  const source = embeds.find((entry) => isDub(entry.status) === (audio === "dub"));
  if (!source) throw notFound(`Senshi: no ${audio} source for episode ${episode}`);
  const item = list.find((entry) => Number(entry.ep_id) === episode);
  const streams = [];
  const subtitles = [];
  if (source.remote_source_id) {
    const entries = await vidCloudSources(source.remote_source_id).catch(() => []);
    for (const entry of entries) {
      const sourceAudio = String(entry?.source?.audio ?? "").toLowerCase();
      if (!entry?.source?.src || (sourceAudio && sourceAudio !== "both" && sourceAudio !== audio))
        continue;
      const tracks = (entry.tracks || []).map(mapTrack).filter(Boolean);
      for (const track of tracks)
        if (!subtitles.some((known) => known.url === track.url)) subtitles.push(track);
      streams.push({
        url: entry.source.src,
        proxiedUrl: streamUrl(entry.source.src, basePath),
        type: "hls",
        server: "Senshi",
        referer: `${BASE}/`,
        quality: entry.source.quality || null,
        subtitles: tracks,
        fonts: Array.isArray(entry.font) ? entry.font : [],
        priority: streams.length ? 4 : 5,
        isActive: streams.length === 0,
      });
    }
  }
  if (!streams.length && source.url) {
    streams.push({
      url: source.url.replace(/^http:\/\//i, "https://"),
      type: "embed",
      server: "Senshi",
      referer: `${BASE}/`,
      priority: 4,
      isActive: true,
    });
  }
  if (source.server2) {
    streams.push({
      url: source.server2,
      type: "embed",
      server: "StreamNin",
      referer: `${BASE}/`,
      priority: 3,
      isActive: false,
    });
  }
  if (source.serverFM) {
    streams.push({
      url: source.serverFM,
      type: "embed",
      server: "FileMoon",
      referer: `${BASE}/`,
      priority: 2,
      isActive: false,
    });
  }
  return {
    anilistId: Number(anilistId),
    malId,
    episode,
    audio,
    intro: { start: item?.intro_start ?? 0, end: item?.intro_end ?? 0 },
    outro: { start: item?.outro_start ?? 0, end: item?.outro_end ?? 0 },
    streams,
    subtitles,
    downloads: source.download ? [{ url: source.download, label: "Download" }] : [],
    headers: MEDIA_HEADERS,
  };
}
