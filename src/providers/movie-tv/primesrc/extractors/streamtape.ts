import { Logger } from "../../../../core/logger";
import { streamtape as origin } from "../../../origins";
import { MEDIA_HEADERS } from "../constants";
import type { Extracted } from "../types";

export async function extractStreamtape(url: string): Promise<Extracted | undefined> {
  const headers = { ...MEDIA_HEADERS, origin, referer: url };
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      Logger.warn(`[streamtape] embed request failed (${res.status})`);
      return;
    }

    const expression =
      (await res.text())
        .match(/getElementById\('botlink'\)\.innerHTML\s*=\s*(.*?);/g)
        ?.at(-1)
        ?.match(/=\s*(.*)/)?.[1] ?? "";
    const [head, tail] = [...expression.matchAll(/(['"])(.*?)\1/g)]
      .map((match) => match[2])
      .filter(Boolean);
    if (!head || !tail) {
      Logger.warn("[streamtape] stream url expression not found");
      return;
    }

    const cut = [...expression.matchAll(/\.substring\((\d+)\)/g)].reduce(
      (total, match) => total + Number(match[1]),
      0,
    );
    const cookie = res.headers
      .getSetCookie()
      .map((entry) => entry.split(";")[0])
      .join("; ");
    const redirect = await fetch(
      `${origin}/get_video${(head + tail.substring(cut)).split("get_video")[1]}&stream=1`,
      { redirect: "manual", headers: { ...headers, cookie } },
    );

    const streamUrl = redirect.headers.get("location");
    if (!streamUrl) {
      Logger.warn(`[streamtape] no stream redirect (${redirect.status})`);
      return;
    }

    return {
      sources: [
        {
          type: streamUrl.includes(".mp4") ? "mp4" : "hls",
          url: streamUrl,
          dub: "Original Audio",
          headers: { origin, referer: `${origin}/` },
        },
      ],
      subtitles: [],
    };
  } catch (error) {
    Logger.error("[streamtape] extraction failed", error);
  }
}
