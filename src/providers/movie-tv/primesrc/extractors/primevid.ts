import { createDecipheriv } from "node:crypto";
import { languageName } from "../../../../core/helper";
import { Logger } from "../../../../core/logger";
import { primesrc, primevid as baseUrl } from "../../../origins";
import { BROWSER_HEADERS } from "../constants";
import type { Caption, Extracted, Source } from "../types";

const KEY = Buffer.from("a2llbXRpZW5tdWE5MTFjYQ==", "base64");
const IV = Buffer.from("MTIzNDU2Nzg5MG9pdXl0cg==", "base64");
const HOST = new URL(primesrc).hostname;
const STREAM_HEADERS = { Referer: `${baseUrl}/` };

function decrypt(payload: string) {
  const decipher = createDecipheriv("aes-128-cbc", KEY, IV);
  const cipher = Buffer.from(payload.replace(/[^a-f0-9]/gi, ""), "hex");
  return decipher.update(cipher, undefined, "utf8") + decipher.final("utf8");
}

export async function extractPrimevid(url: string): Promise<Extracted | undefined> {
  const id = url.split("#")[1];
  if (!id) {
    Logger.warn("[primevid] no video id in", url);
    return;
  }

  try {
    const res = await fetch(`${baseUrl}/api/v1/video?id=${id}&w=1920&h=1080&r=${HOST}`, {
      headers: {
        ...BROWSER_HEADERS,
        "sec-fetch-storage-access": "active",
        Referer: `https://${HOST}/`,
      },
    });
    if (!res.ok) {
      Logger.warn(`[primevid] video request failed (${res.status})`);
      return;
    }

    const { cf, source, poster, thumbnail, subtitle, streamingConfig } = JSON.parse(
      decrypt(await res.text()),
    );
    const params = JSON.parse(streamingConfig || "{}")?.adjust?.Cloudflare?.params ?? {};

    const sources: Source[] = [cf && `${cf}?e=${params.e || ""}&t=${params.t || ""}`, source]
      .filter(Boolean)
      .map((streamUrl: string) => ({
        type: "hls",
        url: streamUrl,
        dub: "Original Audio",
        poster,
        thumbnail,
        headers: STREAM_HEADERS,
      }));
    const subtitles: Caption[] = Object.entries(subtitle ?? {}).map(([langCode, path]) => ({
      label: languageName(langCode),
      langCode,
      url: baseUrl + path,
      delay: 0,
    }));

    return { sources, subtitles };
  } catch (error) {
    Logger.error("[primevid] extraction failed", error);
  }
}
