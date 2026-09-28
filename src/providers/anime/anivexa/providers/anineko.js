import { getMedia } from "../core/anilist.js";
import {
  attr,
  decodeEntities,
  fetchHtml,
  originOf,
  providerEpisode,
  resolveSlugSeries,
  slugSeriesEpisodes,
  stripTags,
  uniqueBy,
} from "../core/utils.js";

const BASE = "https://anineko.to";
const HLS_PATTERNS = [
  /const\s+src\s*=\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i,
  /file\s*:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i,
  /["'](https?:\/\/[^"']+\/master\.m3u8[^"']*)["']/i,
  /["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i,
];

async function search(query) {
  const html = await fetchHtml(`${BASE}/browser?keyword=${encodeURIComponent(query)}`);
  const results = [];
  for (const match of html.matchAll(
    /<a\b[^>]*class=["'][^"']*nv-anime-thumb[^"']*["'][^>]*>[\s\S]*?<\/a>/gi,
  )) {
    const slug = attr(match[0].match(/<a\b[^>]*>/i)?.[0] ?? "", "href").match(
      /\/watch\/([^/?#]+)/,
    )?.[1];
    if (!slug) continue;
    const title = match[0].match(
      /<(?:h3|[^>]+class=["'][^"']*nv-anime-title[^"']*["'][^>]*)>([\s\S]*?)<\/(?:h3|[^>]+)>/i,
    )?.[1];
    results.push({ slug, text: title ? stripTags(title) : slug.replace(/-/g, " ") });
  }
  return results;
}

async function scrapeSeries(slug) {
  const html = await fetchHtml(`${BASE}/watch/${slug}`);
  const episodes = [];
  for (const match of html.matchAll(
    /<article\b[^>]*class=["'][^"']*nv-info-episode-item[^"']*["'][^>]*>([\s\S]*?)<\/article>/gi,
  )) {
    const block = match[1];
    const link =
      block.match(/<a\b[^>]*class=["'][^"']*nv-info-episode-main[^"']*["'][^>]*>/i)?.[0] ?? "";
    const number = Number(attr(link, "href").match(/\/ep-(\d+)/)?.[1]);
    if (!Number.isFinite(number)) continue;
    const title = stripTags(
      block.match(
        /<a\b[^>]*class=["'][^"']*nv-info-episode-main[^"']*["'][^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i,
      )?.[1] ?? "",
    );
    const badges = [...block.matchAll(/<span\b[^>]*>([\s\S]*?)<\/span>/gi)].map((badge) =>
      stripTags(badge[1]).toLowerCase(),
    );
    episodes.push({
      number,
      title: title || `Episode ${number}`,
      hasSub: badges.includes("sub"),
      hasDub: badges.includes("dub"),
    });
  }
  episodes.sort((a, b) => a.number - b.number);
  return uniqueBy(episodes, (episode) => episode.number);
}

async function extractHls(embedUrl) {
  const html = await fetchHtml(embedUrl, { Referer: `${BASE}/` }).catch(() => "");
  for (const pattern of HLS_PATTERNS) {
    const match = html.match(pattern);
    if (match) return decodeEntities(match[1]);
  }
  return null;
}

async function episodeStreams(slug, episode, audio) {
  const html = await fetchHtml(`${BASE}/watch/${slug}/ep-${episode}`, {
    Referer: `${BASE}/watch/${slug}`,
  });
  const embeds = [];
  for (const panel of html.matchAll(
    /<div\b[^>]*class=["'][^"']*nv-server-grid[^"']*["'][^>]*data-id=["']([^"']+)["'][^>]*>([\s\S]*?)(?=<div\b[^>]*class=["'][^"']*nv-server-grid|$)/gi,
  )) {
    if ((panel[1].toLowerCase().includes("dub") ? "dub" : "sub") !== audio) continue;
    for (const button of panel[2].matchAll(/data-video=["']([^"']+)["']/gi))
      embeds.push(decodeEntities(button[1]));
  }
  return Promise.all(
    embeds.map(async (embed, index) => {
      const hls = await extractHls(embed);
      return {
        url: hls ?? embed,
        type: hls ? "hls" : "embed",
        embed,
        audio,
        server: "AniNeko",
        priority: embeds.length - index,
        referer: originOf(embed),
        isActive: index === 0,
      };
    }),
  );
}

function resolveSeries(anilistId, ctx) {
  return resolveSlugSeries("anineko", "AniNeko", anilistId, ctx, { search, scrapeSeries });
}

export async function getEpisodes(anilistId, ctx = {}) {
  const localCtx = { ...ctx, media: ctx.media ?? (await getMedia(anilistId)) };
  const { series, episodes } = await resolveSeries(anilistId, localCtx);
  return slugSeriesEpisodes(
    "anineko",
    anilistId,
    series,
    episodes ?? (await scrapeSeries(series.slug)),
    localCtx,
  );
}

export async function watch(anilistId, audio, episode) {
  const { series } = await resolveSeries(anilistId, {});
  const sourceNumber = providerEpisode(series, episode);
  return {
    anilistId: Number(anilistId),
    episode,
    providerEpisode: sourceNumber,
    audio,
    streams: await episodeStreams(series.slug, sourceNumber, audio),
  };
}
