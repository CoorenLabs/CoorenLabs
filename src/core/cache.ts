import { Redis } from "@upstash/redis";
import { Logger } from "./logger";
import { env, isBun } from "./runtime";

type Store = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl: number): Promise<unknown>;
};

const DEFAULT_TTL = parseInt(env.DEFAULT_CACHE_TTL || "-1", 10);
if (Number.isNaN(DEFAULT_TTL)) {
  throw new Error(`Invalid DEFAULT_CACHE_TTL: ${env.DEFAULT_CACHE_TTL}`);
}

async function createStore(): Promise<Store | null> {
  if (env.ENABLE_CACHE !== "true") {
    Logger.info("[Cache] Disabled");
    return null;
  }

  const provider = env.CACHE_PROVIDER;

  if (provider === "default") {
    if (!isBun) {
      Logger.warn("[Cache] The default provider needs Bun's RedisClient; caching is disabled");
      return null;
    }
    if (!env.REDIS_URL) throw new Error("REDIS_URL is required for the default cache provider");
    const { RedisClient } = await import("bun");
    const client = new RedisClient(env.REDIS_URL, {
      autoReconnect: true,
      connectionTimeout: 10_000,
      maxRetries: 3,
    });
    Logger.info("[Cache] Using Redis");
    return {
      get: (key) => client.get(key),
      set: (key, value, ttl) =>
        ttl > 0 ? client.set(key, value, "EX", ttl) : client.set(key, value),
    };
  }

  if (provider === "upstash" || provider === "uptash") {
    const url = env.UPSTASH_REDIS_REST_URL;
    const token = env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      throw new Error(
        "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required for the upstash cache provider",
      );
    }
    const client = new Redis({ url, token, automaticDeserialization: false });
    Logger.info("[Cache] Using Upstash Redis");
    return {
      get: (key) => client.get<string>(key),
      set: (key, value, ttl) =>
        ttl > 0 ? client.set(key, value, { ex: ttl }) : client.set(key, value),
    };
  }

  throw new Error(`Invalid CACHE_PROVIDER: ${provider}`);
}

const store = await createStore();

export const Cache = {
  async get(key: string): Promise<string | null> {
    if (!store) return null;
    try {
      const value = await store.get(key);
      Logger.debug(`[Cache] ${value === null ? "MISS" : "HIT"} ${key}`);
      return value;
    } catch (err) {
      Logger.error(`[Cache] Read failed for ${key}`, err);
      return null;
    }
  },

  async set(key: string, value: string, ttl = DEFAULT_TTL): Promise<boolean> {
    if (!store) return false;
    try {
      await store.set(key, value, ttl);
      return true;
    } catch (err) {
      Logger.error(`[Cache] Write failed for ${key}`, err);
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

  setJson(key: string, value: unknown, ttl?: number): Promise<boolean> {
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
