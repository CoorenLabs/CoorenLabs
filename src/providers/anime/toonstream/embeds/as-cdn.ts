import { request, USER_AGENT } from "./http";
import type { Extractor } from "./types";

type Video = { hls?: boolean; videoSource?: string; securedLink?: string; videoImage?: string };

export const asCdn: Extractor = {
  pattern: /^https?:\/\/as-cdn\d*\.[a-z]+\/video\/([^/?#]+)/i,
  ttl: 2 * 3600,
  async extract(url, referer) {
    const hash = url.match(asCdn.pattern)?.[1];
    if (!hash) return null;
    const { origin } = new URL(url);

    const page = await request(url, { method: "HEAD", headers: { Referer: referer } });
    const cookie = page.headers
      .getSetCookie()
      .map((entry) => entry.split(";")[0])
      .join("; ");
    if (!cookie) throw new Error("player session cookie missing");

    const res = await request(`${origin}/player/index.php?data=${hash}&do=getVideo`, {
      method: "POST",
      body: new URLSearchParams({ hash, r: referer }),
      headers: {
        Cookie: cookie,
        Origin: origin,
        Referer: url,
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    const video: Video = await res.json();
    const stream = video.securedLink || video.videoSource;
    if (!stream) return null;

    return {
      label: "Multi Audio",
      type: video.hls ? "hls" : "mp4",
      url: stream,
      thumbnail: video.videoImage,
      headers: { Cookie: cookie, "User-Agent": USER_AGENT, Referer: `${origin}/` },
    };
  },
};
