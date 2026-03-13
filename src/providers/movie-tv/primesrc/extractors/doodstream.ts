import { fetcher } from "../../../../core/lib/fetcher";
import { Logger } from "../../../../core/logger";
import { ServerSource } from "../types";


import { doodstream as origin } from "../../../origins";

const headers: Record<string, string> = {
    "Accept": "*/*",
    "Accept-Encoding": "identity;q=1, *;q=0",
    "Accept-Language": "en-US,en;q=0.5",
    "Connection": "keep-alive",
    "origin": origin,
    "sec-ch-ua": '"Not:A-Brand";v="99", "Brave";v="145", "Chromium";v="145"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "Sec-Fetch-Dest": "video",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-Storage-Access": "none",
    "Sec-GPC": "1",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36"
}

const logPrefix = "[doodstream]"

export const extractDoodstream = async (url: string) => {
    headers["referer"] = url;

    Logger.info(logPrefix, url);
    const id = url.split("/").reverse()[0];

    if (!id) {
        Logger.error(logPrefix, "failed to extract id from `url`!");
        return;
    }

    try {
        const data1 = await fetcher(`${origin}/e/${id}`, true, "doodstream", {
            headers,
            keepalive: true
        });

        if (!data1) {
            Logger.error("[doodstream] data1 not found!");
            return;
        }

        const { success: success1, status: status1, text: text1 } = data1;

        if (!success1) {
            Logger.error("[doodstream] Fetcher failed, status:", status1);
            return;
        }

        Bun.write(`./logs/${Date.now()}`, text1);
        Logger.info(status1);

        const md5passRegex = /\/pass_md5\/[^'"]*/;
        const match = text1.match(md5passRegex);

        const path = match && match[0];

        if (!path) {
            Logger.error(logPrefix, "failed to extract `pass_md5`  path");
            return;
        }

        // ?token=bcditrsyblzoequ7fi0dobkp&
        const tokenRegex = /\?token=([^&]*)&/;
        const match_token = text1.match(tokenRegex);

        // console.log(match, match_token)
        const token = match_token && match_token[1];
        if (!token) {
            Logger.error(logPrefix, "failed to extract `token`  path");
            return;
        }


        Logger.info(logPrefix, "PATH:", path, "TOKEN:", token);

        // vtt: '//i.doodcdn.io/get_slides/8348/jiyesi59gq14yuzi.jpg'
        const vttRegex = /vtt:\s*['"]([^'"]*)/;
        const match2 = text1.match(vttRegex);

        // console.log(match2)
        const vtt = match2 && match2[1] ? match2[1] : "";

        // <meta name="og:image" content="https://thumbcdn.com/splash/jiyesi59gq14yuzi.jpg">
        const posterRegex = /<meta\s+name=["']og:image["']\s+content=["']([^'"]*)["']/;
        const match3 = text1.match(posterRegex);

        // console.log(match3);
        const poster = match3 && match3[1] ? match3[1] : "";


        const data2 = await fetcher(`${origin}${path}`, true, "dood", {
            headers: {
                ...headers,
                "X-Requested-With": "XMLHttpRequest"
            }, keepalive: true
        });

        if (!data2) {
            Logger.error("[doodstream] data2 not found!");
            return;
        }

        const { success: success2, status: status2, text: text2 } = data2;

        if (!success2) {
            Logger.error("[doodstream] Fetcher failed, status:", status2);
            return;
        }
        // Bun.write(`./logs/data2/${Date.now()}`, text2);

        const url = `${text2}?token=${token}&expiry=${Date.now()}`;


        const finalData: Omit<ServerSource, "name"> = {
            sources: [{
                url,
                dub: "Original Audio",
                type: "mp4",
                poster,
                thumbnail: vtt,

            }], subtitles: []
        };
        return finalData
    }
    catch (err) {
        Logger.error("[streamtape] Error occured:", err);
    }
}