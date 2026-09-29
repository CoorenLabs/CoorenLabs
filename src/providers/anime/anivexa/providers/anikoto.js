import { getMedia } from "../core/anilist.js";
import { memo, TTL } from "../core/cache.js";
import { fetchJson, fetchText, notFound, settle, UA } from "../core/http.js";
import { attr, originOf, stripTags, uniqueBy, watchId } from "../core/utils.js";
import { extractMegaPlay } from "../extractors/megaplay.js";

const ANIKOTO = "https://anikototv.to";
const MAPPER = "https://mapper.nekostream.site/api/mal";
const SPOOF_REF = "https://hianimes.re/";
const LABEL = "Anikoto";
const AJAX = { "X-Requested-With": "XMLHttpRequest", Referer: `${ANIKOTO}/` };
const LANGUAGES = {
  en: "en",
  english: "en",
  ja: "ja",
  japanese: "ja",
  fr: "fr",
  french: "fr",
  de: "de",
  german: "de",
  es: "es",
  spanish: "es",
  pt: "pt",
  portuguese: "pt",
};
const MODIFIERS = [
  "ova",
  "movie",
  "special",
  "specials",
  "tales",
  "journal",
  "part",
  "season",
  "kanwa",
  "spin-off",
  "theatre",
];

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function scoreCandidate(candidate, english, romaji, synonyms) {
  const name = normalize(candidate.name);
  const jp = normalize(candidate.jp);
  const slug = normalize(candidate.slug);
  const normEnglish = normalize(english);
  const normRomaji = normalize(romaji);
  let score = 0;
  if (normEnglish && name === normEnglish) score += 1000;
  if (normRomaji && name === normRomaji) score += 900;
  if (normRomaji && jp === normRomaji) score += 800;
  const target = `${english || ""} ${romaji || ""} ${synonyms.join(" ")}`.toLowerCase();
  for (const modifier of MODIFIERS)
    if ((name.includes(modifier) || slug.includes(modifier)) && !target.includes(modifier))
      score -= 300;
  for (const title of [english, romaji, ...synonyms]) {
    const normTitle = normalize(title);
    if (normTitle.length < 3) continue;
    if (name === normTitle) score += 200;
    else if (name.startsWith(normTitle) || normTitle.startsWith(name)) score += 80;
    else if (name.includes(normTitle) || normTitle.includes(name)) score += 40;
    if (jp && jp === normTitle) score += 100;
  }
  return score - Math.abs(name.length - (normEnglish || normRomaji).length) * 2;
}

async function search(query) {
  const html = await fetchText(`${ANIKOTO}/filter?keyword=${encodeURIComponent(query)}`, {
    label: LABEL,
    headers: { Accept: "text/html,*/*", Referer: `${ANIKOTO}/` },
  });
  const candidates = [
    ...html.matchAll(
      /<a\s+class="name d-title"\s+href="https:\/\/anikototv\.to\/watch\/([^"/]+)(?:\/ep-\d+)?"[^>]*data-jp="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g,
    ),
  ].map((match) => ({ slug: match[1], jp: match[2].trim(), name: stripTags(match[3]) }));
  if (!candidates.length)
    for (const match of html.matchAll(
      /<a\s+href="https:\/\/anikototv\.to\/watch\/([^"/]+)(?:\/ep-\d+)?"[^>]*>[\s\S]*?<\/a>/g,
    ))
      candidates.push({ slug: match[1], name: match[1], jp: "" });
  return candidates;
}

function resolveShow(anilistId, media) {
  return memo(`series:anikoto:${anilistId}`, TTL.identity, async () => {
    const english = media.title?.english;
    const romaji = media.title?.romaji;
    const synonyms = media.synonyms || [];
    const keywords = [...new Set([english, romaji, ...synonyms].filter(Boolean))].slice(0, 5);
    const results = await settle(
      keywords.map((keyword) => search(keyword)),
      [],
    );
    const candidates = uniqueBy(results.flat(), (candidate) => candidate.slug);
    if (!candidates.length) throw notFound(`No results found on Anikoto for: ${english || romaji}`);
    const chosen = candidates
      .map((candidate) => ({
        ...candidate,
        score: scoreCandidate(candidate, english, romaji, synonyms),
      }))
      .sort((a, b) => b.score - a.score)[0];
    const html = await fetchText(`${ANIKOTO}/watch/${chosen.slug}`, {
      label: LABEL,
      headers: { Accept: "text/html,*/*", Referer: `${ANIKOTO}/` },
    });
    const showId = html.match(/data-id="(\d+)"/)?.[1];
    if (!showId) throw new Error(`Could not find show ID for slug: ${chosen.slug}`);
    return { slug: chosen.slug, showId, title: chosen.name };
  });
}

async function episodeList(show) {
  const data = await fetchJson(`${ANIKOTO}/ajax/episode/list/${show.showId}`, {
    label: LABEL,
    headers: { ...AJAX, Referer: `${ANIKOTO}/watch/${show.slug}` },
  });
  return [...String(data.result || "").matchAll(/<a\s+[^>]*data-id="[^"]*"[^>]*>([\s\S]*?)<\/a>/g)]
    .map((match) => {
      const tag = match[0].slice(0, match[0].indexOf(">") + 1);
      return {
        number: parseInt(attr(tag, "data-num")),
        sub: attr(tag, "data-sub") === "1",
        dub: attr(tag, "data-dub") === "1",
        ids: attr(tag, "data-ids"),
        mal: attr(tag, "data-mal"),
        slug: attr(tag, "data-slug"),
        timestamp: attr(tag, "data-timestamp"),
        title: stripTags(
          match[1].match(/<span class="d-title"[^>]*>([\s\S]*?)<\/span>/)?.[1] ?? "",
        ),
      };
    })
    .filter((episode) => Number.isFinite(episode.number));
}

async function mediaFor(anilistId, ctx) {
  const media = ctx.media || (await getMedia(anilistId));
  if (!media) throw new Error(`Could not resolve media for AniList ID: ${anilistId}`);
  return media;
}

export async function getEpisodes(anilistId, ctx = {}) {
  const media = await mediaFor(anilistId, ctx);
  const show = await resolveShow(anilistId, media);
  const episodes = await episodeList(show);
  const firstMal = media.idMal || parseInt(episodes.find((episode) => episode.mal)?.mal) || null;
  const sub = [];
  const dub = [];
  for (const episode of episodes) {
    const meta = ctx.anizip?.episodes?.[String(episode.number)] ?? {};
    const base = {
      number: episode.number,
      title: episode.title || `Episode ${episode.number}`,
      duration: null,
      filler: false,
      uncensored: false,
      description: meta.overview || meta.summary || null,
      image: meta.image || null,
      airDate: meta.airDate || meta.airdate || null,
    };
    if (episode.sub)
      sub.push({ id: watchId("anikoto", anilistId, "sub", episode.number), ...base, audio: "sub" });
    if (episode.dub)
      dub.push({ id: watchId("anikoto", anilistId, "dub", episode.number), ...base, audio: "dub" });
  }
  sub.sort((a, b) => a.number - b.number);
  dub.sort((a, b) => a.number - b.number);
  return {
    meta: { title: show.title, slug: show.slug, malId: firstMal, source: "anikoto" },
    episodes: { sub, dub },
  };
}

function subtitleType(serverType) {
  if (serverType === "hsub") return "hardsub";
  if (serverType === "sub") return "softsub";
  return null;
}

function skipRange(value) {
  if (value?.length !== 2) return null;
  const [start, end] = value;
  return start || end ? { start: Number(start) || 0, end: Number(end) || 0 } : null;
}

function mapTrack(track, source) {
  const label = track.label ?? "";
  return {
    url: track.file,
    label: label || "English",
    srclang: LANGUAGES[label.toLowerCase().split(" ")[0]] ?? "en",
    default: track.default ?? false,
    source,
  };
}

function resolveLink(linkId) {
  if (linkId.startsWith("http")) return Promise.resolve({ url: linkId });
  return fetchJson(`${ANIKOTO}/ajax/server?get=${encodeURIComponent(linkId)}`, {
    label: LABEL,
    headers: AJAX,
  })
    .then((data) => data?.result ?? null)
    .catch(() => null);
}

function parseServers(html, audio) {
  const servers = [];
  const downloads = [];
  for (const group of html.matchAll(
    /<div class="type" data-type="([^"]+)">([\s\S]*?)<\/ul>\s*<\/div>/g,
  )) {
    const type = group[1];
    for (const item of group[2].matchAll(/<li\s+([^>]*data-link-id[^>]*)>([\s\S]*?)<\/li>/g)) {
      const linkId = item[1].match(/data-link-id="([^"]+)"/)?.[1];
      const name = item[2]
        .replace(/<[^>]+>/g, "")
        .replace(/[<>]/g, "")
        .trim();
      if (!linkId) continue;
      if (type === "dl" || /download|kiwi/i.test(name)) downloads.push({ linkId, name });
      else if (type === audio || (audio === "sub" && type === "hsub"))
        servers.push({ linkId, name, serverType: type, subtitleType: subtitleType(type) });
    }
  }
  return { servers, downloads };
}

async function serverStreams(item) {
  const resolved = await resolveLink(item.linkId);
  const embedUrl = resolved?.url;
  if (!embedUrl) return null;
  let intro = skipRange(resolved.skip_data?.intro);
  let outro = skipRange(resolved.skip_data?.outro);
  const sources = [];
  const encoded = embedUrl.includes("#aHR0c") ? embedUrl.split("#")[1] : null;
  if (encoded) {
    try {
      const decoded = atob(encoded);
      if (decoded.includes(".m3u8")) sources.push({ url: decoded, variant: null });
    } catch {}
  }
  const extracted = await extractMegaPlay(embedUrl, { userAgent: UA, referer: SPOOF_REF }).catch(
    () => null,
  );
  for (const source of extracted?.sources ?? [])
    if (!sources.some((known) => known.url === source.url)) sources.push(source);
  const tracks = (extracted?.tracks ?? []).map((track) => mapTrack(track, item.name));
  intro = skipRange([extracted?.intro?.start, extracted?.intro?.end]) ?? intro;
  outro = skipRange([extracted?.outro?.start, extracted?.outro?.end]) ?? outro;
  const shared = {
    server: item.name,
    ...(item.subtitleType ? { subtitleType: item.subtitleType } : {}),
  };
  const embed = { url: embedUrl, type: "embed", ...shared, referer: originOf(embedUrl) };
  const streams = sources.map((source) => ({
    url: source.url,
    type: "hls",
    server: item.name,
    embedUrl,
    referer: extracted?.origin ? `${extracted.origin}/` : originOf(embedUrl),
    subtitles: tracks,
    ...(item.subtitleType ? { subtitleType: item.subtitleType } : {}),
    ...(source.variant ? { variant: source.variant } : {}),
    ...(intro ? { intro } : {}),
    ...(outro ? { outro } : {}),
  }));
  if (!sources.length) Object.assign(embed, intro ? { intro } : {}, outro ? { outro } : {});
  return { streams: [...streams, embed], tracks };
}

function streamRank(stream) {
  if (stream.type === "hls" && stream.variant === "modern") return 0;
  return stream.type === "hls" ? 1 : 2;
}

export async function watch(anilistId, audio, episode) {
  const media = await mediaFor(anilistId, {});
  const show = await resolveShow(anilistId, media);
  const target = (await episodeList(show)).find((item) => item.number === episode);
  if (!target?.ids) throw notFound(`Episode ${episode} not found for show: ${show.title}`);
  const [serverData, mapperData] = await Promise.all([
    fetchJson(`${ANIKOTO}/ajax/server/list?servers=${encodeURIComponent(target.ids)}`, {
      label: LABEL,
      headers: AJAX,
    }).catch(() => null),
    target.mal && target.slug && target.timestamp
      ? fetchJson(`${MAPPER}/${target.mal}/${target.slug}/${target.timestamp}`, {
          label: LABEL,
          headers: { Referer: `${ANIKOTO}/` },
        }).catch(() => null)
      : null,
  ]);
  const { servers, downloads } = parseServers(String(serverData?.result || ""), audio);
  for (const [key, value] of Object.entries(mapperData ?? {})) {
    if (key === "status") continue;
    const name = key.replace(/[-_]+$/, "").trim();
    if (value?.[audio]?.url)
      servers.push({
        linkId: value[audio].url,
        name,
        serverType: audio,
        subtitleType: subtitleType(audio),
      });
    for (const url of Object.values(value?.[audio]?.download ?? {}))
      if (url && typeof url === "string") downloads.push({ url, name });
  }
  const unique = uniqueBy(
    servers,
    (item) => `${item.name}:${item.subtitleType || item.serverType || audio}`,
  );
  const [results, downloadUrls] = await Promise.all([
    Promise.all(unique.map(serverStreams)),
    Promise.all(
      downloads.map((item) => item.url ?? resolveLink(item.linkId).then((data) => data?.url)),
    ),
  ]);
  const streams = results
    .flatMap((result) => result?.streams ?? [])
    .map((stream, index) => ({ stream, index }))
    .sort(
      (left, right) =>
        streamRank(left.stream) - streamRank(right.stream) || left.index - right.index,
    )
    .map(({ stream }, index) => ({
      ...stream,
      priority: index === 0 ? 5 : 4,
      isActive: index === 0,
    }));
  return {
    anilistId: parseInt(anilistId),
    malId: media.idMal || (target.mal ? parseInt(target.mal) : null),
    episode,
    audio,
    streams,
    subtitles: uniqueBy(
      results.flatMap((result) => result?.tracks ?? []),
      (track) => track.url,
    ),
    downloads: uniqueBy(
      downloads
        .map((item, index) => ({ url: downloadUrls[index], label: item.name }))
        .filter((item) => item.url),
      (item) => item.url,
    ),
    headers: { "User-Agent": UA, Referer: streams[0]?.referer || `${ANIKOTO}/` },
  };
}
