import { getMedia } from "../core/anilist.js";
import { memo, TTL } from "../core/cache.js";
import { browserFetch, HTML_ACCEPT, notFound, parseJson, upstreamError } from "../core/http.js";
import {
  attr,
  buildTitles,
  decodeEntities,
  episodeMeta,
  expectedCount,
  originOf,
  stripTags,
  watchId,
} from "../core/utils.js";

const BASE = "https://anidb.app";
const NAVIGATE = {
  Accept: HTML_ACCEPT,
  "Accept-Language": "en-US,en;q=0.9",
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "none",
  "sec-fetch-user": "?1",
  "upgrade-insecure-requests": "1",
};
const XHR = {
  Accept: "application/json, text/html, */*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "X-Requested-With": "XMLHttpRequest",
};

async function get(url, headers, referer) {
  const response = await browserFetch(url, {
    session: "anidbapp",
    headers: referer ? { ...headers, Referer: referer } : headers,
  });
  const text = await response.text();
  if (!response.ok)
    throw upstreamError(`AniDB.app HTTP ${response.status}: ${url}`, text, response.status);
  return text;
}

const page = (url, referer = `${BASE}/home`) => get(url, NAVIGATE, referer);
const xhr = (url, referer) => get(url, XHR, referer);
const api = async (url, referer) => parseJson(await xhr(url, referer), "AniDB.app");

function siteIdOf(slug) {
  return Number(slug.match(/-(\d+)$/)?.[1]);
}

async function search(query) {
  const html = await xhr(
    `${BASE}/search/suggestions?q=${encodeURIComponent(query)}`,
    `${BASE}/home`,
  );
  const results = [];
  for (const match of html.matchAll(/<a\b[^>]*data-search-item\b[^>]*>[\s\S]*?<\/a>/gi)) {
    const href = attr(match[0].match(/<a\b[^>]*>/i)?.[0] ?? "", "href");
    const slug = (href.startsWith("http") ? new URL(href).pathname : href).match(
      /^\/anime\/([^/?#]+)/,
    )?.[1];
    if (!slug) continue;
    const title = stripTags(
      match[0].match(/<p\b[^>]*class=["'][^"']*text-sm[^"']*["'][^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "",
    );
    results.push({ slug, title: title || slug.replace(/-/g, " "), siteId: siteIdOf(slug) });
  }
  if (results.length) return results;
  const browse = await page(`${BASE}/browse?q=${encodeURIComponent(query)}`).catch(() => "");
  for (const match of browse.matchAll(
    /<a\b[^>]*href=["'](?:https:\/\/anidb\.app)?\/anime\/([^"']+)["'][^>]*class=["'][^"']*\banime-card\b[^"']*["'][^>]*>[\s\S]*?<\/a>/gi,
  )) {
    const slug = match[1];
    if (results.some((result) => result.slug === slug)) continue;
    const title =
      stripTags(match[0].match(/title=["']([^"']+)["']/i)?.[1] ?? "") ||
      stripTags(match[0].match(/alt=["']([^"']+)["']/i)?.[1] ?? "") ||
      slug.replace(/-/g, " ");
    results.push({ slug, title, siteId: siteIdOf(slug) });
  }
  return results;
}

function externalIds(html) {
  const id = (pattern) => Number(html.match(pattern)?.[1]) || null;
  return {
    anilistId: id(/https:\/\/anilist\.co\/anime\/(\d+)/i),
    malId: id(/https:\/\/myanimelist\.net\/anime\/(\d+)/i),
    anidbId: id(/https:\/\/anidb\.net\/anime\/(\d+)/i),
    kitsuId: id(/https:\/\/kitsu\.app\/anime\/(\d+)/i),
  };
}

function searchQueries(media, anizip) {
  const queries = new Set();
  for (const title of buildTitles(media, anizip).slice(0, 5)) {
    queries.add(title);
    const words = title.trim().split(/\s+/);
    if (words.length > 4) queries.add(words.slice(0, 4).join(" "));
  }
  return [...queries].filter((query) => query.length >= 2);
}

function resolveSeries(anilistId, ctx = {}) {
  return memo(`series:anidbapp:${anilistId}`, TTL.identity, async () => {
    const media = ctx.media ?? (await getMedia(anilistId));
    const candidates = new Map();
    const failures = [];
    await Promise.all(
      searchQueries(media, ctx.anizip).map(async (query) => {
        try {
          for (const result of await search(query))
            if (!candidates.has(result.slug)) candidates.set(result.slug, result);
        } catch (error) {
          failures.push(error);
        }
      }),
    );
    if (!candidates.size && failures.length) throw failures[0];
    const pages = await Promise.all(
      [...candidates.values()].map(async (candidate) => {
        const html = await page(`${BASE}/anime/${candidate.slug}`).catch(() => "");
        return html ? { candidate, html, ids: externalIds(html) } : null;
      }),
    );
    const malId = Number(media?.idMal) || null;
    const byAnilist = pages.find((item) => item?.ids.anilistId === Number(anilistId));
    const byMal =
      malId && pages.find((item) => item && !item.ids.anilistId && item.ids.malId === malId);
    const match = byAnilist ?? byMal;
    if (!match) throw new Error(`AniDB.app match not found for AniList ${anilistId}`);
    return {
      slug: match.candidate.slug,
      siteId: match.candidate.siteId || siteIdOf(match.candidate.slug),
      title:
        stripTags(match.html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "") ||
        match.candidate.title,
      matchType: byAnilist ? "anilist" : "mal",
      matchScore: byAnilist ? 1 : 0.9,
      ...match.ids,
    };
  });
}

async function providerEpisodes(siteId) {
  const data = await api(
    `${BASE}/api/frontend/anime/${siteId}/episodes`,
    `${BASE}/anime/${siteId}`,
  );
  return Array.isArray(data.episodes) ? data.episodes : [];
}

function inferOffset(episodes, expected) {
  const numbers = episodes
    .map((episode) => Number(episode.number))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (!numbers.length || !expected) return 0;
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  if (min > expected) return min - 1;
  if (min > 1 && max - min + 1 >= expected) return min - 1;
  return 0;
}

async function languages(episodeId, slug) {
  const data = await api(
    `${BASE}/api/frontend/episode/${episodeId}/languages`,
    `${BASE}/anime/${slug}`,
  ).catch(() => null);
  return Array.isArray(data?.languages) ? data.languages : [];
}

function languageFor(list, audio) {
  const preferred = audio === "sub" ? ["jpn", "ja", "japanese"] : ["eng", "en", "english"];
  return (
    list.find((item) => preferred.includes(String(item.code ?? "").toLowerCase())) ??
    list.find((item) => preferred.includes(String(item.name ?? "").toLowerCase())) ??
    null
  );
}

function extractHls(html) {
  for (const pattern of [
    /file\s*:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i,
    /["'](https?:\/\/[^"']+\/master\.m3u8[^"']*)["']/i,
    /["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i,
  ]) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeEntities(match[1]);
  }
  return null;
}

export async function getEpisodes(anilistId, ctx = {}) {
  const media = ctx.media ?? (await getMedia(anilistId));
  const localCtx = { ...ctx, media };
  const series = await resolveSeries(anilistId, localCtx);
  const episodes = await providerEpisodes(series.siteId);
  const expected = expectedCount(media, ctx.anizip);
  const offset = inferOffset(episodes, expected);
  const sample = episodes[0]?.id ? await languages(episodes[0].id, series.slug) : [];
  const hasSub = Boolean(languageFor(sample, "sub")?.embed_url) || !sample.length;
  const hasDub = Boolean(languageFor(sample, "dub")?.embed_url);
  const sub = [];
  const dub = [];
  for (const source of episodes) {
    const sourceNumber = Number(source.number);
    const number = sourceNumber - offset;
    if (!Number.isFinite(number) || number < 1 || (expected && number > expected)) continue;
    const meta = episodeMeta(number, localCtx);
    const base = {
      number,
      title: meta.title ?? `Episode ${number}`,
      duration: meta.duration,
      filler: source.filler ?? meta.filler,
      uncensored: meta.uncensored,
      description: meta.description,
      image: meta.image,
      airDate: meta.airDate,
      sourceNumber,
      sourceId: source.id,
    };
    if (hasSub)
      sub.push({ ...base, id: watchId("anidbapp", anilistId, "sub", number), audio: "sub" });
    if (hasDub)
      dub.push({ ...base, id: watchId("anidbapp", anilistId, "dub", number), audio: "dub" });
  }
  return {
    meta: {
      id: series.slug,
      siteId: series.siteId,
      title: series.title,
      source: "anidbapp",
      matchScore: series.matchScore,
      matchType: series.matchType,
      anilistId: series.anilistId,
      malId: series.malId,
      numbering: offset ? "offset" : "local",
      episodeOffset: offset,
    },
    episodes: { sub, dub },
  };
}

export async function watch(anilistId, audio, episode) {
  const [series, media] = await Promise.all([
    resolveSeries(anilistId),
    getMedia(anilistId).catch(() => null),
  ]);
  const episodes = await providerEpisodes(series.siteId);
  const providerEpisode = episode + inferOffset(episodes, expectedCount(media));
  const target = episodes.find((item) => Number(item.number) === providerEpisode);
  if (!target) throw notFound(`AniDB.app episode ${episode} not found`);
  const language = languageFor(await languages(target.id, series.slug), audio);
  const base = { anilistId: Number(anilistId), episode, providerEpisode, audio };
  if (!language?.embed_url) return { ...base, streams: [] };
  const embed = decodeEntities(language.embed_url);
  const hls = extractHls(await page(embed, `${BASE}/`).catch(() => ""));
  const streams = [
    {
      url: embed,
      type: "embed",
      audio,
      language: language.code,
      server: "AniDB.app-embed",
      referer: `${BASE}/`,
      priority: 4,
      isActive: !hls,
    },
  ];
  if (hls)
    streams.unshift({
      url: hls,
      type: "hls",
      audio,
      language: language.code,
      server: "AniDB.app",
      embed,
      referer: originOf(embed),
      priority: 5,
      isActive: true,
    });
  return { ...base, language: language.code, streams };
}
