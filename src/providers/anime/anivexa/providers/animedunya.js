import { getMedia } from "../core/anilist.js";
import { browserFetch, HTML_ACCEPT, notFound, upstreamError } from "../core/http.js";
import { balancedEnd, episodeMeta, watchId } from "../core/utils.js";

const BASE = "https://anime-dunya.com";

async function malIdFor(anilistId, ctx) {
  const media = ctx?.media ?? (await getMedia(anilistId));
  if (!media?.idMal) throw new Error("AnimeDunya: no MAL ID found");
  return media.idMal;
}

async function fetchPage(path) {
  const response = await browserFetch(`${BASE}${path}`, {
    session: "animedunya",
    headers: { Accept: HTML_ACCEPT, "Accept-Language": "en-US,en;q=0.9" },
  });
  const html = await response.text();
  if (!response.ok)
    throw upstreamError(`AnimeDunya HTTP ${response.status}: ${path}`, html, response.status);
  return html;
}

function embeddedJson(html, pattern, open, close) {
  const match = html.match(pattern);
  if (!match) return null;
  const start = html.indexOf(open, match.index + match[0].length - 1);
  const end = start < 0 ? -1 : balancedEnd(html, start, open, close);
  if (end < 0) return null;
  try {
    return JSON.parse(
      html
        .slice(start, end)
        .replace(/\\u0026/g, "&")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\"),
    );
  } catch {
    return null;
  }
}

export async function getEpisodes(anilistId, ctx = {}) {
  const malId = await malIdFor(anilistId, ctx);
  const html = await fetchPage(`/en/anime/${malId}`);
  const thumb = html.match(
    /(https?:\/\/[^\s"'`<>]+?\/thumbnail\/)([a-zA-Z0-9]+?)\/((?:small|large)\.jpg)/,
  );
  const cdnBase = thumb?.[1] ?? "https://cdn.anime-dunya.com/thumbnail/";
  const cdnExt = thumb?.[3] ?? "small.jpg";
  const episodes = embeddedJson(html, /\\?"episodes\\?":\s*\[/, "[", "]") ?? [];
  const sub = episodes
    .filter((episode) => episode.streamId !== null && episode.streamId !== undefined)
    .map((episode) => {
      const number = episode.episodeNumber;
      const meta = episodeMeta(number, ctx);
      const title = Array.isArray(episode.translations)
        ? episode.translations.find((item) => item.language === "en")?.title
        : episode.translations?.title;
      return {
        id: watchId("animedunya", anilistId, "sub", number),
        number,
        title: title || meta.title || `Episode ${number}`,
        duration: meta.duration,
        audio: "sub",
        filler: episode.filler || meta.filler || false,
        uncensored: false,
        description: meta.description,
        image: episode.streamId ? `${cdnBase}${episode.streamId}/${cdnExt}` : meta.image,
        airDate: meta.airDate,
      };
    })
    .sort((a, b) => a.number - b.number);
  return {
    meta: {
      title: ctx.media?.title?.english ?? ctx.media?.title?.romaji ?? null,
      malId,
      source: "animedunya",
    },
    episodes: { sub, dub: [] },
  };
}

export async function watch(anilistId, audio, episode) {
  if (audio !== "sub") throw notFound("AnimeDunya only provides subtitled streams");
  const malId = await malIdFor(anilistId);
  const html = await fetchPage(`/en/play/${malId}/${episode}`);
  const source =
    embeddedJson(html, /\\?"stream\\?":\s*/, "{", "}") ??
    (() => {
      const url = html.match(/"source"\s*:\s*"([^"]+)"/)?.[1];
      return url ? { source: url.replace(/\\/g, "") } : null;
    })();
  if (!source?.source) throw notFound("AnimeDunya: stream source not found");
  return {
    anilistId: Number(anilistId),
    malId,
    episode,
    audio,
    streams: [
      {
        url: source.source,
        type: "hls",
        server: "AnimeDunya",
        referer: `${BASE}/`,
        subtitles: (source.subtitles || []).map((track) => ({
          url: track.src,
          label: track.label,
          srclang: track.srclang,
          default: track.default || false,
        })),
        priority: 5,
        isActive: true,
      },
    ],
  };
}
