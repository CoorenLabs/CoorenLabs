import { getMedia, getPrequelOffset } from "./anilist.js";
import { memo, TTL } from "./cache.js";
import { fetchText, HTML_ACCEPT } from "./http.js";

const ENTITIES = { quot: '"', amp: "&", lt: "<", gt: ">", apos: "'", nbsp: " " };
const JS_ESCAPES = { b: "\b", f: "\f", n: "\n", r: "\r", t: "\t", v: "\v", 0: "\0", "\n": "" };
const REGEX_PRECEDERS = new Set("=(:,[!&|?{};");
const ATTRIBUTES = new Map();
const FORMATS = {
  TV: "tv",
  TV_SHORT: "tv",
  MOVIE: "movie",
  OVA: "ova",
  ONA: "ona",
  SPECIAL: "special",
};
const ORDINALS = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};
export const FAMILY_FULL = [
  /\b(?:the\s+)?final\s+chapters?\b/gi,
  /\bfinal\s+(?:arc|edition)\b/gi,
  /\b(?:kanketsu|kouhen|zenpen)\s*(?:hen)?\b/gi,
  /\b(?:the\s+)?movie\b/gi,
  /\b(?:season|part|cour|chapter)\s*(?:\d+|one|two|three|four|final)?\b/gi,
  /\b(?:final|special)\s*(?:\d+|one|two|three|four)?\b/gi,
];
export const FAMILY_LIGHT = [
  /\b(?:the\s+)?final\s+chapters?\b/gi,
  /\b(?:season|part|cour|chapter)\s*(?:\d+|one|two|three|four|five|final)?\b/gi,
  /\b(?:the\s+)?movie\b/gi,
];

export function fetchHtml(url, headers = {}) {
  return fetchText(url, {
    headers: { Accept: HTML_ACCEPT, "Accept-Language": "en-US,en;q=0.9", ...headers },
  });
}

export function decodeEntities(value = "") {
  return String(value)
    .replace(/&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi, (match, dec, hex, name) => {
      if (name) return ENTITIES[name.toLowerCase()] ?? match;
      const code = dec ? Number(dec) : parseInt(hex, 16);
      return code <= 0x10ffff ? String.fromCodePoint(code) : match;
    })
    .trim();
}

export function stripTags(html = "") {
  return decodeEntities(
    String(html)
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " "),
  );
}

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function attr(tag, name) {
  let pattern = ATTRIBUTES.get(name);
  if (!pattern) {
    pattern = new RegExp(`(?:^|[\\s"'])${escapeRegex(name)}=["']([^"']*)["']`, "i");
    ATTRIBUTES.set(name, pattern);
  }
  const match = String(tag).match(pattern);
  return match ? decodeEntities(match[1]) : "";
}

export function unescapeJs(value) {
  return String(value).replace(
    /\\(?:u\{([\da-fA-F]+)\}|u([\da-fA-F]{4})|x([\da-fA-F]{2})|([\s\S]))/g,
    (match, point, unicode, hex, char) => {
      if (point)
        return parseInt(point, 16) <= 0x10ffff ? String.fromCodePoint(parseInt(point, 16)) : match;
      if (unicode || hex) return String.fromCharCode(parseInt(unicode || hex, 16));
      return JS_ESCAPES[char] ?? char;
    },
  );
}

export function scriptStrings(script) {
  const strings = new Set();
  let index = 0;
  let previous = "";
  while (index < script.length) {
    const char = script[index];
    const next = script[index + 1];
    if (char === "/" && next === "/") {
      index = script.indexOf("\n", index + 2);
      if (index < 0) break;
      continue;
    }
    if (char === "/" && next === "*") {
      index = script.indexOf("*/", index + 2);
      if (index < 0) break;
      index += 2;
      continue;
    }
    if (char === "/" && REGEX_PRECEDERS.has(previous)) {
      let inClass = false;
      for (index++; index < script.length; index++) {
        const current = script[index];
        if (current === "\\") index++;
        else if (current === "[") inClass = true;
        else if (current === "]") inClass = false;
        else if (current === "/" && !inClass) break;
      }
      for (index++; /[a-z]/i.test(script[index] ?? ""); index++);
      continue;
    }
    if (char === "'" || char === '"' || char === "`") {
      const start = ++index;
      while (index < script.length && script[index] !== char)
        index += script[index] === "\\" ? 2 : 1;
      if (char !== "`") strings.add(unescapeJs(script.slice(start, index)));
      index++;
      continue;
    }
    if (char.trim()) previous = char;
    index++;
  }
  return [...strings];
}

export function balancedEnd(text, start, open = "{", close = "}") {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === open) depth++;
    else if (text[i] === close && --depth === 0) return i + 1;
  }
  return -1;
}

export function uniqueBy(items, key) {
  const seen = new Set();
  return items.filter((item) => {
    const value = key(item);
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

export function originOf(url, fallback = null) {
  try {
    return `${new URL(String(url).startsWith("//") ? `https:${url}` : url).origin}/`;
  } catch {
    return fallback;
  }
}

function norm(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function diceCoeff(a, b) {
  const left = norm(a);
  const right = norm(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.length < 2 || right.length < 2) return 0;
  const bigrams = new Map();
  for (let i = 0; i < left.length - 1; i++) {
    const bigram = left.slice(i, i + 2);
    bigrams.set(bigram, (bigrams.get(bigram) ?? 0) + 1);
  }
  let hits = 0;
  for (let i = 0; i < right.length - 1; i++) {
    const bigram = right.slice(i, i + 2);
    const count = bigrams.get(bigram) ?? 0;
    if (count > 0) {
      hits++;
      bigrams.set(bigram, count - 1);
    }
  }
  return (2 * hits) / (left.length + right.length - 2);
}

export function bestDice(titles, values) {
  let best = 0;
  for (const title of titles)
    for (const value of values) best = Math.max(best, diceCoeff(title, value));
  return best;
}

function titleScore(query, candidate, slug) {
  const base = Math.max(diceCoeff(query, candidate), diceCoeff(query, slug.replace(/-/g, " ")));
  const queryNumber = norm(query).match(/\d+/)?.[0] ?? "";
  const slugNumber = slug.match(/\d+/)?.[0] ?? "";
  if (queryNumber && slugNumber !== queryNumber) return base * 0.65;
  if (!queryNumber && slugNumber) {
    const n = parseInt(slugNumber);
    if (n > 1 && n < 1900) return base * (1 - 0.06 * (n - 1));
  }
  const isMovieQuery = /\b(movie|film|the movie)\b/i.test(query);
  const isMovieMatch = /\b(movie|film)\b/i.test(candidate) || /movie|film/.test(slug);
  if (isMovieQuery && !isMovieMatch) return base * 0.4;
  const queryLength = norm(query).length;
  const slugLength = norm(slug.replace(/-/g, " ")).length;
  return slugLength > queryLength * 1.6 + 4 ? base * 0.8 : base;
}

function slugQueries(title) {
  const queries = new Set([title]);
  const words = title.trim().split(/\s+/);
  if (words.length > 4) queries.add(words.slice(0, 4).join(" "));
  if (words.length > 3) queries.add(words.slice(0, 3).join(" "));
  const stripped = title
    .replace(/\bseason\s*\d+\b/gi, "")
    .replace(/\bpart\s*\d+\b/gi, "")
    .replace(/\b\d+(?:st|nd|rd|th)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (stripped && stripped !== title) queries.add(stripped);
  return [...queries].filter((query) => query.length >= 3);
}

async function findTopSlugs(titles, searchFn, limit = 6) {
  const queries = new Set(titles.slice(0, 4).flatMap(slugQueries));
  const candidates = new Map();
  await Promise.all(
    [...queries].map(async (query) => {
      const results = await searchFn(query).catch(() => []);
      for (const result of results)
        if (!candidates.has(result.slug)) candidates.set(result.slug, result.text);
    }),
  );
  const scored = [];
  for (const [slug, text] of candidates) {
    const score = Math.max(0, ...titles.slice(0, 2).map((title) => titleScore(title, text, slug)));
    if (score >= 0.5) scored.push({ slug, title: text, score });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function searchVariants(titles, { maxTitles, maxQueries, cuts, family }) {
  const queries = new Set();
  for (const raw of titles.slice(0, maxTitles)) {
    const title = String(raw || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!title) continue;
    queries.add(title);
    const plain = title
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (plain.length >= 3) queries.add(plain);
    const words = plain.split(" ").filter(Boolean);
    for (const [minWords, take] of cuts)
      if (words.length > minWords) queries.add(words.slice(0, take).join(" "));
    const stripped = family
      .reduce((value, pattern) => value.replace(pattern, " "), plain)
      .replace(/\s+/g, " ")
      .trim();
    if (stripped.length >= 3) queries.add(stripped);
  }
  return [...queries].filter((query) => query.length >= 3).slice(0, maxQueries);
}

function mediaFormat(media) {
  return FORMATS[String(media?.format ?? "").toUpperCase()] ?? "";
}

function coverageScore(episodeCount, expected, status) {
  if (!expected || expected < 1) return 0.5;
  if (episodeCount < 1) return 0;
  if (expected < 6) return 1;
  const needed = status === "FINISHED" ? Math.ceil(expected * 0.8) : Math.max(1, expected - 3);
  return Math.min(1, episodeCount / needed);
}

export function pickConfident(candidates, media, titles, expected) {
  const format = mediaFormat(media);
  const year = Number(media?.startDate?.year ?? media?.seasonYear ?? 0) || null;
  const valid = candidates
    .map((candidate) => {
      const titleScore = bestDice(titles, candidate.titles);
      if (titleScore < 0.68) return null;
      if (format && candidate.type && format !== candidate.type) return null;
      if (year && candidate.year && year !== candidate.year) return null;
      const coverage = coverageScore(candidate.episodeCount, expected, media?.status);
      if (expected >= 6 && coverage < 0.8) return null;
      const score =
        titleScore * 0.72 +
        (format && candidate.type === format ? 0.14 : 0.07) +
        (year && candidate.year === year ? 0.1 : 0.04) +
        coverage * 0.04;
      return { ...candidate, titleScore, coverage, score };
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score);
  const [selected, runnerUp] = valid;
  if (!selected || selected.score < 0.82 || (runnerUp && selected.score - runnerUp.score < 0.08))
    return null;
  return selected;
}

function ordinal(value) {
  const match = String(value || "")
    .toLowerCase()
    .match(/\b(?:part|special|chapter)\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/);
  return match ? Number(match[1]) || ORDINALS[match[1]] || 0 : 0;
}

export function alignEpisodes(episodes, media, expected) {
  if (!expected || episodes.length <= expected) return episodes;
  const titles = [media?.title?.english, media?.title?.romaji, media?.title?.native].filter(
    Boolean,
  );
  const target = Math.max(0, ...titles.map(ordinal));
  if (target < 2) return episodes;
  const start = episodes.findIndex((episode) => ordinal(episode.title) === target);
  if (start < 0 || episodes.length - start < expected) return episodes;
  return episodes
    .slice(start, start + expected)
    .map((episode, index) => ({ ...episode, number: index + 1 }));
}

export function buildTitles(media, anizip) {
  return [
    media?.title?.english,
    media?.title?.romaji,
    media?.title?.native,
    ...(media?.synonyms ?? []),
    anizip?.titles?.en,
    anizip?.titles?.["x-jat"],
    anizip?.titles?.ja,
  ].filter(Boolean);
}

export function expectedCount(media, anizip) {
  let max = Number(media?.episodes) > 0 ? Number(media.episodes) : 0;
  for (const key of Object.keys(anizip?.episodes ?? {})) {
    const n = Number(key);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max || null;
}

export function episodeMeta(n, ctx) {
  const episode = ctx.anizip?.episodes?.[String(n)] ?? {};
  const runtime = episode.runtime ?? episode.length ?? null;
  return {
    title: episode.title?.en ?? episode.title?.["x-jat"] ?? null,
    duration: runtime ? runtime * 60 : null,
    filler: episode.filler ?? false,
    uncensored: false,
    description: episode.overview ?? episode.summary ?? null,
    image: episode.image ?? ctx.anizip?.images?.cover ?? null,
    airDate: episode.airdate ?? episode.aired ?? null,
  };
}

export function watchId(provider, anilistId, audio, number) {
  return `watch/${provider}/${anilistId}/${audio}/${provider}-${number}`;
}

async function selectSeries(candidates, scrapeSeries, expected, status, offset, minScore) {
  const results = await Promise.all(
    candidates.map(async (candidate) => {
      const episodes = await scrapeSeries(candidate.slug).catch(() => []);
      const localHits = expected
        ? episodes.filter((e) => e.number >= 1 && e.number <= expected).length
        : episodes.length;
      const offsetHits =
        expected && offset
          ? episodes.filter((e) => e.number > offset && e.number <= offset + expected).length
          : 0;
      let countScore = 1;
      if (expected && expected >= 6) {
        const needed =
          status === "FINISHED" ? Math.ceil(expected * 0.9) : Math.max(1, expected - 3);
        const hits = Math.max(localHits, offsetHits);
        countScore = hits >= needed ? 1 : hits / needed;
      }
      return {
        ...candidate,
        episodes,
        mode: offsetHits > localHits ? "offset" : "local",
        score: candidate.score * 0.7 + countScore * 0.3,
      };
    }),
  );
  return (
    results
      .filter((result) => result.episodes.length && result.score >= minScore)
      .sort((a, b) => b.score - a.score)[0] ?? null
  );
}

export async function resolveSlugSeries(provider, label, anilistId, ctx, options) {
  let episodes = null;
  const series = await memo(`series:${provider}:${anilistId}`, TTL.identity, async () => {
    const media = ctx.media ?? (await getMedia(anilistId));
    const expected = expectedCount(media, ctx.anizip);
    const [candidates, offset] = await Promise.all([
      findTopSlugs(buildTitles(media, ctx.anizip), options.search),
      getPrequelOffset(anilistId).catch(() => 0),
    ]);
    const minScore = options.minScore?.(media, expected) ?? 0.65;
    const selected = await selectSeries(
      candidates,
      options.scrapeSeries,
      expected,
      media?.status,
      offset,
      minScore,
    );
    if (!selected) throw new Error(`${label} match not found for AniList ${anilistId}`);
    episodes = selected.episodes;
    return {
      slug: selected.slug,
      title: selected.title,
      mode: selected.mode,
      offset,
      score: selected.score,
    };
  });
  return { series, episodes };
}

export function slugSeriesEpisodes(provider, anilistId, series, sourceEpisodes, ctx) {
  const expected = expectedCount(ctx.media, ctx.anizip);
  const sub = [];
  const dub = [];
  for (const source of sourceEpisodes) {
    const number = series.mode === "offset" ? source.number - series.offset : source.number;
    if (number < 1 || (expected && number > expected)) continue;
    const meta = episodeMeta(number, ctx);
    const base = {
      number,
      title: meta.title ?? source.title ?? `Episode ${number}`,
      duration: meta.duration,
      filler: meta.filler,
      uncensored: meta.uncensored,
      description: meta.description,
      image: meta.image,
      airDate: meta.airDate,
      sourceNumber: source.number,
    };
    if (source.hasSub)
      sub.push({ id: watchId(provider, anilistId, "sub", number), ...base, audio: "sub" });
    if (source.hasDub)
      dub.push({ id: watchId(provider, anilistId, "dub", number), ...base, audio: "dub" });
  }
  return {
    meta: {
      id: series.slug,
      title: series.title,
      source: provider,
      matchScore: Number(series.score.toFixed(3)),
      numbering: series.mode,
      episodeOffset: series.mode === "offset" ? series.offset : 0,
    },
    episodes: { sub, dub },
  };
}

export function providerEpisode(series, episode) {
  return series.mode === "offset" ? Number(episode) + series.offset : Number(episode);
}
