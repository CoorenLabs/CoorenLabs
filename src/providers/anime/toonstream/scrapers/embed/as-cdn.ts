import { embedPlayerOrigins, UserAgent } from "../../lib/const";
import { proxifyUrl } from "../../lib/proxy";
import { DirectSource } from "../../lib/types";

const { asCdnOrigin } = embedPlayerOrigins

export async function getAsCdnSource(url: string, origin: string = asCdnOrigin): Promise<DirectSource | undefined> {
    try {
        // get the cookie  
        const res1 = await fetch(url, {
            method: "HEAD",
            headers: {
                "User-Agent": UserAgent
            }
        })

        if (!res1.ok) {
            console.log("[ERROR] Failed to fetch for cookie:", url);
            console.log(`[ERROR] Status ${res1.status} - ${res1.statusText}`);
            return;
        }

        const cookie = res1.headers.getSetCookie();
        console.log(cookie);
        const cookieStr = cookie.join("").split(";")[0];
        console.log("GOT COOKIE:", cookieStr);

        if (!cookieStr) {
            console.log("[ERROR]  `fireplayer_player` cookie not found in headers:", url);
            return;
        }

        // get stream
        const hash = url.split('/').pop();
        const url2 = `${asCdnOrigin}/player/index.php?data=${hash}&do=getVideo`

        const res2 = await fetch(url2, {
            method: "POST",
            body: JSON.stringify({
                hash,
                r: ""
            }),
            headers: {
                "Cookie": cookieStr,
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "Origin": origin,
                "User-Agent": UserAgent,
                "X-Requested-With": "XMLHttpRequest"
            }
        })

        if (!res2.ok) {
            console.log("[ERROR] Failed to fetch for cookie:", url);
            console.log(`[ERROR] Status ${res2.status} - ${res2.statusText}`);
            return;
        }

        const { hls, videoSource, securedLink, videoImage: thumbnail } = await res2.json();
        const type = hls ? "hls" : "mp4";
        const streamUrl = securedLink || videoSource;

        // if (!hls) {
        //     console.log("Unknown source type at ", url, "skipping");
        //     return;
        // }

        const label = "Multi Audio";
        const corsHeaders = {
            "Cookie": cookieStr,
            "User-Agent": UserAgent,
        }

        // console.log(videoSource)
        // console.log(securedLink)


        return { label, type, url: streamUrl, thumbnail, headers: corsHeaders, proxiedUrl: proxifyUrl(streamUrl, type, corsHeaders) }; // fuck typescript, fuck microsoft

    } catch (err) {
        console.log("[Error]", err);
    }

}