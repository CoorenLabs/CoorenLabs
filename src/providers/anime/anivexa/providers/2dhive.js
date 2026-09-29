import { proxyUrl } from "../../../../core/proxy";
import { getMedia } from "../core/anilist.js";
import { fetchText, notFound } from "../core/http.js";
import { decodeEntities, episodeMeta, expectedCount, escapeRegex, watchId } from "../core/utils.js";
import { extractBabaStream } from "../extractors/babastream.js";
import { extractMegaPlay } from "../extractors/megaplay.js";

const BASE = "https://2dhive.com";
const MEGAPLAY = "https://megaplay.buzz";
const LABEL = "2dhive";

async function malIdFor(anilistId, ctx) {
  const idMal = (ctx?.media ?? (await getMedia(anilistId)))?.idMal;
  if (!idMal) throw notFound(`2dhive: no MAL ID found for AniList ${anilistId}`);
  return idMal;
}

function astroDecode(value) {
  if (!Array.isArray(value)) return value;
  const [type, data] = value;
  if (type === 1 && Array.isArray(data)) return data.map(astroDecode);
  if (type === 0 && data && typeof data === "object" && !Array.isArray(data))
    return Object.fromEntries(Object.entries(data).map(([key, item]) => [key, astroDecode(item)]));
  return data;
}

function islandProps(html, component) {
  const raw = html.match(
    new RegExp(`<astro-island[^>]+component-url="[^"]*${component}[^"]*"[^>]+props="([^"]+)"`),
  )?.[1];
  if (!raw) return null;
  try {
    return astroDecode([0, JSON.parse(decodeEntities(raw))]);
  } catch {
    return null;
  }
}

function embeds(malId, episode, audio) {
  return {
    babastream: `https://babastream.top/embed/${malId}/${episode}/${audio}`,
    megaplay: `${MEGAPLAY}/stream/mal/${malId}/${episode}/${audio}`,
  };
}

async function hasMegaPlayDub(malId, episode) {
  const html = await fetchText(embeds(malId, episode, "dub").megaplay, {
    label: LABEL,
    headers: { Referer: `${BASE}/` },
  }).catch(() => "");
  return /data-id=["'][^"']+["']/i.test(html);
}

export async function getEpisodes(anilistId, ctx = {}) {
  const malId = await malIdFor(anilistId, ctx);
  const html = await fetchText(`${BASE}/anime?anime=${malId}`, { label: LABEL });
  const total = Number(islandProps(html, "EpisodeBrowser")?.totalEpisodes) || 0;
  const numbers = total
    ? Array.from({ length: total }, (_, index) => index + 1)
    : [
        ...new Set(
          [
            ...html.matchAll(
              new RegExp(`/episode\\?anime=${escapeRegex(malId)}&(?:amp;)?ep_num=(\\d+)`, "gi"),
            ),
          ].map((match) => Number(match[1])),
        ),
      ].sort((a, b) => a - b);
  if (!numbers.length)
    throw new Error(`2dhive: no episodes found for AniList ${anilistId} (MAL ${malId})`);
  const hasDub = await hasMegaPlayDub(malId, numbers[0]);
  const expected = expectedCount(ctx.media, ctx.anizip);
  const sub = [];
  const dub = [];
  for (const number of numbers) {
    if (expected && number > expected) continue;
    const meta = episodeMeta(number, ctx);
    const base = {
      number,
      title: meta.title ?? `Episode ${number}`,
      duration: meta.duration,
      filler: meta.filler,
      uncensored: meta.uncensored,
      description: meta.description,
      image: meta.image,
      airDate: meta.airDate,
    };
    sub.push({ id: watchId("2dhive", anilistId, "sub", number), ...base, audio: "sub" });
    if (hasDub)
      dub.push({ id: watchId("2dhive", anilistId, "dub", number), ...base, audio: "dub" });
  }
  return {
    meta: {
      id: String(anilistId),
      source: "2dhive",
      matchScore: 1,
      numbering: "standard",
      episodeOffset: 0,
    },
    episodes: { sub, dub },
  };
}

async function episodeEmbeds(anilistId, audio, episode) {
  const malId = await malIdFor(anilistId);
  return {
    urls: embeds(malId, episode, audio),
    referer: `${BASE}/episode?anime=${malId}&ep_num=${episode}`,
  };
}

export async function watch(anilistId, audio, episode) {
  const { urls, referer } = await episodeEmbeds(anilistId, audio, episode);
  const [baba, mega] = await Promise.all([
    extractBabaStream(urls.babastream, { referer }).catch(() => []),
    extractMegaPlay(urls.megaplay, { referer }).catch(() => null),
  ]);
  const streams = [
    { server: "BabaStream", url: urls.babastream, type: "embed" },
    ...baba.map((source) => ({
      server: "BabaStream",
      url: source.url,
      type: source.type,
      embed: urls.babastream,
      referer: source.referer,
    })),
    ...(mega?.sources ?? []).map((source) => ({
      server: "MegaPlay",
      url: source.url,
      type: "hls",
      variant: source.variant,
      embed: urls.megaplay,
      referer: `${mega.origin}/`,
      subtitles: mega.tracks,
      ...(mega.intro ? { intro: mega.intro } : {}),
      ...(mega.outro ? { outro: mega.outro } : {}),
    })),
    { server: "MegaPlay", url: urls.megaplay, type: "embed" },
  ];
  return { anilistId: Number(anilistId), episode, audio, streams };
}

export async function stream(anilistId, audio, episode) {
  const { urls, referer } = await episodeEmbeds(anilistId, audio, episode);
  const mega = await extractMegaPlay(urls.megaplay, { referer }).catch(() => null);
  if (mega?.sources?.[0]) return proxyUrl(mega.sources[0].url, { Referer: `${mega.origin}/` });
  const baba = (await extractBabaStream(urls.babastream, { referer }).catch(() => [])).find(
    (source) => source.type !== "embed",
  );
  if (!baba) throw notFound("No HLS stream found");
  return proxyUrl(baba.url, { Referer: baba.referer });
}
