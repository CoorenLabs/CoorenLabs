import { Logger } from "./logger";
import { env, isBun } from "./runtime";

type Store = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl: number): Promise<unknown>;
};

async function createStore(): Promise<Store | null> {
  const url = env.REDIS_URL;
  if (!url) {
    Logger.info("[Cache] Disabled (REDIS_URL is not set)");
    return null;
  }
  if (!isBun) {
    Logger.warn("[Cache] Redis caching needs the Bun runtime; running without cache");
    return null;
  }
  const { RedisClient } = await import("bun");
  const client = new RedisClient(url, {
    autoReconnect: true,
    connectionTimeout: 5_000,
    maxRetries: 3,
  });
  try {
    await client.connect();
  } catch (err) {
    client.close();
    Logger.warn(`[Cache] Redis is unreachable (${(err as Error).message}); running without cache`);
    return null;
  }
  Logger.info("[Cache] Enabled (Redis)");
  return {
    get: (key) => client.get(key),
    set: (key, value, ttl) => client.set(key, value, "EX", Math.max(1, Math.ceil(ttl))),
  };
}

const store = await createStore();
let healthy = true;

function report(action: string, err: unknown) {
  const message = `[Cache] ${action} failed: ${(err as Error).message}`;
  if (healthy) Logger.warn(message);
  else Logger.debug(message);
  healthy = false;
}

export const Cache = {
  enabled: store !== null,

  async get(key: string): Promise<string | null> {
    if (!store) return null;
    try {
      const value = await store.get(key);
      healthy = true;
      Logger.debug(`[Cache] ${value === null ? "MISS" : "HIT"} ${key}`);
      return value;
    } catch (err) {
      report("Read", err);
      return null;
    }
  },

  async set(key: string, value: string, ttl: number): Promise<boolean> {
    if (!store) return false;
    try {
      await store.set(key, value, ttl);
      healthy = true;
      return true;
    } catch (err) {
      report("Write", err);
      return false;
    }
  },

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await Cache.get(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  setJson(key: string, value: unknown, ttl: number): Promise<boolean> {
    return Cache.set(key, JSON.stringify(value), ttl);
  },

  async remember<T>(
    key: string,
    ttl: number,
    producer: () => Promise<T>,
  ): Promise<{ data: T; cached: boolean }> {
    const hit = await Cache.getJson<T>(key);
    if (hit !== null) return { data: hit, cached: true };
    const data = await producer();
    if (data !== null && data !== undefined) void Cache.setJson(key, data, ttl);
    return { data, cached: false };
  },
};
