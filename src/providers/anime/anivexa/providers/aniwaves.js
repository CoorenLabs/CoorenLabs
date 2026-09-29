import { getMedia } from "../core/anilist.js";
import { memo, TTL } from "../core/cache.js";
import { fetchText, HTML_ACCEPT, notFound, parseJson, upstreamError } from "../core/http.js";
import {
  alignEpisodes,
  attr,
  bestDice,
  buildTitles,
  episodeMeta,
  escapeRegex,
  expectedCount,
  FAMILY_FULL,
  originOf,
  pickConfident,
  searchVariants,
  stripTags,
  watchId,
} from "../core/utils.js";
import { resolveEmbed } from "../extractors/index.js";

const BASE = "https://aniwaves.ru";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";
const LABEL = "AniWaves";
const TYPES = {
  TV: "tv",
  TV_SHORT: "tv",
  MOVIE: "movie",
  OVA: "ova",
  ONA: "ona",
  SPECIAL: "special",
};

function page(url) {
  return fetchText(url, {
    label: LABEL,
    headers: {
      "User-Agent": UA,
      "Accept-Language": "en-US,en;q=0.9",
      Accept: HTML_ACCEPT,
      Referer: `${BASE}/`,
    },
  });
}

async function ajax(path, referer) {
  const raw = await fetchText(`${BASE}${path}`, {
    label: LABEL,
    headers: {
      "User-Agent": UA,
      "Accept-Language": "en-US,en;q=0.9",
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
      Referer: referer,
    },
  });
  const data = parseJson(raw, LABEL);
  if (Number(data?.status) !== 200)
    throw upstreamError(data?.message || `AniWaves request failed: ${path}`, raw);
  return data.result;
}

function candidateType(value) {
  const name = String(value || "").toUpperCase();
  return name.includes("SPECIAL") ? "special" : (TYPES[name] ?? "");
}

async function search(query) {
  const html = await page(`${BASE}/filter?keyword=${encodeURIComponent(query)}`);
  const found = new Map();
  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const tag = match[1];
    if (!/\bclass=["'][^"']*\bname\b[^"']*\bd-title\b/i.test(tag)) continue;
    const slug = attr(tag, "href").match(/^\/watch\/([a-z0-9-]+)$/i)?.[1];
    const siteId = Number(slug?.match(/-(\d+)$/)?.[1]);
    const title = stripTags(match[2]);
    if (!slug || found.has(slug) || !Number.isFinite(siteId) || !title) continue;
    found.set(slug, { slug, siteId, title, japanese: attr(tag, "data-jp") });
  }
  return [...found.values()];
}

function detailField(html, label) {
  const match = html.match(
    new RegExp(`<div>\\s*${escapeRegex(label)}:\\s*<span[^>]*>([\\s\\S]*?)<\\/span>`, "i"),
  );
  return match ? stripTags(match[1]) : "";
}

async function fetchDetail(candidate) {
  const html = await page(`${BASE}/watch/${candidate.slug}`);
  const year = Number(
    detailField(html, "Date aired").match(/\d{4}/)?.[0] ??
      detailField(html, "Premiered").match(/\d{4}/)?.[0],
  );
  return {
    ...candidate,
    type: candidateType(detailField(html, "Type")),
    year: Number.isFinite(year) ? year : null,
    episodeCount: Number(detailField(html, "Episodes").match(/\d+/)?.[0]) || 0,
  };
}

function resolveSeries(anilistId, ctx = {}) {
  return memo(`series:aniwaves:${anilistId}`, TTL.identity, async () => {
    const media = ctx.media ?? (await getMedia(anilistId));
    const titles = buildTitles(media, ctx.anizip);
    const discovered = new Map();
    await Promise.all(
      searchVariants(titles, {
        maxTitles: 8,
        maxQueries: 18,
        cuts: [
          [4, 4],
          [6, 6],
        ],
        family: FAMILY_FULL,
      }).map(async (query) => {
        for (const candidate of await search(query).catch(() => []))
          if (!discovered.has(candidate.slug)) discovered.set(candidate.slug, candidate);
      }),
    );
    const shortlist = [...discovered.values()]
      .map((candidate) => ({
        ...candidate,
        titles: [candidate.title, candidate.japanese, candidate.slug.replace(/-/g, " ")].filter(
          Boolean,
        ),
      }))
      .map((candidate) => ({ candidate, score: bestDice(titles, candidate.titles) }))
      .filter((item) => item.score >= 0.5)
      .sort((left, right) => right.score - left.score)
      .slice(0, 12)
      .map((item) => item.candidate);
    const details = await Promise.all(
      shortlist.map((candidate) => fetchDetail(candidate).catch(() => null)),
    );
    const selected = pickConfident(
      details.filter(Boolean),
      media,
      titles,
      expectedCount(media, ctx.anizip),
    );
    if (!selected) throw notFound(`AniWaves match not confident for AniList ${anilistId}`);
    return {
      siteId: selected.siteId,
      slug: selected.slug,
      title: selected.title,
      score: selected.score,
      matchScore: selected.titleScore,
      episodeCount: selected.episodeCount,
    };
  });
}

async function fetchEpisodes(series) {
  const html = String(
    (await ajax(`/ajax/episode/list/${series.siteId}?vrf=`, `${BASE}/watch/${series.slug}`)) || "",
  );
  const episodes = new Map();
  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attrs = match[1];
    const number = Number(attr(attrs, "data-num"));
    const ids = attr(attrs, "data-ids");
    if (!Number.isFinite(number) || number < 1 || episodes.has(number) || !ids) continue;
    episodes.set(number, {
      number,
      sourceNumber: attr(attrs, "data-slug") || String(number),
      ids,
      title: stripTags(match[2]).replace(/^\d+\s*/, "") || `Episode ${number}`,
      airDate: attr(attrs, "data-aired") || null,
      duration: Number(attr(attrs, "data-duration")) || null,
      filler: attr(attrs, "data-filler") === "1",
      recap: attr(attrs, "data-recap") === "1",
      hasSub: attr(attrs, "data-sub") === "1",
      hasDub: attr(attrs, "data-dub") === "1",
    });
  }
  if (!episodes.size) throw new Error(`AniWaves has no episodes for ${series.slug}`);
  return [...episodes.values()].sort((left, right) => left.number - right.number);
}

async function seriesEpisodes(anilistId, ctx) {
  const media = ctx.media ?? (await getMedia(anilistId));
  const series = await resolveSeries(anilistId, { ...ctx, media });
  const expected = expectedCount(media, ctx.anizip);
  return {
    series,
    expected,
    episodes: alignEpisodes(await fetchEpisodes(series), media, expected),
  };
}

export async function getEpisodes(anilistId, ctx = {}) {
  const localCtx = { ...ctx, media: ctx.media ?? (await getMedia(anilistId)) };
  const { series, expected, episodes } = await seriesEpisodes(anilistId, localCtx);
  const sub = [];
  const dub = [];
  for (const source of episodes) {
    if (expected && source.number > expected) continue;
    const meta = episodeMeta(source.number, localCtx);
    const base = {
      number: source.number,
      title: meta.title ?? source.title,
      duration: meta.duration ?? source.duration ?? null,
      filler: meta.filler ?? source.filler,
      uncensored: meta.uncensored,
      description: meta.description,
      image: meta.image,
      airDate: meta.airDate ?? source.airDate,
      recap: source.recap,
      sourceNumber: source.sourceNumber,
    };
    if (source.hasSub)
      sub.push({ ...base, id: watchId("aniwaves", anilistId, "sub", source.number), audio: "sub" });
    if (source.hasDub)
      dub.push({ ...base, id: watchId("aniwaves", anilistId, "dub", source.number), audio: "dub" });
  }
  return {
    meta: {
      id: series.slug,
      title: series.title,
      source: "aniwaves",
      matchScore: Number(series.matchScore.toFixed(3)),
      numbering: "standard",
      episodeOffset: 0,
    },
    episodes: { sub, dub },
  };
}

function serverGroups(html) {
  const markers = [...html.matchAll(/<div\b([^>]*)>/gi)]
    .map((match) => ({ index: match.index, type: attr(match[1], "data-type") }))
    .filter((marker) => marker.type === "sub" || marker.type === "dub");
  return markers.flatMap((marker, index) =>
    [
      ...html
        .slice(marker.index, markers[index + 1]?.index ?? html.length)
        .matchAll(/<li\b([^>]*)>([\s\S]*?)<\/li>/gi),
    ]
      .map((match) => ({
        audio: marker.type,
        linkId: attr(match[1], "data-link-id"),
        server: stripTags(match[2]) || "AniWaves",
      }))
      .filter((server) => server.linkId),
  );
}

function skipRange(value) {
  if (!Array.isArray(value) || value.length < 2) return null;
  const start = Number(value[0]);
  const end = Number(value[1]);
  return Number.isFinite(start) && Number.isFinite(end) && end > start ? { start, end } : null;
}

export async function watch(anilistId, audio, episode) {
  const { series, episodes } = await seriesEpisodes(anilistId, {});
  const target = episodes.find((item) => item.number === episode);
  if (!target || !(audio === "dub" ? target.hasDub : target.hasSub))
    throw notFound(`AniWaves ${audio} episode ${episode} not found`);
  const referer = `${BASE}/watch/${series.slug}/ep-${target.sourceNumber}`;
  const servers = serverGroups(
    String(
      (await ajax(
        `/ajax/server/list?servers=${encodeURIComponent(series.siteId)}&eps=${encodeURIComponent(target.sourceNumber)}`,
        referer,
      )) || "",
    ),
  ).filter((server) => server.audio === audio);
  if (!servers.length) throw notFound(`AniWaves has no ${audio} servers for episode ${episode}`);
  const resolved = await Promise.all(
    servers.map(async (server) => {
      try {
        const source = await ajax(
          `/ajax/sources?id=${encodeURIComponent(server.linkId)}&asi=0&autoPlay=0`,
          referer,
        );
        if (!source?.url) throw new Error("AniWaves source response has no embed url");
        const direct = await resolveEmbed(source.url, { userAgent: UA, referer }).catch(() => []);
        return { server, source, direct };
      } catch (error) {
        return { server, error };
      }
    }),
  );
  const streams = [];
  let intro = null;
  let outro = null;
  for (const item of resolved) {
    if (!item.source) continue;
    const sourceReferer = originOf(item.source.url, referer);
    intro ??= skipRange(item.source.skip_data?.intro);
    outro ??= skipRange(item.source.skip_data?.outro);
    for (const entry of [...item.direct, { url: item.source.url, type: "embed" }])
      streams.push({
        url: entry.url,
        type: entry.type,
        server: item.server.server,
        referer: sourceReferer,
        ...(entry.type === "embed" ? {} : { quality: entry.quality }),
        priority: streams.length ? 4 : 5,
        isActive: streams.length === 0,
      });
  }
  if (!streams.length)
    throw (
      resolved.find((item) => item.error)?.error ??
      new Error(`AniWaves sources unavailable for episode ${episode}`)
    );
  return {
    anilistId: Number(anilistId),
    episode,
    providerEpisode: target.number,
    audio,
    intro,
    outro,
    streams,
  };
}
