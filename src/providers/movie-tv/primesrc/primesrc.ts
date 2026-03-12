// maintainer - @binrot
// currently supports  `Primevid` and `Streamtape` Server, 
//TODO add other server extractors

import { Cache } from "../../../core/cache";
import { fetcher } from "../../../core/lib/fetcher";
import { Logger } from "../../../core/logger";
import { USER_AGENT } from "../../anime/animepahe/scraper";
import { primesrc as origin } from "../../origins";
import { extractDoodstream } from "./extractors/doodstream";
import { extractPrimevid } from "./extractors/primevid";
import { extractStreamtape } from "./extractors/streamtape";
import type { Response, ServerSource } from "./types";
const cachePrefix = "primesrc:";

const PRIMESRC_CACHE_FOUND_TLL = 3 * 3600; // 3hr
const PRIMESRC_CACHE_NOT_FOUND_TLL = 10 * 60 // 10min  

export class Primesrc {
    private static async getSources(type: "movie" | "tv", tmdbId: number, season: number = 0, episode: number = 0) {
        let url;

        if (type == "movie") {
            url = `${origin}/api/v1/s?tmdb=${tmdbId}&type=movie`

        } else {
            url = `${origin}/api/v1/s?tmdb=${tmdbId}&season=${season}&episode=${episode}&type=tv`
        }


        const headers = {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9",
            "cache-control": "no-cache",
            "pragma": "no-cache",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Google Chrome\";v=\"143\", \"Chromium\";v=\"143\", \"Not A(Brand\";v=\"24\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            origin: origin,
            referer: origin + (type == "movie" ? `/embed/movie?tmdb=${tmdbId}` : `/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`),
            "user-agent": USER_AGENT
        };

        try {
            const res = await fetch(url, { headers });
            if (!res.ok) {
                console.log(await res.text())
                Logger.error("[primesrc]", "fetch err: failed to get avaiable servers from api");
                return;
            }

            const { servers } = await res.json();
            if (!servers) {
                Logger.error("[primesrc]", "no servers from api");
                return;
            }

            const serverSources: ServerSource[] = [];
            const supportedServers = [
                "PrimeVid",
                "Streamtape",
                "Dood",
                //-TODO implement other servers
            ]
            const serversExtractors = {
                "PrimeVid": extractPrimevid,
                "Streamtape": extractStreamtape,
                "Dood": extractDoodstream
            }

            for (const server of servers) {
                const { quality, key, name, file_name, file_size } = server;

                if (!supportedServers.includes(name)) continue

                // const res2 = await fetch(`${origin}/api/v1/l?key=${key}`, { headers }) // now gives capcha error
                const _data = await fetcher(`${origin}/api/v1/l?key=${key}`, true, "primesrc", { headers })

                if (!_data) {
                    Logger.error("[primesrc]", "no data found from fetcher for server: ", name);
                    continue;
                }

                const { success, status, text } = _data
                if (!success) {
                    // console.log(await res2.text())
                    Logger.error("[primesrc]", "failed to fetch for server: ", name, "status:", status);
                    continue;
                }

                const { link } = JSON.parse(text);
                if (!link) {
                    Logger.error("[primesrc]", "`link` field not found for server: ", name);
                    continue;
                }

                const data = await serversExtractors[name as keyof typeof serversExtractors](link);
                if (!data) continue;

                const { sources, subtitles } = data;
                if (!sources) continue;

                serverSources.push({ name, sources, subtitles })

            }

            return serverSources;
        } catch (err) {
            Logger.error("[primesrc]", "Error occured", err);
        }

    }
    static async getMovieSource(tmdbid: number): Promise<Response<ServerSource[]>> {
        const key = cachePrefix + "source:movie:" + tmdbid;
        const cachedData = await Cache.get(key);

        if (cachedData) {
            if (cachedData == "NOT_FOUND") {
                return { success: false, status: 404 }
            }
            return { success: true, status: 200, data: JSON.parse(cachedData) };
        }

        const data = await Primesrc.getSources("movie", tmdbid);
        if (data) {
            Cache.set(key, JSON.stringify(data), PRIMESRC_CACHE_FOUND_TLL) // dont await
            return { success: true, status: 200, data }
        } else {
            Cache.set(key, "NOT_FOUND", PRIMESRC_CACHE_NOT_FOUND_TLL) // dont await
            return { success: false, status: 404 }
        }
    }
    static async getTvSource(tmdbid: number, season: number, episode: number) {
        const key = `${cachePrefix}:source:tv:${tmdbid}:${season}:${episode}`;
        const cachedData = await Cache.get(key);

        if (cachedData) {
            if (cachedData == "NOT_FOUND") {
                return { success: false, status: 404 }
            }
            return { success: true, status: 200, data: JSON.parse(cachedData) };
        }

        const data = await Primesrc.getSources("tv", tmdbid, season, episode);

        if (data) {
            Cache.set(key, JSON.stringify(data), PRIMESRC_CACHE_FOUND_TLL) // dont await
            return { success: true, status: 200, data }
        } else {
            Cache.set(key, "NOT_FOUND", PRIMESRC_CACHE_NOT_FOUND_TLL) // dont await
            return { success: false, status: 404 }
        }
    }
}
