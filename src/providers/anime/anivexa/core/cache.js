import { Cache } from "../../../../core/cache";
import { Logger } from "../../../../core/logger";
import { env } from "../../../../core/runtime";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const PREFIX = "anivexa:";
const MAX_BYTES = 64 * 1024 * 1024;
const MAX_MEMOS = 1000;

export const TTL = {
  minute: MINUTE,
  hour: HOUR,
  day: DAY,
  watch: 3 * HOUR,
  signedWatch: MINUTE,
  identity: DAY,
};

const CACHE_ENABLED = env.ENABLE_CACHE === "true";

const entries = new Map();
const memos = new Map();
const inflight = new Map();
let bytes = 0;

function touch(map, key, value) {
  map.delete(key);
  map.set(key, value);
}

function remember(key, entry, size) {
  const previous = entries.get(key);
  if (previous) bytes -= previous.size;
  touch(entries, key, { entry, size });
  bytes += size;
  for (const [oldest, value] of entries) {
    if (bytes <= MAX_BYTES || oldest === key) break;
    entries.delete(oldest);
    bytes -= value.size;
  }
}

export function isFresh(entry) {
  return Boolean(entry) && Date.now() < entry.expiresAt;
}

export function needsRefresh(entry) {
  return !entry || (entry.refreshAt !== null && Date.now() >= entry.refreshAt);
}

export async function read(key) {
  if (!CACHE_ENABLED) return null;
  const local = entries.get(key);
  if (local) {
    touch(entries, key, local);
    return local.entry;
  }
  const raw = await Cache.get(PREFIX + key);
  if (!raw) return null;
  try {
    const entry = JSON.parse(raw);
    remember(key, entry, raw.length);
    return entry;
  } catch {
    return null;
  }
}

export function write(key, data, ttl, refreshAfter = ttl) {
  if (!CACHE_ENABLED || data === undefined) return;
  const now = Date.now();
  const entry = {
    data,
    cachedAt: now,
    refreshAt: Number.isFinite(refreshAfter) ? now + refreshAfter : null,
    expiresAt: now + ttl,
  };
  const raw = JSON.stringify(entry);
  remember(key, entry, raw.length);
  void Cache.set(PREFIX + key, raw, Math.ceil(ttl / 1000));
}

export function dedupe(key, producer) {
  const pending = inflight.get(key);
  if (pending) return pending;
  const promise = Promise.resolve()
    .then(producer)
    .finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

export function background(label, task) {
  Promise.resolve()
    .then(task)
    .catch((error) => Logger.debug(`[anivexa] ${label}: ${error?.message ?? error}`));
}

export async function cached(key, options, producer) {
  const { ttl, refreshAfter = ttl, force = false } = options;
  const entry = force ? null : await read(key);
  const run = async () => {
    const data = await producer();
    write(key, data, ttl, refreshAfter);
    return data;
  };
  if (isFresh(entry)) {
    if (needsRefresh(entry) && !inflight.has(key))
      background(`refresh ${key}`, () => dedupe(key, run));
    return entry.data;
  }
  return force ? run() : dedupe(key, run);
}

export function recall(key) {
  const hit = memos.get(key);
  if (!hit || hit.expiresAt <= Date.now()) return undefined;
  touch(memos, key, hit);
  return hit.value;
}

export function keep(key, value, ttl) {
  if (value === null || value === undefined) return;
  touch(memos, key, { value, expiresAt: Date.now() + ttl });
  if (memos.size > MAX_MEMOS) memos.delete(memos.keys().next().value);
}

export function memo(key, ttl, producer) {
  const hit = recall(key);
  if (hit !== undefined) return Promise.resolve(hit);
  return dedupe(`memo:${key}`, async () => {
    const value = await producer();
    keep(key, value, ttl);
    return value;
  });
}

export function forget(key) {
  memos.delete(key);
}

export function episodeTtl(status) {
  switch (status) {
    case "FINISHED":
      return { ttl: 7 * DAY, refreshAfter: Infinity };
    case "RELEASING":
      return { ttl: 2 * HOUR, refreshAfter: 15 * MINUTE };
    case "HIATUS":
      return { ttl: 6 * HOUR, refreshAfter: HOUR };
    case "NOT_YET_RELEASED":
      return { ttl: 30 * MINUTE, refreshAfter: 15 * MINUTE };
    default:
      return { ttl: HOUR, refreshAfter: 15 * MINUTE };
  }
}

export function mapTtl(status) {
  return status === "FINISHED" ? 30 * DAY : 12 * HOUR;
}
