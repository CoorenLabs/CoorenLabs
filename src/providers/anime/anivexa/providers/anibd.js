import { fetchJson, fetchText, notFound } from "../core/http.js";
import { episodeMeta, expectedCount, originOf, watchId } from "../core/utils.js";

const BASE = "https://epeng.animeapps.top";
const LABEL = "anibd";

async function fetchGroups(anilistId) {
  const data = await fetchJson(`${BASE}/api2.php?epid=${anilistId}`, { label: LABEL });
  return Array.isArray(data) ? data : [];
}

function groupAudio(group) {
  return /dub/i.test(group.server_name ?? "") ? "dub" : "sub";
}

async function playerStream(link) {
  const origin = new URL(link).origin;
  const html = await fetchText(link, {
    label: LABEL,
    headers: { Accept: "text/html,application/xhtml+xml", Referer: `${origin}/` },
  });
  const raw = html.match(/videoUrl\s*:\s*"([^"]+)"/)?.[1];
  if (!raw) throw new Error(`anibd: no videoUrl found at ${link}`);
  return /^https?:\/\//i.test(raw) ? raw : `${origin}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

export async function getEpisodes(anilistId, ctx = {}) {
  const groups = await fetchGroups(anilistId);
  if (!groups.length) throw new Error(`anibd: no episodes found for AniList ${anilistId}`);
  const expected = expectedCount(ctx.media, ctx.anizip);
  const lists = { sub: new Map(), dub: new Map() };
  for (const group of groups) {
    const audio = groupAudio(group);
    for (const episode of group.server_data ?? []) {
      const number = Number(episode.name ?? episode.slug);
      if (!Number.isFinite(number) || number < 1 || (expected && number > expected)) continue;
      if (lists[audio].has(number)) continue;
      const meta = episodeMeta(number, ctx);
      lists[audio].set(number, {
        id: watchId("anibd", anilistId, audio, number),
        number,
        title: meta.title ?? `Episode ${number}`,
        duration: meta.duration,
        filler: meta.filler,
        uncensored: meta.uncensored,
        description: meta.description,
        image: meta.image,
        airDate: meta.airDate,
        sourceLink: episode.link,
        audio,
      });
    }
  }
  const sorted = (map) => [...map.values()].sort((a, b) => a.number - b.number);
  return {
    meta: {
      id: String(anilistId),
      source: "anibd",
      matchScore: 1,
      numbering: "standard",
      episodeOffset: 0,
    },
    episodes: { sub: sorted(lists.sub), dub: sorted(lists.dub) },
  };
}

export async function watch(anilistId, audio, episode) {
  const groups = await fetchGroups(anilistId);
  const link = groups
    .filter((group) => groupAudio(group) === audio)
    .flatMap((group) => group.server_data ?? [])
    .find((item) => Number(item.name ?? item.slug) === episode)?.link;
  if (!link) throw notFound(`anibd episode ${episode} not found`);
  const data = await fetchJson(`${BASE}/apilink.php?data=${encodeURIComponent(link)}`, {
    label: LABEL,
  });
  const servers = (Array.isArray(data) ? data : []).filter((entry) => entry?.link);
  const resolved = await Promise.all(
    servers.map((entry) => playerStream(entry.link).catch(() => null)),
  );
  let active = false;
  const streams = servers.map((entry, index) => {
    const server = entry.server ?? "AniBD";
    const referer = originOf(entry.link);
    if (!resolved[index])
      return { url: entry.link, type: "embed", server, referer, priority: 1, isActive: false };
    const stream = {
      url: resolved[index],
      type: "hls",
      server,
      referer,
      priority: active ? 4 : 5,
      isActive: !active,
    };
    active = true;
    return stream;
  });
  return { anilistId: Number(anilistId), episode, audio, streams };
}
