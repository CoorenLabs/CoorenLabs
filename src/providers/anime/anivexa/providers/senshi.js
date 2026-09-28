import { getMedia } from "../core/anilist.js";
import { browserFetch, fetchJson, notFound, parseJson, upstreamError } from "../core/http.js";
import { episodeMeta, watchId } from "../core/utils.js";

const BASE = "https://senshi.to";
const VID_CLOUD = "https://s.vidcloud.se";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36";
const HEADERS = { "User-Agent": UA, Referer: `${BASE}/` };
const LABEL = "Senshi";

async function malIdFor(anilistId, ctx) {
  const media = ctx?.media ?? (await getMedia(anilistId));
  if (!media?.idMal) throw new Error(`Senshi: no MAL ID found for AniList ${anilistId}`);
  return media.idMal;
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

export async function watch(anilistId, audio, episode) {
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
    headers: HEADERS,
  };
}
