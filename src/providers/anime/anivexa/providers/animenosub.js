import { getMedia } from "../core/anilist.js";
import { fetchJson, notFound } from "../core/http.js";
import {
  decodeEntities,
  fetchHtml,
  originOf,
  providerEpisode,
  resolveSlugSeries,
  slugSeriesEpisodes,
} from "../core/utils.js";
import { canResolveEmbed, resolveEmbed } from "../extractors/index.js";

const BASE = "https://animenosub.to";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36";
const DIRECT_HOSTS = /vidmoly|vtbe|streamtape|dood|filemoon|upn\.one|bysesa/i;

async function search(query) {
  const data = await fetchJson(`${BASE}/wp-admin/admin-ajax.php`, {
    label: "animenosub",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      "User-Agent": UA,
      Origin: BASE,
      Referer: `${BASE}/`,
    },
    body: `action=ts_ac_do_search&ts_ac_query=${encodeURIComponent(query)}`,
  });
  return (data?.anime?.[0]?.all ?? [])
    .map((item) => ({
      slug: item.post_link?.match(/\/anime\/([^/]+)\/?$/)?.[1],
      text: item.post_title,
    }))
    .filter((item) => item.slug)
    .map((item) => ({ slug: item.slug, text: item.text ?? item.slug.replace(/-/g, " ") }));
}

async function scrapeSeries(slug) {
  const html = await fetchHtml(`${BASE}/anime/${slug}/`, { Referer: BASE });
  const slugIsDub = /(?:^|[-\s])dub(?:$|[-\s])/i.test(slug);
  const episodes = new Map();
  for (const match of html.matchAll(
    /<li\b[^>]*data-index="\d+"[^>]*>[\s\S]*?<a\s+href="(https?:\/\/animenosub\.to\/[^"]+)"[\s\S]*?<div\s+class="epl-num">([^<]+)<\/div>/gi,
  )) {
    const epUrl = decodeEntities(match[1]);
    const label = match[2].trim();
    const isMovie = /^movie$/i.test(label);
    const parsed = parseFloat(label);
    const number = isMovie ? 1 : Number.isFinite(parsed) && parsed >= 1 ? Math.round(parsed) : null;
    if (number === null || episodes.has(number)) continue;
    const isDub = slugIsDub || /-dub(?:$|\/)/.test(epUrl);
    episodes.set(number, {
      number,
      title: isMovie ? "Movie" : `Episode ${number}`,
      epUrl,
      hasSub: !isDub,
      hasDub: isDub,
    });
  }
  return [...episodes.values()].sort((a, b) => a.number - b.number);
}

async function scrapeEmbeds(epUrl) {
  const html = await fetchHtml(epUrl, { Referer: `${BASE}/` });
  const streams = [];
  for (const match of html.matchAll(
    /<option\s+value="([A-Za-z0-9+/=]+)"\s+data-index="\d+"[^>]*>([^<]+)<\/option>/gi,
  )) {
    const server = match[2].trim();
    if (!server || /select video server/i.test(server)) continue;
    let url = null;
    try {
      url = atob(match[1]).match(/src=["']([^"']+)["']/i)?.[1] ?? null;
    } catch {}
    if (!url) continue;
    streams.push({
      url,
      type: "embed",
      server,
      referer: originOf(url, epUrl),
      priority: streams.length === 0 ? 2 : 1,
      isActive: streams.length === 0,
    });
  }
  if (!streams.length) {
    const src = [...html.matchAll(/<iframe[^>]+src=["']([^"']+)["'][^>]*>/gi)]
      .map((match) => match[1])
      .find((url) => DIRECT_HOSTS.test(url));
    if (src)
      streams.push({
        url: src,
        type: "embed",
        server: "Direct",
        referer: originOf(src, epUrl),
        priority: 2,
        isActive: true,
      });
  }
  return streams;
}

function resolveSeries(anilistId, ctx) {
  return resolveSlugSeries("animenosub", "animenosub", anilistId, ctx, { search, scrapeSeries });
}

export async function getEpisodes(anilistId, ctx = {}) {
  const localCtx = { ...ctx, media: ctx.media ?? (await getMedia(anilistId)) };
  const { series, episodes } = await resolveSeries(anilistId, localCtx);
  return slugSeriesEpisodes(
    "animenosub",
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
    (item) => item.number === sourceNumber && (audio === "dub" ? item.hasDub : item.hasSub),
  );
  if (!target) throw notFound(`animenosub ${audio} episode ${sourceNumber} not found`);
  const embeds = await scrapeEmbeds(target.epUrl);
  const resolved = await Promise.all(
    embeds.map((embed) =>
      canResolveEmbed(embed.url)
        ? resolveEmbed(embed.url, { userAgent: UA, referer: `${BASE}/`, attempts: 2 }).catch(
            () => [],
          )
        : [],
    ),
  );
  const streams = embeds.flatMap((embed, index) => [
    ...resolved[index].map((source) => ({
      url: source.url,
      type: source.type,
      server: embed.server,
      referer: source.referer,
      priority: embed.priority,
      isActive: embed.isActive,
    })),
    embed,
  ]);
  return { anilistId: Number(anilistId), episode, providerEpisode: sourceNumber, audio, streams };
}
