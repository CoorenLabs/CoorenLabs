import { request } from "./http";
import type { DirectSource, Extractor } from "./types";

const PACKER = "eval(function(p,a,c,k,e,d)";
const PACKED_ARGS = /}\('(.+)',(\d+),\d+,'(.*?)'\.split\('\|'\)/s;
const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function unpack(html: string): string | null {
  const start = html.indexOf(PACKER);
  if (start === -1) return null;
  const end = html.indexOf("</script>", start);
  const match = html.slice(start, end === -1 ? undefined : end).match(PACKED_ARGS);
  if (!match) return null;

  const [, payload, radix, words] = match;
  const base = Number(radix);
  const dictionary = words.split("|");
  return payload.replace(/\\(['\\])/g, "$1").replace(/\b\w+\b/g, (word) => {
    let index = 0;
    for (const char of word) {
      const digit = DIGITS.indexOf(char);
      if (digit === -1 || digit >= base) return word;
      index = index * base + digit;
    }
    return dictionary[index] || word;
  });
}

function parse(script: string, origin: string): DirectSource | null {
  const stream = script.match(/file\s*:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/)?.[1];
  if (!stream) return null;

  let thumbnail: string | undefined;
  let subtitles: DirectSource["subtitles"];
  for (const [track] of script.matchAll(/\{[^{}]*\}/g)) {
    const kind = track.match(/kind\s*:\s*["']([^"']+)["']/)?.[1];
    const file = track.match(/file\s*:\s*["']([^"']+)["']/)?.[1];
    if (!kind || !file) continue;
    if (kind === "thumbnails") thumbnail ??= file;
    if (kind !== "captions") continue;
    const label = track.match(/label\s*:\s*["']([^"']+)["']/)?.[1] ?? "Unknown";
    if (!subtitles || /eng/i.test(label)) subtitles = { label, url: file };
  }

  return {
    label: "Ruby",
    type: "hls",
    url: stream,
    cover: script.match(/image\s*:\s*["'](https?:\/\/[^"']+)["']/)?.[1],
    thumbnail,
    subtitles,
    headers: { Origin: origin, Referer: `${origin}/` },
  };
}

export const rubystm: Extractor = {
  pattern: /^https?:\/\/(?:www\.)?(?:rubystm|rubystream|streamruby)\.[a-z]+\//i,
  ttl: 8 * 3600,
  async extract(url, referer) {
    const { origin, pathname } = new URL(url);
    const code = pathname
      .split("/")
      .filter(Boolean)
      .pop()
      ?.replace(/^embed-|\.html$/g, "");
    if (!code) return null;

    const res = await request(`${origin}/dl`, {
      method: "POST",
      body: new URLSearchParams({ op: "embed", file_code: code, auto: "1", referer }),
      headers: { Referer: url },
    });
    const script = unpack(await res.text());
    return script ? parse(script, origin) : null;
  },
};
