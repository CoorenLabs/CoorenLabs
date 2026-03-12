import { createDecipheriv } from "node:crypto";
import { languageDictionary } from "../../../../core/helper";
import { Logger } from "../../../../core/logger";
import { USER_AGENT } from "../../../anime/animepahe/scraper";
import { primevid as baseUrl, primesrc as primesrcOriginUrl } from "../../../origins";
import type { Caption, Source } from "../types";

const algorithm = "aes-128-cbc";
const key64 = "a2llbXRpZW5tdWE5MTFjYQ==";
const iv64 = "MTIzNDU2Nzg5MG9pdXl0cg==";

const corsHeaders: Record<string, string> = {
    "Referer": `${baseUrl}/`,
}

const primesrc_origin = new URL(primesrcOriginUrl).hostname;


/**
 * Get Direct source from primevid embed url.
 * @param url primevid embed url
 */
export const extractPrimevid = async (url: string) => {
    const id = url.split('#')[1];
    if (!id) {
        Logger.error("[Primevid] id not found from url:", url);
        return;
    }

    try {
        // const res = await fetch(`${baseUrl}/api/v1/info?id=${id}`);
        const res = await fetch(`${baseUrl}/api/v1/video?id=${id}&w=1920&h=1080&r=${primesrc_origin}`, {
            "headers": {
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.9",
                "priority": "u=1, i",
                "sec-ch-ua": "\"Google Chrome\";v=\"143\", \"Chromium\";v=\"143\", \"Not A(Brand\";v=\"24\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "sec-fetch-storage-access": "active",
                "Referer": `https://${primesrc_origin}/`,

                // required
                "user-agent": USER_AGENT
            }
        }
        );

        if (!res.ok) {
            Logger.error("[Primevid] fetch failed, status code:", res.status);
            console.log(await res.text())
            return;
        }

        const rawText = await res.text();

        // stips characters other than hex 
        const cipherBuffer = Buffer.from(rawText.replace(/[^a-f0-9]/gi, ''), "hex")

        const { cf: cfSource, source: fallbackSource, poster, thumbnail, subtitle: subs, streamingConfig } = JSON.parse(decryptCipher(cipherBuffer) || "");

        const { adjust: { Cloudflare: { params: { t, e } } } } = JSON.parse(streamingConfig);

        const subtitles: Caption[] = []
        const sources: Source[] = []

        for (const [langCode, path] of Object.entries(subs)) {
            subtitles.push({
                label: languageDictionary[langCode] || langCode,
                langCode,
                url: baseUrl + path,
                delay: 0
            })
        }

        if (cfSource && cfSource.length > 0) {
            sources.push({
                type: "hls",
                url: cfSource + `?e=${e || ""}&t=${t || ""}`,
                dub: "Original Audio",
                poster,
                thumbnail,
                headers: corsHeaders
            })
        }

        if (fallbackSource && fallbackSource.length > 0) {
            sources.push({
                type: "hls",
                url: fallbackSource,
                dub: "Original Audio",
                poster,
                thumbnail,
                headers: corsHeaders
            })
        }

        return { sources, subtitles };

    } catch (err) {
        Logger.error("[Primevid] error occured while fetching", err);
    }
}


const decryptCipher = (cipherBuffer: Buffer) => {
    try {
        Logger.info("[primevid] Cipher length:", cipherBuffer.length)
        Logger.info("[primevid] Decrypting")

        const keyBuffer = Buffer.from(key64, "base64");
        const ivBuffer = Buffer.from(iv64, "base64");

        const decipher = createDecipheriv(algorithm, keyBuffer, ivBuffer);

        let data = decipher.update(cipherBuffer, undefined, "utf8");
        data += decipher.final("utf8");

        // Logger.info(JSON.parse(data));

        return data;
    } catch (err) {
        Logger.error("[primevid] error occured while decrypting cipher:", err);
    }
}