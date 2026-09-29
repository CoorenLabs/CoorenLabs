import { getMedia } from "../core/anilist.js";
import { memo, TTL } from "../core/cache.js";
import { fetchJson, notFound, settle } from "../core/http.js";
import { buildTitles, diceCoeff, episodeMeta, expectedCount, watchId } from "../core/utils.js";

const BASE = "https://kaa.lt";
const HLS_BASE = "https://hls.krussdomi.com/manifest";
const LABEL = "KAA";
const LOCALES = { sub: "ja-JP", dub: "en-US" };

function isCjk(value) {
  return [...value].some((char) => char.codePointAt(0) >= 0x3000 && char.codePointAt(0) <= 0x9fff);
}

function api(path, init = {}) {
  return fetchJson(`${BASE}/api${path}`, { label: LABEL, ...init });
}

async function search(query) {
  const data = await api("/fsearch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ page: 1, query }),
  });
  return Array.isArray(data?.result) ? data.result : [];
}

function episodePage(slug, episode, locale) {
  return api(`/show/${slug}/episodes?ep=${episode}&lang=${locale}`);
}

async function allEpisodes(slug) {
  const first = await episodePage(slug, 1, LOCALES.sub);
  const pages = Array.isArray(first.pages) ? first.pages.slice(1) : [];
  const rest = await Promise.all(
    pages.map((page) =>
      page.eps?.[0] ? episodePage(slug, page.eps[0], LOCALES.sub).then((data) => data.result) : [],
    ),
  );
  return [first.result, ...rest].flatMap((list) => (Array.isArray(list) ? list : []));
}

async function localeNumbers(slug, locale) {
  const first = await episodePage(slug, 1, locale);
  return new Set((first.pages ?? []).flatMap((page) => page.eps ?? []).map(Number));
}

function searchQueries(titles) {
  const queries = new Set();
  for (const title of titles.slice(0, 4)) {
    if (isCjk(title)) continue;
    const clean = title
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (clean.length < 3) continue;
    const words = clean.split(" ");
    if (words.length <= 3) queries.add(clean);
    else {
      queries.add(words.slice(0, 2).join(" "));
      queries.add(words.slice(0, 3).join(" "));
    }
  }
  return [...queries];
}

function scoreCandidate(candidate, titles, seasonYear, format) {
  let base = 0;
  for (const title of titles.slice(0, 3)) {
    if (isCjk(title)) continue;
    base = Math.max(
      base,
      diceCoeff(title, candidate.title_en || ""),
      diceCoeff(title, candidate.title || ""),
    );
  }
  const year = Number(candidate.year);
  let yearFactor = 1;
  if (seasonYear && year) {
    const diff = Math.abs(Number(seasonYear) - year);
    yearFactor = diff === 0 ? 1.2 : diff === 1 ? 0.8 : 0.5;
  }
  const type = String(candidate.type || "").toLowerCase();
  const target = String(format || "").toUpperCase();
  let typeFactor = 1;
  if ((target === "MOVIE") !== (type === "movie")) typeFactor = 0.25;
  else if (["OVA", "ONA", "SPECIAL"].includes(target) && type === "tv") typeFactor = 0.5;
  else if (target === "TV" && (type === "ova" || type === "special")) typeFactor = 0.5;
  return Math.min(1, base * yearFactor) * typeFactor;
}

function resolveSeries(anilistId, ctx = {}) {
  return memo(`series:kaa:${anilistId}`, TTL.identity, async () => {
    const media = ctx.media ?? (await getMedia(anilistId));
    const titles = buildTitles(media, ctx.anizip);
    const queries = searchQueries(titles);
    if (!queries.length) throw new Error(`KAA: no usable search queries for AniList ${anilistId}`);
    const candidates = new Map();
    await settle(
      queries.map(async (query) => {
        for (const result of await search(query))
          if (!candidates.has(result.slug)) candidates.set(result.slug, result);
      }),
    );
    if (!candidates.size) throw notFound(`KAA: no search results for AniList ${anilistId}`);
    const best = [...candidates.values()]
      .map((candidate) => ({
        candidate,
        score: scoreCandidate(candidate, titles, media?.seasonYear, media?.format),
      }))
      .sort((a, b) => b.score - a.score)[0];
    if (!best || best.score < 0.5)
      throw notFound(`KAA: no confident match for AniList ${anilistId}`);
    if (best.score < 0.6)
      throw notFound(
        `KAA: low confidence match for AniList ${anilistId} — best "${best.candidate.slug}" score ${best.score.toFixed(3)}`,
      );
    return {
      slug: best.candidate.slug,
      title: best.candidate.title_en || best.candidate.title,
      locales: Array.isArray(best.candidate.locales) ? best.candidate.locales : [],
      score: best.score,
    };
  });
}

function movieEpisode(show) {
  const match = String(show.watch_uri || "").match(/\/(ep-(\d+)-([a-f0-9]+))$/i);
  return match ? { number: 1, fullSlug: match[1] } : null;
}

function toEpisode(episode) {
  return {
    number: episode.episode_number,
    fullSlug: `ep-${episode.episode_number}-${episode.slug}`,
    title: episode.title,
    duration: episode.duration_ms ? Math.round(episode.duration_ms / 1000) : null,
  };
}

async function episodeMap(series, show) {
  if (show?.type === "movie") return [movieEpisode(show)].filter(Boolean);
  return (await allEpisodes(series.slug)).map(toEpisode);
}

async function findEpisode(series, show, locale, number) {
  if (show?.type === "movie") return number === 1 ? movieEpisode(show) : null;
  const first = await episodePage(series.slug, 1, locale);
  const pick = (data) =>
    (Array.isArray(data?.result) ? data.result : []).find((item) => item.episode_number === number);
  let found = pick(first);
  if (!found) {
    const page = (first.pages ?? []).find((item) => (item.eps ?? []).map(Number).includes(number));
    if (page?.eps?.[0]) found = pick(await episodePage(series.slug, page.eps[0], locale));
  }
  return found ? toEpisode(found) : null;
}

export async function getEpisodes(anilistId, ctx = {}) {
  const media = ctx.media ?? (await getMedia(anilistId));
  const localCtx = { ...ctx, media };
  const series = await resolveSeries(anilistId, localCtx);
  const show = await api(`/show/${series.slug}`);
  const locales = Array.isArray(show.locales) ? show.locales : series.locales;
  const [episodes, dubbed] = await Promise.all([
    episodeMap(series, show),
    locales.includes(LOCALES.dub) && show.type !== "movie"
      ? localeNumbers(series.slug, LOCALES.dub).catch(() => null)
      : null,
  ]);
  if (!episodes.length)
    throw new Error(`KAA: no episodes found for AniList ${anilistId} (slug: ${series.slug})`);
  const expected = expectedCount(media, ctx.anizip);
  const hasDub = (number) => locales.includes(LOCALES.dub) && (!dubbed?.size || dubbed.has(number));
  const sub = [];
  const dub = [];
  for (const episode of episodes) {
    const number = episode.number;
    if (!Number.isFinite(number) || number < 1 || (expected && number > expected)) continue;
    const meta = episodeMeta(number, localCtx);
    const base = {
      number,
      title: meta.title ?? episode.title ?? `Episode ${number}`,
      duration: meta.duration ?? episode.duration,
      filler: meta.filler,
      uncensored: false,
      description: meta.description,
      image: meta.image,
      airDate: meta.airDate,
    };
    sub.push({ id: watchId("kaa", anilistId, "sub", number), ...base, audio: "sub" });
    if (hasDub(number))
      dub.push({ id: watchId("kaa", anilistId, "dub", number), ...base, audio: "dub" });
  }
  return {
    meta: {
      id: series.slug,
      title: series.title,
      source: "kaa",
      matchScore: Number(series.score.toFixed(3)),
    },
    episodes: { sub, dub },
  };
}

export async function watch(anilistId, audio, episode) {
  const series = await resolveSeries(anilistId);
  const show = await api(`/show/${series.slug}`);
  const locales = Array.isArray(show.locales) ? show.locales : series.locales;
  if (audio === "dub" && !locales.includes(LOCALES.dub))
    throw notFound(`KAA: no English dub for AniList ${anilistId}`);
  const target = await findEpisode(series, show, LOCALES[audio], episode);
  if (!target) throw notFound(`KAA: episode ${episode} not found for AniList ${anilistId}`);
  const data = await api(`/show/${series.slug}/episode/${target.fullSlug}`);
  const servers = Array.isArray(data.servers) ? data.servers : [];
  if (!servers.length)
    throw notFound(`KAA: no streams for episode ${episode} (AniList ${anilistId})`);
  const streams = servers
    .map((server) => ({ server, id: String(server.src ?? "").match(/[?&]id=([^&]+)/)?.[1] }))
    .filter((item) => item.id)
    .map(({ server, id }, index) => ({
      url: `${HLS_BASE}/${id}/master.m3u8`,
      type: "hls",
      server: server.name || "KAA",
      headers: { Referer: "https://krussdomi.com/" },
      priority: 1,
      isActive: index === 0,
    }));
  if (!streams.length) throw notFound(`KAA: could not resolve stream for episode ${episode}`);
  return { anilistId: Number(anilistId), episode, audio, streams };
}
