import { getMedia } from "../core/anilist.js";
import { notFound } from "../core/http.js";
import {
  attr,
  fetchHtml,
  originOf,
  providerEpisode,
  resolveSlugSeries,
  slugSeriesEpisodes,
  stripTags,
  uniqueBy,
} from "../core/utils.js";

const BASE = "https://www.animegg.org";

async function searchPage(query) {
  const html = await fetchHtml(`${BASE}/search/?q=${encodeURIComponent(query)}`);
  const results = [];
  for (const match of html.matchAll(
    /<a\b[^>]*class=["'][^"']*\bmse\b[^"']*["'][^>]*>[\s\S]*?<\/a>/gi,
  )) {
    const slug = attr(match[0].match(/<a\b[^>]*>/i)?.[0] ?? "", "href").match(
      /^\/series\/([^/?#]+)/,
    )?.[1];
    if (!slug) continue;
    const strong = match[0].match(/<strong[^>]*>([\s\S]*?)<\/strong>/i)?.[1];
    results.push({ slug, text: strong ? stripTags(strong) : slug.replace(/-/g, " ") });
  }
  return results;
}

async function search(query) {
  const compact = query.split(/\s+/)[0].replace(/[^a-zA-Z0-9]/g, "");
  const extra = compact.length >= 4 && compact.toLowerCase() !== query.toLowerCase();
  const [results, more] = await Promise.all([
    searchPage(query),
    extra ? searchPage(compact).catch(() => []) : [],
  ]);
  return uniqueBy([...results, ...more], (result) => result.slug);
}

async function scrapeSeries(slug) {
  const html = await fetchHtml(`${BASE}/series/${slug}`);
  const episodes = [];
  for (const match of html.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
    const block = match[1];
    if (!/\banm_det_pop\b/.test(block)) continue;
    const link = block.match(/<a\b[^>]*class=["'][^"']*anm_det_pop[^"']*["'][^>]*>/i)?.[0] ?? "";
    const href = attr(link, "href").replace(/#.*$/, "").replace(/^\//, "");
    const strong = stripTags(block.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i)?.[1] ?? "");
    const number = parseInt((strong.match(/(\d+)-(\d+)\s*$/) || strong.match(/(\d+)\s*$/))?.[1]);
    if (!Number.isFinite(number) || !href) continue;
    episodes.push({
      number,
      title:
        stripTags(
          block.match(/<i\b[^>]*class=["'][^"']*anititle[^"']*["'][^>]*>([\s\S]*?)<\/i>/i)?.[1] ??
            "",
        ) || strong,
      epSlug: href,
      hasSub: /\bbtn-subbed\b/.test(block),
      hasDub: /\bbtn-dubbed\b/.test(block),
    });
  }
  episodes.sort((a, b) => a.number - b.number);
  return uniqueBy(episodes, (episode) => episode.number);
}

async function embedSources(embedId) {
  const html = await fetchHtml(`${BASE}/embed/${embedId}`, { Referer: BASE });
  const literal = html.match(/var\s+videoSources\s*=\s*(\[[\s\S]*?\]);/)?.[1];
  if (!literal) return [];
  let parsed;
  try {
    parsed = JSON.parse(
      literal
        .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
        .replace(/:\s*'([^']*)'/g, ': "$1"'),
    );
  } catch {
    return [];
  }
  return parsed
    .filter((source) => source.file)
    .map((source) => {
      let backup = null;
      try {
        backup = source.bk ? decodeURIComponent(atob(source.bk)) : null;
      } catch {}
      return {
        quality: source.label || "unknown",
        url: source.file.startsWith("http") ? source.file : `${BASE}${source.file}`,
        backup,
      };
    });
}

async function episodeStreams(epSlug, audio) {
  const html = await fetchHtml(`${BASE}/${epSlug}`, { Referer: BASE });
  const title = stripTags(
    html.match(
      /<div\b[^>]*class=["'][^"']*info[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    )?.[1] ?? "",
  );
  const tabs = [...html.matchAll(/<a\b[^>]*data-toggle=["']tab["'][^>]*>/gi)]
    .map(([tag]) => ({
      embedId: attr(tag, "data-id"),
      server: attr(tag, "data-mirror") || "AnimeGG",
      audio: (attr(tag, "data-version") || "subbed").startsWith("dub") ? "dub" : "sub",
    }))
    .filter((tab) => tab.embedId && tab.audio === audio);
  const results = await Promise.all(
    tabs.map(async (tab, index) => {
      const embed = `${BASE}/embed/${tab.embedId}`;
      const sources = await embedSources(tab.embedId).catch(() => null);
      if (!sources) return [];
      const referer = originOf(embed);
      return [
        ...sources.map((source, position) => ({
          url: source.url,
          type: source.url.includes(".m3u8") ? "hls" : "mp4",
          quality: source.quality,
          backup: source.backup,
          audio: tab.audio,
          server: tab.server,
          embed,
          referer,
          priority: tabs.length - index,
          isActive: index === 0 && position === 0,
        })),
        {
          url: embed,
          type: "embed",
          audio: tab.audio,
          server: `${tab.server}-embed`,
          referer,
          priority: 1,
          isActive: false,
        },
      ];
    }),
  );
  return { title, streams: results.flat() };
}

function resolveSeries(anilistId, ctx) {
  return resolveSlugSeries("animegg", "AnimeGG", anilistId, ctx, {
    search,
    scrapeSeries,
    minScore: (media, expected) =>
      String(media?.format ?? "").toUpperCase() === "MOVIE" || expected === 1 ? 0.9 : 0.65,
  });
}

export async function getEpisodes(anilistId, ctx = {}) {
  const localCtx = { ...ctx, media: ctx.media ?? (await getMedia(anilistId)) };
  const { series, episodes } = await resolveSeries(anilistId, localCtx);
  return slugSeriesEpisodes(
    "animegg",
    anilistId,
    series,
    episodes ?? (await scrapeSeries(series.slug)),
    localCtx,
  );
}

export async function watch(anilistId, audio, episode) {
  const { series, episodes } = await resolveSeries(anilistId, {});
  const sourceNumber = providerEpisode(series, episode);
  const target = (episodes ?? (await scrapeSeries(series.slug))).find(
    (item) => item.number === sourceNumber,
  );
  if (!target) throw notFound(`AnimeGG episode ${sourceNumber} not found`);
  const { title, streams } = await episodeStreams(target.epSlug, audio);
  return {
    anilistId: Number(anilistId),
    episode,
    providerEpisode: sourceNumber,
    audio,
    title,
    streams,
  };
}
