import { getMedia } from "../core/anilist.js";
import { forget, memo, TTL } from "../core/cache.js";
import { cookiesFrom, HTML_ACCEPT, parseJson, request, upstreamError } from "../core/http.js";
import {
  attr,
  bestDice,
  buildTitles,
  episodeMeta,
  expectedCount,
  FAMILY_LIGHT,
  searchVariants,
  watchId,
} from "../core/utils.js";

const SITE = "https://www.animeonsen.xyz";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";
const LABEL = "AnimeOnsen";

function metaContent(html, name) {
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi))
    if (attr(tag, "name").toLowerCase() === name) return attr(tag, "content");
  return "";
}

function decodeToken(cookie) {
  const decoded = Buffer.from(decodeURIComponent(cookie), "base64").toString("utf8");
  const token = [...decoded].map((char) => String.fromCharCode(char.charCodeAt(0) + 1)).join("");
  if (!/^[\x20-\x7e]+$/.test(token))
    throw new Error("AnimeOnsen returned an invalid session token");
  return token;
}

function session() {
  return memo("animeonsen:session", 6 * TTL.hour, async () => {
    const response = await request(`${SITE}/`, {
      headers: { "User-Agent": UA, Accept: HTML_ACCEPT, "Accept-Language": "en-US,en;q=0.9" },
    });
    const html = await response.text();
    if (!response.ok) throw upstreamError(`AnimeOnsen homepage HTTP ${response.status}`, html);
    const cookie = cookiesFrom(response.headers)
      .find((pair) => pair.startsWith("ao.session="))
      ?.slice("ao.session=".length);
    const apiOrigin = metaContent(html, "ao-api-origin");
    const searchOrigin = metaContent(html, "ao-search-origin");
    const searchToken = metaContent(html, "ao-search-token");
    if (!cookie || !apiOrigin || !searchOrigin || !searchToken)
      throw new Error("AnimeOnsen session bootstrap data missing");
    return {
      token: decodeToken(cookie),
      apiOrigin: new URL(apiOrigin).origin,
      searchOrigin: new URL(searchOrigin).origin,
      searchToken,
    };
  });
}

async function authorized(label, send) {
  for (let attempt = 0; ; attempt++) {
    const response = await send(await session());
    const raw = await response.text();
    if ((response.status === 401 || response.status === 403) && attempt === 0) {
      forget("animeonsen:session");
      continue;
    }
    if (!response.ok) throw upstreamError(`AnimeOnsen ${label} HTTP ${response.status}`, raw);
    return parseJson(raw, LABEL);
  }
}

function api(path) {
  return authorized(path, (current) =>
    request(`${current.apiOrigin}${path}`, {
      headers: {
        Authorization: `Bearer ${current.token}`,
        Accept: "application/json, text/plain, */*",
        Origin: SITE,
        Referer: `${SITE}/`,
        "User-Agent": UA,
      },
    }),
  );
}

async function search(query) {
  const data = await authorized(`search: ${query}`, (current) =>
    request(`${current.searchOrigin}/multi-search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${current.searchToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: SITE,
        Referer: `${SITE}/`,
        "User-Agent": UA,
      },
      body: JSON.stringify({ queries: [{ indexUid: "content", q: query, limit: 20 }] }),
    }),
  );
  return Array.isArray(data?.results?.[0]?.hits) ? data.results[0].hits : [];
}

function candidateTitles(candidate) {
  return [candidate.content_title_en, candidate.content_title, candidate.content_title_jp].filter(
    Boolean,
  );
}

async function inspect(candidate) {
  const contentId = String(candidate?.content_id || "");
  if (!contentId) return null;
  const metadata = (
    await api(`/v4/content/${encodeURIComponent(contentId)}/video/1`).catch(() => null)
  )?.metadata;
  if (!metadata) return null;
  return {
    contentId,
    title: candidate.content_title_en || candidate.content_title || "",
    candidate,
    malId: Number(metadata.mal_id) || null,
    episodeCount: Number(metadata.total_episodes) || 0,
    isMovie: Boolean(metadata.is_movie),
  };
}

function coverageScore(episodeCount, expected) {
  if (!expected || expected < 2) return 1;
  if (!episodeCount) return 0.5;
  if (episodeCount === expected) return 1;
  if (episodeCount > expected && episodeCount <= expected + 2) return 0.95;
  return Math.min(1, episodeCount / expected);
}

function validate(candidate, media, titles, expected) {
  if (candidate.isMovie !== (media?.format === "MOVIE")) return null;
  if (expected >= 6) {
    const minimum =
      media?.status === "FINISHED" ? Math.ceil(expected * 0.8) : Math.max(1, expected - 3);
    if (candidate.episodeCount && candidate.episodeCount < minimum) return null;
  }
  const titleScore = bestDice(titles, candidateTitles(candidate.candidate));
  if (titleScore < 0.7) return null;
  const coverage = coverageScore(candidate.episodeCount, expected);
  return { ...candidate, titleScore, coverage, score: titleScore * 0.7 + coverage * 0.2 + 0.1 };
}

function resolveSeries(anilistId, ctx = {}) {
  return memo(`series:animeonsen:${anilistId}`, TTL.identity, async () => {
    const media = ctx.media ?? (await getMedia(anilistId));
    const titles = [
      ...new Set([
        ...[media?.title?.english, media?.title?.romaji, media?.title?.native].filter(Boolean),
        ...buildTitles(media, ctx.anizip),
      ]),
    ];
    if (!titles.length) throw new Error(`AnimeOnsen has no AniList titles for ${anilistId}`);
    const expected = expectedCount(media, ctx.anizip);
    const discovered = new Map();
    await Promise.all(
      searchVariants(titles, {
        maxTitles: 10,
        maxQueries: 16,
        cuts: [
          [4, 6],
          [6, 4],
        ],
        family: FAMILY_LIGHT,
      }).map(async (query) => {
        for (const candidate of await search(query).catch(() => []))
          if (candidate?.content_id && !discovered.has(candidate.content_id))
            discovered.set(candidate.content_id, candidate);
      }),
    );
    const shortlist = [...discovered.values()]
      .map((candidate) => ({ candidate, score: bestDice(titles, candidateTitles(candidate)) }))
      .filter((item) => item.score >= 0.42)
      .sort((left, right) => right.score - left.score)
      .slice(0, 14);
    const inspected = (await Promise.all(shortlist.map((item) => inspect(item.candidate)))).filter(
      Boolean,
    );
    const malId = Number(media?.idMal) || null;
    const exact = malId ? inspected.filter((candidate) => candidate.malId === malId) : [];
    const [selected, runnerUp] = (
      exact.length ? exact : inspected.filter((candidate) => !malId || !candidate.malId)
    )
      .map((candidate) => validate(candidate, media, titles, expected))
      .filter(Boolean)
      .sort((left, right) => right.score - left.score);
    if (
      !selected ||
      (!exact.length &&
        (selected.score < 0.82 || (runnerUp && selected.score - runnerUp.score < 0.08)))
    )
      throw new Error(`AnimeOnsen match not confident for AniList ${anilistId}`);
    return {
      contentId: selected.contentId,
      title: selected.title,
      malId: selected.malId,
      episodeCount: selected.episodeCount,
      isMovie: selected.isMovie,
      matchScore: selected.titleScore,
      score: selected.score,
    };
  });
}

async function fetchEpisodes(series) {
  const data = await api(`/v4/content/${encodeURIComponent(series.contentId)}/episodes`);
  const episodes = Object.entries(data ?? {})
    .map(([sourceNumber, detail]) => ({
      number: Number(sourceNumber),
      sourceNumber,
      title: detail?.contentTitle_episode_en || detail?.contentTitle_episode_jp || null,
    }))
    .filter((episode) => Number.isInteger(episode.number) && episode.number >= 1)
    .sort((left, right) => left.number - right.number);
  if (episodes.length) return episodes;
  if (series.isMovie) return [{ number: 1, sourceNumber: "1", title: null }];
  throw new Error(`AnimeOnsen has no episodes for ${series.contentId}`);
}

export async function getEpisodes(anilistId, ctx = {}) {
  const localCtx = { ...ctx, media: ctx.media ?? (await getMedia(anilistId)) };
  const series = await resolveSeries(anilistId, localCtx);
  const expected = expectedCount(localCtx.media, ctx.anizip);
  const sub = (await fetchEpisodes(series))
    .filter((episode) => !expected || episode.number <= expected)
    .map((episode) => {
      const meta = episodeMeta(episode.number, localCtx);
      return {
        id: watchId("animeonsen", anilistId, "sub", episode.number),
        number: episode.number,
        sourceNumber: episode.sourceNumber,
        title: meta.title ?? episode.title ?? `Episode ${episode.number}`,
        duration: meta.duration,
        audio: "sub",
        filler: meta.filler,
        uncensored: false,
        description: meta.description,
        image: meta.image,
        airDate: meta.airDate,
      };
    });
  return {
    meta: {
      id: series.contentId,
      title: series.title,
      source: "animeonsen",
      matchScore: Number(series.matchScore.toFixed(3)),
      numbering: "standard",
      episodeOffset: 0,
    },
    episodes: { sub, dub: [] },
  };
}

function skipRange(start, end) {
  const from = Number(start);
  const to = Number(end);
  return Number.isFinite(from) && Number.isFinite(to) && to > from
    ? { start: from, end: to }
    : null;
}

export async function watch(anilistId, audio, episode) {
  if (audio !== "sub") throw new Error("AnimeOnsen only provides subtitled streams");
  const media = await getMedia(anilistId);
  const series = await resolveSeries(anilistId, { media });
  const expected = expectedCount(media);
  const target = (await fetchEpisodes(series)).find(
    (item) => item.number === episode && (!expected || item.number <= expected),
  );
  if (!target) throw new Error(`AnimeOnsen episode ${episode} not found`);
  const video = await api(
    `/v4/content/${encodeURIComponent(series.contentId)}/video/${encodeURIComponent(target.sourceNumber)}`,
  );
  const stream = video?.uri?.stream;
  if (!stream) throw new Error(`AnimeOnsen has no stream for episode ${episode}`);
  const headers = { Authorization: `Bearer ${(await session()).token}` };
  const labels = video?.metadata?.subtitles ?? {};
  const skip = Array.isArray(video?.metadata?.episode)
    ? video.metadata.episode.find(
        (item) =>
          item && typeof item === "object" && ("skipIntro_s" in item || "skipIntro_e" in item),
      )
    : null;
  return {
    anilistId: Number(anilistId),
    episode,
    providerEpisode: target.number,
    audio,
    intro: skipRange(skip?.skipIntro_s, skip?.skipIntro_e),
    outro: null,
    streams: [
      {
        url: stream,
        type: "dash",
        server: "AnimeOnsen",
        referer: `${SITE}/`,
        headers,
        subtitles: Object.entries(video?.uri?.subtitles ?? {}).map(([language, url]) => ({
          url,
          label: labels[language] || language,
          srclang: language,
          default: language === "en-US",
          headers,
        })),
        priority: 5,
        isActive: true,
      },
    ],
  };
}
