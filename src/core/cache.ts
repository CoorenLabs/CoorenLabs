// maintainer - binrot
// accept all incomings for this file, if coming from @binrot

import { Redis } from "@upstash/redis";
// NOTE: This must remain a type-only import for Node.js compatibility.
// The actual RedisClient is loaded dynamically below via require("bun").
import type { RedisClient } from "bun";
import { Logger } from "./logger";


const cacheProviders = ["default", "uptash"]

const ENABLE_CACHE = process.env.ENABLE_CACHE;
const DEFAULT_CACHE_TTL = +(process.env.DEFAULT_CACHE_TTL || -1);
const CACHE_PROVIDER = process.env.CACHE_PROVIDER;

if (
    // ENABLE_CACHE && // dont check if cache is disabled
    isNaN(DEFAULT_CACHE_TTL)
) throw new Error("Invalid `DEFAULT_CACHE_TTL` value " + process.env.DEFAULT_CACHE_TTL)


if (!CACHE_PROVIDER || !cacheProviders.includes(CACHE_PROVIDER)) throw new Error("Invalid `CACHE_PROVIDER` value " + CACHE_PROVIDER)

const REDIS_URL = process.env.REDIS_URL;
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

let redis: Redis | RedisClient | undefined;

// cache disabled
if (ENABLE_CACHE !== "true") {
    Logger.info("[Cache] Cache is turned off. serving without cache!");
}

// default
else if (CACHE_PROVIDER == "default") {
    if (!REDIS_URL) throw new Error("`REDIS_URL` is required to use redis cache!");

    if (typeof Bun !== "undefined") {
        const BunModule = require("bun");
        redis = new BunModule.RedisClient(REDIS_URL, { autoReconnect: true, connectionTimeout: 10_000, maxRetries: 3 })
        Logger.info("[Cache]  Redis (default) successfully initailized, now serving with cache!");
    } else {
        throw new Error("Default Redis caching (Bun native) is not supported on Node. Please use Upstash or disable cache.");
    }
}

// uptash
else {
    if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
        throw new Error("`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_URL` is required to use uptash redis cache!");
    }

    redis = new Redis({
        url: UPSTASH_REDIS_REST_URL,
        token: UPSTASH_REDIS_REST_TOKEN,
    });
    Logger.info("[Cache] Uptash Redis successfully initailized, now serving with cache!");
}


export class Cache {
    /**
     * 
     * @param key Cache Key
     * @param value string value. use `JSON.stringify` if not a string before passing
     * @param TTL number of seconds the cache is valid for. `default:-1` which means cache is stored forever
     * @returns `true` if successfully set, otherwise `false`
     */

    static async set(key: string, value: string, TTL: number = DEFAULT_CACHE_TTL) {
        if (redis === undefined) return;

        try {
            if (TTL == -1) {
                // store forever
                await redis.set(key, value);
            } else {
                // store for TTL seconds
                if (CACHE_PROVIDER === "default") {
                    await (redis as RedisClient).set(key, value, "EX", TTL);
                } else {
                    await redis.set(key, value, { ex: TTL });
                }
            }

            Logger.info(`[Cache] successfully saved cache, key:${key}, ttl:${TTL == -1 ? "forever" : TTL + "seconds"} `)
            return true;
        } catch (err) {
            Logger.error(`[Cache] failed to saved cache, key:${key}, ttl:${TTL == -1 ? "forever" : TTL + "seconds"} `)
            console.log(err);
            return false;
        }
    }

    /***
     * @param key  retrives the value for the key
     * @returns  value (`string`) associated with the key, otherwise `null` 
     */
    static async get(key: string) {
        if (redis === undefined) return;

        try {
            const data: string | null = await redis.get(key);

            if (data == null) Logger.info(`[Cache] MISS, key:${key}`)
            else Logger.info(`[Cache] HIT, key:${key}`)

            return data;
        } catch (error) {
            Logger.error(`[Cache] FAULT, key:${key} -`, error);
            return null;
        }
    }

    /**
     * Purges a singe key/val cache 
     * @param key 
     * @returns `true` if purge is successfull, otherwise `false`
     */
    static async purgeSingle(key: string) {
        if (redis === undefined) return;

        try {
            await redis.unlink(key);

            Logger.info(`[Cache] DELETE, key:${key}`);
            return true;
        } catch (error) {
            Logger.error(`[Cache] FAULT, key:${key} -`, error);
            return false;
        }
    }

    /**
     * Purge caches with a prefix. Useful when clearing cache for a cetain provider
     * @param prefix prefix for all the keys
     * @returns `number` number of records been deleted, `false` on error
     */
    static async purgePrefix(prefix: string) {
        if (redis === undefined) return;

        try {
            let cursor = "0";
            let totalDeleted = 0;

            do {
                let nextCursor: string;
                let keys: string[];

                if (CACHE_PROVIDER === "default") {
                    [nextCursor, keys] = await (redis as RedisClient).scan(cursor, "MATCH", `${prefix}*`);
                } else {
                    [nextCursor, keys] = await (redis as Redis).scan(cursor, { match: `${prefix}*` });
                }

                cursor = String(nextCursor);

                if (keys.length > 0) {
                    await redis.unlink(...keys);
                    totalDeleted += keys.length;
                    Logger.info(`[Cache] Deleted ${keys.length} records with prefix ${prefix}`);
                }
            } while (cursor !== "0");

            return totalDeleted;
        } catch (error) {
            Logger.error(`[Cache] FAULT, purge prefix:${prefix} -`, error);
            return false;
        }
    }
    /**
     * Purge all caches. Literally empties the all redis cache.
     * @returns `number` number of records been deleted, `false` on error 
     */
    static async purgeAll() {
        if (redis === undefined) return;

        try {
            let count = 0;

            if (CACHE_PROVIDER === "default") {
                count = await (redis as RedisClient).send("DBSIZE", []);
                await (redis as RedisClient).send("FLUSHDB", []);
            } else {
                count = await (redis as Redis).dbsize();
                await (redis as Redis).flushdb();
            }
            Logger.info(`[Cache] Purged ${count} records`);
            return count;

        } catch (error) {
            Logger.error(`[Cache] FAULT, purge all -`, error);
            return false;
        }
    }
}

