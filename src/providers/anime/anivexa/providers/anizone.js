import { getMedia, getPrequelOffset } from "../core/anilist.js";
import { memo, TTL } from "../core/cache.js";
import {
  cookiesFrom,
  HTML_ACCEPT,
  notFound,
  parseJson,
  request,
  upstreamError,
} from "../core/http.js";
import {
  alignEpisodes,
  buildTitles,
  decodeEntities,
  episodeMeta,
  escapeRegex,
  expectedCount,
  FAMILY_FULL,
  pickConfident,
  searchVariants,
  unescapeJs,
  watchId,
} from "../core/utils.js";

const BASE = "https://anizone.to";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";
const LABEL = "AniZone";
const MAX_PAGES = 5;
const JSON_ARGUMENT = "\\s*:\\s*JSON\\.parse\\('((?:[^'\\\\]|\\\\.)*)'\\)";
const ITEMS = new RegExp(`items${JSON_ARGUMENT}`, "i");
const TITLES = new RegExp(`epsTitles${JSON_ARGUMENT}`, "i");
const PLAYER = /vidstackPlayer\s*\(\s*JSON\.parse\('((?:[^'\\]|\\.)*)'\)\s*\)/i;

function jsonArgument(text, pattern) {
  const raw = String(text).match(pattern)?.[1];
  if (!raw) return null;
  try {
    return JSON.parse(unescapeJs(raw));
  } catch {
    return null;
  }
}

function normalizeUrl(value) {
  return String(value || "").replace(/\\+\//g, "/");
}

async function fetchPage(path, init = {}) {
  const response = await request(`${BASE}${path}`, {
    ...init,
    headers: {
      "User-Agent": UA,
      "Accept-Language": "en-US,en;q=0.9",
      Accept: HTML_ACCEPT,
      Referer: `${BASE}/`,
      ...init.headers,
    },
  });
  const raw = await response.text();
  if (!response.ok)
    throw upstreamError(`AniZone HTTP ${response.status}: ${path}`, raw, response.status);
  return { raw, cookies: cookiesFrom(response.headers) };
}

function pickTitle(titles) {
  return titles?.["1"] || titles?.["5"] || titles?.["8"] || Object.values(titles || {})[0] || "";
}

function formatName(value) {
  const type = String(value || "").toLowerCase();
  if (type.includes("special")) return "special";
  if (type.includes("movie")) return "movie";
  if (type.includes("ova")) return "ova";
  if (type.includes("web") || type.includes("ona")) return "ona";
  if (type.includes("tv")) return "tv";
  return "";
}

async function search(query) {
  const items = jsonArgument(
    (await fetchPage(`/anime?search=${encodeURIComponent(query)}`)).raw,
    ITEMS,
  );
  return (Array.isArray(items) ? items : [])
    .filter((item) => /^[a-z0-9-]+$/i.test(String(item?.slug || "")))
    .map((item) => ({
      slug: String(item.slug),
      title: pickTitle(item.title_list) || item.main_title || "",
      titles: [
        ...new Set([item.main_title, ...Object.values(item.title_list || {})].filter(Boolean)),
      ],
      type: formatName(item.type),
      year: Number(item.start_year) || null,
      episodeCount: Number(item.episode_count) || 0,
    }))
    .filter((item) => item.title);
}

function resolveSeries(anilistId, ctx = {}) {
  return memo(`series:anizone:${anilistId}`, TTL.identity, async () => {
    const media = ctx.media ?? (await getMedia(anilistId));
    const titles = buildTitles(media, ctx.anizip);
    const discovered = new Map();
    await Promise.all(
      searchVariants(titles, {
        maxTitles: 8,
        maxQueries: 8,
        cuts: [[4, 4]],
        family: FAMILY_FULL,
      }).map(async (query) => {
        for (const candidate of await search(query).catch(() => []))
          if (!discovered.has(candidate.slug)) discovered.set(candidate.slug, candidate);
      }),
    );
    const selected = pickConfident(
      [...discovered.values()],
      media,
      titles,
      expectedCount(media, ctx.anizip),
    );
    if (!selected) throw notFound(`AniZone match not confident for AniList ${anilistId}`);
    return {
      slug: selected.slug,
      title: selected.title,
      matchScore: selected.titleScore,
      score: selected.score,
    };
  });
}

function seconds(value) {
  const parts = String(value || "").match(/^(\d+):(\d{1,2})$/);
  return parts ? Number(parts[1]) * 60 + Number(parts[2]) : null;
}

function episodeNumber(item) {
  const direct = Number(item?.slug);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const fromUrl = Number(normalizeUrl(item?.url).match(/\/(\d+)\/?$/)?.[1]);
  return Number.isFinite(fromUrl) && fromUrl > 0 ? fromUrl : null;
}

function parseEpisodes(items) {
  const episodes = new Map();
  for (const item of items) {
    const number = episodeNumber(item);
    if (!number || episodes.has(number)) continue;
    episodes.set(number, {
      number,
      sourceNumber: number,
      title: pickTitle(item.title_list) || `Episode ${number}`,
      duration: seconds(item.duration),
      description: item.summary || null,
      image: normalizeUrl(item.snapshot) || null,
      airDate: item.air_date || null,
      hasSub: Number(item.videos_count) > 0,
      hasDub: false,
    });
  }
  return episodes;
}

function sidebarEpisodes(html, slug) {
  const pattern = new RegExp(
    `x-data="([^"]*)"[^>]*?wire:key="e-[^"]*"[^>]*?href="https?://anizone\\.to/anime/${escapeRegex(slug)}/(\\d+)"`,
    "g",
  );
  const episodes = new Map();
  for (const match of html.matchAll(pattern)) {
    const number = Number(match[2]);
    if (!number || episodes.has(number)) continue;
    episodes.set(number, {
      number,
      sourceNumber: number,
      title: pickTitle(jsonArgument(match[1], TITLES)) || `Episode ${number}`,
      hasSub: true,
      hasDub: false,
    });
  }
  return episodes;
}

function livewireState(html, cookies) {
  const snapshot = [...html.matchAll(/wire:snapshot="([^"]*)"/gi)].find((item) =>
    item[1].includes("pages.anime-detail"),
  )?.[1];
  const items = jsonArgument(html, ITEMS);
  const state = {
    items: Array.isArray(items) ? items : [],
    snapshot: snapshot ? decodeEntities(snapshot) : "",
    cursor: html.match(/nextCursor:\s*'([^']+)'/i)?.[1] || null,
    hasMore: /hasMore:\s*true/i.test(html),
    csrf: html.match(/csrf-token"\s+content="([^"]+)"/i)?.[1] || "",
    cookies: cookies.join("; "),
  };
  if (!state.items.length || !state.snapshot || !state.csrf)
    throw upstreamError("AniZone page payload not found", html);
  return state;
}

async function nextPage(state, slug) {
  const { raw, cookies } = await fetchPage("/livewire/update", {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
      "X-Livewire": "",
      "X-CSRF-TOKEN": state.csrf,
      "X-Requested-With": "XMLHttpRequest",
      Origin: BASE,
      Referer: `${BASE}/anime/${slug}`,
      Cookie: state.cookies,
    },
    body: JSON.stringify({
      components: [
        {
          snapshot: state.snapshot,
          updates: {},
          calls: [{ path: "", method: "loadPage", params: [state.cursor] }],
        },
      ],
    }),
  });
  const component = parseJson(raw, LABEL)?.components?.[0];
  const loaded = component?.effects?.dispatches?.find(
    (item) => item?.name === "items-loaded",
  )?.params;
  if (!component?.snapshot || !Array.isArray(loaded?.items))
    throw upstreamError("AniZone page continuation payload not found", raw);
  const jar = new Map(
    [...state.cookies.split("; "), ...cookies].filter(Boolean).map((pair) => pair.split(/=(.*)/s)),
  );
  return {
    items: loaded.items,
    snapshot: component.snapshot,
    cursor: loaded.nextCursor || null,
    hasMore: Boolean(loaded.hasMore),
    csrf: state.csrf,
    cookies: [...jar].map(([name, value]) => `${name}=${value}`).join("; "),
  };
}

async function scrapeSeries(slug, limit) {
  const initial = await fetchPage(`/anime/${slug}`);
  let state = livewireState(initial.raw, initial.cookies);
  const items = [...state.items];
  for (
    let pages = 1;
    state.hasMore && state.cursor && items.length < limit && pages < MAX_PAGES;
    pages++
  ) {
    state = await nextPage(state, slug);
    items.push(...state.items);
  }
  const episodes = parseEpisodes(items);
  if (state.hasMore && items.length < limit && episodes.size) {
    const { raw } = await fetchPage(`/anime/${slug}/${episodes.keys().next().value}`);
    for (const [number, episode] of sidebarEpisodes(raw, slug))
      if (!episodes.has(number)) episodes.set(number, episode);
  }
  if (!episodes.size) throw new Error(`AniZone has no episodes for ${slug}`);
  return [...episodes.values()].sort((left, right) => left.number - right.number);
}

function chooseMode(episodes, expected, offset) {
  if (!expected || !offset) return "local";
  const local = episodes.filter(
    (episode) => episode.number >= 1 && episode.number <= expected,
  ).length;
  const shifted = episodes.filter(
    (episode) => episode.number > offset && episode.number <= offset + expected,
  ).length;
  return shifted > local ? "offset" : "local";
}

async function seriesContext(anilistId, ctx) {
  const media = ctx.media ?? (await getMedia(anilistId));
  const [series, offset] = await Promise.all([
    resolveSeries(anilistId, { ...ctx, media }),
    getPrequelOffset(anilistId).catch(() => 0),
  ]);
  return { media, series, offset, expected: expectedCount(media, ctx.anizip) };
}

export async function getEpisodes(anilistId, ctx = {}) {
  const { media, series, offset, expected } = await seriesContext(anilistId, ctx);
  const localCtx = { ...ctx, media };
  const raw = await scrapeSeries(series.slug, expected ? expected + offset : Infinity);
  const mode = chooseMode(raw, expected, offset);
  const sub = [];
  const dub = [];
  for (const source of alignEpisodes(raw, media, expected)) {
    const number = mode === "offset" ? source.number - offset : source.number;
    if (number < 1 || (expected && number > expected)) continue;
    const meta = episodeMeta(number, localCtx);
    const base = {
      number,
      title: meta.title ?? source.title ?? `Episode ${number}`,
      duration: meta.duration ?? source.duration ?? null,
      filler: meta.filler,
      uncensored: meta.uncensored,
      description: meta.description ?? source.description ?? null,
      image: meta.image ?? source.image ?? null,
      airDate: meta.airDate ?? source.airDate ?? null,
      sourceNumber: source.sourceNumber,
    };
    if (source.hasSub)
      sub.push({ id: watchId("anizone", anilistId, "sub", number), ...base, audio: "sub" });
    if (source.hasDub)
      dub.push({ id: watchId("anizone", anilistId, "dub", number), ...base, audio: "dub" });
  }
  return {
    meta: {
      id: series.slug,
      title: series.title,
      source: "anizone",
      matchScore: Number(series.matchScore.toFixed(3)),
      numbering: mode,
      episodeOffset: mode === "offset" ? offset : 0,
    },
    episodes: { sub, dub },
  };
}

async function watchPage(slug, number) {
  try {
    return (await fetchPage(`/anime/${slug}/${number}`)).raw;
  } catch (error) {
    if (error.upstreamStatus === 404) return null;
    throw error;
  }
}

function playerStreams(raw, number) {
  const player = jsonArgument(raw, PLAYER);
  if (!player?.src)
    throw upstreamError(`AniZone player payload not found for episode ${number}`, raw);
  return {
    url: normalizeUrl(player.src),
    type: "hls",
    server: "AniZone",
    subtitles: (Array.isArray(player.subtitles) ? player.subtitles : [])
      .filter((subtitle) => subtitle?.file)
      .map((subtitle) => ({
        url: normalizeUrl(subtitle.file),
        label: subtitle.title || "",
        srclang: subtitle.language || "",
        format: subtitle.format || "vtt",
        default: Boolean(subtitle.default),
      })),
    storyboard: normalizeUrl(player.storyboard) || null,
    chapters: normalizeUrl(player.chapter) || null,
    priority: 1,
    isActive: true,
  };
}

export async function watch(anilistId, audio, episode) {
  if (audio !== "sub") throw new Error(`AniZone ${audio} episode ${episode} not found`);
  const { media, series, offset, expected } = await seriesContext(anilistId, {});
  let page = await watchPage(series.slug, episode);
  let current = episode;
  if (!page) {
    const initial = await fetchPage(`/anime/${series.slug}`);
    const latest = parseEpisodes(livewireState(initial.raw, initial.cookies).items)
      .keys()
      .next().value;
    if (!latest) throw new Error(`AniZone has no episodes for ${series.slug}`);
    page = await watchPage(series.slug, latest);
    current = latest;
  }
  const listed = [...sidebarEpisodes(page ?? "", series.slug).values()].sort(
    (left, right) => left.number - right.number,
  );
  const mode = chooseMode(listed, expected, offset);
  const target = alignEpisodes(listed, media, expected).find(
    (item) => (mode === "offset" ? item.number - offset : item.number) === episode,
  );
  if (!target) throw new Error(`AniZone ${audio} episode ${episode} not found`);
  const raw =
    target.sourceNumber === current ? page : await watchPage(series.slug, target.sourceNumber);
  if (!raw) throw new Error(`AniZone ${audio} episode ${episode} not found`);
  return {
    anilistId: Number(anilistId),
    episode,
    providerEpisode: target.sourceNumber,
    audio,
    streams: [playerStreams(raw, target.sourceNumber)],
  };
}
