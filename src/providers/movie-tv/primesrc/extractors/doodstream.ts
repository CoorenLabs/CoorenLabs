import { fetcher } from "../../../../core/lib/fetcher";
import { Logger } from "../../../../core/logger";
import { doodstream as origin } from "../../../origins";
import { MEDIA_HEADERS } from "../constants";
import type { Extracted } from "../types";

export async function extractDoodstream(url: string): Promise<Extracted | undefined> {
  const id = url.split("/").pop();
  if (!id) {
    Logger.warn("[doodstream] no video id in", url);
    return;
  }

  const headers = { ...MEDIA_HEADERS, origin, referer: url };
  try {
    const page = await fetcher(`${origin}/e/${id}`, true, "doodstream", { headers });
    if (!page?.success) {
      Logger.warn(`[doodstream] embed request failed (${page?.status ?? "network error"})`);
      return;
    }

    if (/has been removed|temporarily unavailable/i.test(page.text)) {
      Logger.debug(`[doodstream] ${id} is no longer available`);
      return;
    }

    const path = page.text.match(/\/pass_md5\/[^'"]*/)?.[0];
    const token = page.text.match(/\?token=([^&]*)&/)?.[1];
    if (!path || !token) {
      Logger.warn("[doodstream] pass_md5 path or token not found");
      return;
    }

    const pass = await fetcher(`${origin}${path}`, true, "doodstream", {
      headers: { ...headers, "X-Requested-With": "XMLHttpRequest" },
    });
    if (!pass?.success) {
      Logger.warn(`[doodstream] pass_md5 request failed (${pass?.status ?? "network error"})`);
      return;
    }

    return {
      sources: [
        {
          url: `${pass.text}?token=${token}&expiry=${Date.now()}`,
          dub: "Original Audio",
          type: "mp4",
          poster:
            page.text.match(/<meta\s+name=["']og:image["']\s+content=["']([^'"]*)["']/)?.[1] ?? "",
          thumbnail: page.text.match(/vtt:\s*['"]([^'"]*)/)?.[1] ?? "",
          headers: { Referer: `${origin}/` },
        },
      ],
      subtitles: [],
    };
  } catch (error) {
    Logger.error("[doodstream] extraction failed", error);
  }
}
