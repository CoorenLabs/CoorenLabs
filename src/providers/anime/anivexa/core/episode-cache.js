import { PROVIDER_NAMES } from "../providers/index.js";
import { forgetMedia, getAniZip, getMedia } from "./anilist.js";
import { background, needsRefresh, read, TTL, write } from "./cache.js";
import { providerEpisodes } from "./episode-strategy.js";
import { mapAnimeIds } from "./mapper.js";

const FULL_TTL = 30 * TTL.day;
const NORMAL_PROBE_INTERVAL = 15 * TTL.minute;
const AIRING_PROBE_INTERVAL = 5 * TTL.minute;
const AIRING_EARLY_WINDOW = 10 * TTL.minute;
const AIRING_FAST_WINDOW = 6 * TTL.hour;

const refreshing = new Set();

function latestEpisode(data) {
  let max = 0;
  for (const provider of Object.values(data ?? {})) {
    for (const list of Object.values(provider?.episodes ?? {})) {
      if (!Array.isArray(list)) continue;
      for (const episode of list) {
        const n = Number(episode?.number);
        if (Number.isFinite(n) && n > max) max = n;
      }
    }
  }
  return max || null;
}

function failedProviders(data) {
  return PROVIDER_NAMES.filter((name) => !data?.[name] || data[name].error);
}

function latestAniZipEpisode(anizip) {
  let max = 0;
  for (const key of Object.keys(anizip?.episodes ?? {})) {
    const n = Number(key);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max || null;
}

function resolveShared(anilistId, fresh = false) {
  if (fresh) forgetMedia(anilistId);
  return Promise.all([getMedia(anilistId).catch(() => null), getAniZip(anilistId, fresh)]);
}

async function buildResponse(anilistId, media, anizip, fresh = false) {
  const [providers, mapping] = await Promise.all([
    providerEpisodes(PROVIDER_NAMES, anilistId, media, anizip, { fresh }),
    mapAnimeIds(anilistId).catch(() => null),
  ]);
  return { page: 1, type: "all", mappings: mapping?.mappings ?? null, ...providers };
}

function probeInterval(state) {
  const airMs = state?.nextAiringAt ? state.nextAiringAt * 1000 : null;
  if (!airMs) return NORMAL_PROBE_INTERVAL;
  const now = Date.now();
  return now >= airMs - AIRING_EARLY_WINDOW && now <= airMs + AIRING_FAST_WINDOW
    ? AIRING_PROBE_INTERVAL
    : NORMAL_PROBE_INTERVAL;
}

function shouldRebuild(entry, media, anizip) {
  if ((media?.status ?? "RELEASING") === "FINISHED") return false;
  const cachedLatest = latestEpisode(entry?.data) ?? 0;
  const knownLatest = Math.max(latestAniZipEpisode(anizip) ?? 0, Number(media?.episodes) || 0);
  if (knownLatest > cachedLatest) return true;
  const next = media?.nextAiringEpisode;
  if (next?.episode && cachedLatest >= Number(next.episode)) return false;
  if (next?.airingAt) {
    const airMs = Number(next.airingAt) * 1000;
    const now = Date.now();
    if (now < airMs - AIRING_EARLY_WINDOW) return false;
    if (now <= airMs + AIRING_FAST_WINDOW) return true;
  }
  return needsRefresh(entry);
}

function syncState(data, media, previous = {}) {
  return {
    lastProbeAt: Date.now(),
    lastSyncAt: data ? Date.now() : (previous.lastSyncAt ?? null),
    latestEpisode: latestEpisode(data ?? previous.data),
    nextEpisode: media?.nextAiringEpisode?.episode ?? null,
    nextAiringAt: media?.nextAiringEpisode?.airingAt ?? null,
    syncing: false,
  };
}

async function scheduleRefresh(anilistId, entry) {
  if (refreshing.has(anilistId)) return;
  const syncKey = `sync:${anilistId}`;
  const previous = (await read(syncKey))?.data;
  if (previous?.lastProbeAt && Date.now() - previous.lastProbeAt < probeInterval(previous)) return;
  refreshing.add(anilistId);
  write(
    syncKey,
    { ...previous, lastProbeAt: Date.now(), syncing: true },
    FULL_TTL,
    NORMAL_PROBE_INTERVAL,
  );
  background(`episodes refresh ${anilistId}`, async () => {
    try {
      const [media, anizip] = await resolveShared(anilistId, true);
      let data = null;
      if (shouldRebuild(entry, media, anizip))
        data = await buildResponse(anilistId, media, anizip, true);
      else if (failedProviders(entry.data).length)
        data = {
          ...entry.data,
          ...(await providerEpisodes(failedProviders(entry.data), anilistId, media, anizip, {
            fresh: true,
          })),
        };
      if (data) write(`episodes:${anilistId}`, data, FULL_TTL, NORMAL_PROBE_INTERVAL);
      write(
        syncKey,
        syncState(data, media, { ...previous, data: entry.data }),
        FULL_TTL,
        NORMAL_PROBE_INTERVAL,
      );
    } catch (error) {
      write(
        syncKey,
        { ...previous, lastProbeAt: Date.now(), syncing: false, error: error.message },
        TTL.hour,
      );
      throw error;
    } finally {
      refreshing.delete(anilistId);
    }
  });
}

export async function getEpisodesResponse(anilistId) {
  const key = `episodes:${anilistId}`;
  const entry = await read(key);
  if (entry && failedProviders(entry.data).length < PROVIDER_NAMES.length) {
    await scheduleRefresh(anilistId, entry);
    return entry.data;
  }
  const [media, anizip] = await resolveShared(anilistId);
  const result = await buildResponse(anilistId, media, anizip);
  write(key, result, FULL_TTL, NORMAL_PROBE_INTERVAL);
  write(`sync:${anilistId}`, syncState(result, media), FULL_TTL, NORMAL_PROBE_INTERVAL);
  return result;
}

export async function getFilteredEpisodesResponse(anilistId, providers, includeMap) {
  const [media, anizip] = await resolveShared(anilistId);
  const [data, mapping] = await Promise.all([
    providerEpisodes(providers, anilistId, media, anizip),
    includeMap ? mapAnimeIds(anilistId).catch(() => null) : null,
  ]);
  return {
    page: 1,
    type: "filtered",
    ...(includeMap ? { mappings: mapping?.mappings ?? null } : {}),
    ...data,
  };
}
