import { Logger } from "../../../../core/logger";
import { streamtape as origin } from "../../../origins";
import type { Source } from "../types";

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
export const extractStreamtape = async (url: string) => {
    headers["referer"] = url;

    try {
        const res = await fetch(url, { headers });

        if (!res.ok) {
            Logger.error("[streamtape] fetch failed status:", res.status);
            return;
        }

        const html = await res.text();
        // Bun.write(`./logs/${Date.now()}`, html);

        const botlinkRegex = /getElementById\('botlink'\)\.innerHTML\s*=\s*(.*?);/g;
        const matches = html.match(botlinkRegex);

        if (!matches) {
            return;
        }

        const targetLine = matches[matches?.length - 1];
        const expressionMatch = targetLine?.match(/=\s*(.*)/);
        const expression = expressionMatch ? expressionMatch[1] : "";

        if (!expression) {
            Logger.error("[streamtape] regexp failed to extract stream url");
            return;
        }

        const strings = [...expression.matchAll(/(['"])(.*?)\1/g)].map(match => match[2]).filter(Boolean);
        const cut = [...expression.matchAll(/\.substring\((\d+)\)/g)].reduce((prev, match) => prev + (match ? +match[1]! : 0), 0);

        if (!(strings[0] && strings[1])) {
            Logger.error("[streamtape] regexp failed to extract stream url");
            return;
        }

        const url2 = `${origin}/get_video` + (strings[0] + strings[1].substring(cut)).split("get_video")[1] + "&stream=1";
        Logger.info("[streamtape] got url:",url2)

        const cookie = res.headers.getSetCookie().map(e => e.split(";")[0]).join("; ");
        headers["cookie"] = cookie;
        // console.log(headers);

        const res2 = await fetch(url2, { redirect: "manual", headers });

        if (!res2.ok && res2.status !== 302) {
            Logger.error("[streamtape] fetch failed while fetching stream file, status:", res2.status);
            return;
        }

        const streamUrl = res2.headers.get('location');

        if (streamUrl) {
            Logger.success("[streamtape] successfully got streamtape source");
            const source: Source = {
                type: streamUrl.includes(".mp4") ? "mp4" : "hls",
                url: streamUrl,
                quality: 1080, // unsure but seems like it
                dub: "Original Audio",
                headers: { // use `headers` if not working
                    origin: origin,
                    referer: origin + "/"
                }
            }

            return { sources: [source], subtitles: [] };
        }

    } catch (err) {
        Logger.error("[streamtape] Error occured:", err);
    }
}