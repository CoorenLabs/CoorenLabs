import * as cheerio from "cheerio";
import { PROXIFY } from "../route";
import { Cache } from "../lib/cache";
import { ASCDN_SOURCE_TTL, embedPlayerOrigins, RUBYSTREAM_SOURCE_TTL } from "../lib/const";
import { proxifySource } from "../lib/proxy";
import { DirectSource } from "../lib/types";
import { getAsCdnSource } from "./embed/as-cdn";
import { getRubystmSource } from "./embed/rubystm";

export async function getPlayerIframeUrls(toonStreamIframeUrls: string[]) {
    const playerIframeUrls = []
    for (const url of toonStreamIframeUrls) {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Error fetching player-iframe url from - ${url} `);

            const html = await res.text();
            const $ = cheerio.load(html, { xml: true });

            const iframeUrl = $(".Video iframe").attr("src");
            if (!iframeUrl) continue;

            playerIframeUrls.push(iframeUrl);
        } catch (err) {
            console.log("Error:", err);
        }
    }

    console.log(`Scraped ${playerIframeUrls.length} player iframe url(s)`);
    return playerIframeUrls;
}

const { asCdnOrigin, rubyStreamOrigin } = embedPlayerOrigins

export async function getDirectSources(playerIframeUrls: string[]) {
    const directSources: DirectSource[] = [];

    for (const url of playerIframeUrls) {
        try {
            if (url.startsWith(asCdnOrigin)) {
                const key = `source:${url}`;
                const cachedSource = await Cache.get(key, true);

                if (cachedSource) {
                    directSources.push(cachedSource);
                }
                else {
                    const src = await getAsCdnSource(url);
                    if (src) {
                        Cache.set(key, true, src, ASCDN_SOURCE_TTL);
                        directSources.push(src);
                    }
                }
            }
            else if (url.startsWith(rubyStreamOrigin)) {
                const key = `source:${url}`;
                const cachedSource = await Cache.get(key, true);

                if (cachedSource) {
                    directSources.push(cachedSource);
                }
                else {
                    const src = await getRubystmSource(url);
                    if (src) {
                        Cache.set(key, true, src, RUBYSTREAM_SOURCE_TTL);
                        directSources.push(src);
                    }
                }
            }
            else
                console.log("No source-scraper found for", url, "- skipping");

        } catch (err) {
            console.log("Error:", err);
        }
    }

    console.log(`Successfully Scraped ${directSources.length} direct source(s)`);

    if (PROXIFY) {
        return directSources.map(src => proxifySource(src))
    } else {
        return directSources;
    }
}