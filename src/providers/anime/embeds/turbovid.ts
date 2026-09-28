import { request } from "./http";
import type { Extractor } from "./types";

export const turbovid: Extractor = {
  pattern: /^https?:\/\/(?:www\.)?(?:emturbovid|turbovidhls|turboviplay)\.[a-z]+\//i,
  ttl: 12 * 3600,
  async extract(url, referer) {
    const res = await request(url, { headers: { Referer: referer } });
    const stream = (await res.text()).match(/data-hash="(https?:\/\/[^"]+\.m3u8[^"]*)"/)?.[1];
    return stream ? { label: "Turbo", type: "hls", url: stream } : null;
  },
};
