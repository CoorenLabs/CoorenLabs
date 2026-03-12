import { RedisClient } from "bun";

const redisUrl = Bun.env.REDIS_URL || undefined;
const cacheEnabled = process.env.ENABLE_CACHE && process.env.ENABLE_CACHE == "true"

if(!cacheEnabled){
    console.log("[Cache] Caching is disabled! serving without cache.")
}else{
    console.log("[Cache] Caching is enabled! serving with cache.")
}

export const redis = new RedisClient(redisUrl, {
    maxRetries: 3
});

const PREFIX = "toonstream:";

export class Cache {

    static async get(key: string, isJson: boolean) {
        if (!cacheEnabled) {
            return null;
        }

        try {
            const rawData = await redis.get(PREFIX + key);

            if (!rawData) {
                console.log(`[Cache] No data found for key: "${key}"`);
                return null;
            }

            if (isJson) {
                console.log(`[Cache] Serving from cache, key: "${key}"`);
                return JSON.parse(rawData);
            }
            else
                return rawData;
        } catch (error) {
            console.error(`[Cache] GET Error for key: "${key}":`, error);
            return null;
        }
    }


    // Overload 1: When isJson is true, data can be anything (T)
    static async set<T>(key: string, isJson: true, data: T, ttlSeconds?: number | null): Promise<boolean>;
    // Overload 2: When isJson is false, data MUST be a string
    static async set(key: string, isJson: false, data: string, ttlSeconds?: number | null): Promise<boolean>;

    static async set(key: string, isJson: boolean, data: any, ttlSeconds: number | null = null) {
        if (!cacheEnabled) {
            return null;
        }

        try {
            const dataRaw = isJson ? JSON.stringify(data) : data;

            let success;
            if (ttlSeconds == null) {
                success = await redis.set(PREFIX + key, dataRaw);  // cache forever
            } else {
                success = await redis.set(PREFIX + key, dataRaw, "EX", ttlSeconds);
            }

            if (success) {
                console.log(`[Cache] Successfully set key: "${key}"`);
                return true;
            } else
                return false;
        } catch (error) {
            console.error(`[Cache] SET Error for key: "${key}":`, error);
            return null;
        }
    }


    // DANGER - Deletes all the toonstream cache 
    static async purge() {
        try {
            const keys = await redis.keys(PREFIX + '*');
            if (keys.length > 0) {
                console.log(`[Cache] Purging ${keys.length} keys...`);
                return await redis.del(...keys);
            }
        } catch (error) {
            console.error(`[Cache] Purge cache Error:`, error);
            return null;
        }
    }

    static async del(key: string) {
        const fullKey = PREFIX + key;
        try {
            console.log(`[Cache] deleting cache key: ${key}`);
            return await redis.del(key);

        } catch (error) {
            console.error(`[Cache] delete cache Error:`, error);
            return null;
        }
    }
}


