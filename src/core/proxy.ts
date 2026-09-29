import { SERVER_ORIGIN } from "./config";

export type ProxyKind = "hls" | "mp4" | "segment" | "file";

export type ProxyHeaders = Record<string, string>;

const ENDPOINT: Record<ProxyKind, string> = {
  hls: "m3u8-proxy",
  mp4: "mp4-proxy",
  segment: "ts-segment",
  file: "fetch",
};

export function proxyUrl(url: string, headers?: ProxyHeaders | null, kind?: ProxyKind): string {
  const type = kind ?? (/\.m3u8?(?:[?#]|$)/i.test(url) ? "hls" : "mp4");
  const header =
    headers && Object.keys(headers).length
      ? `&headers=${encodeURIComponent(JSON.stringify(headers))}`
      : "";
  return `${SERVER_ORIGIN}/proxy/${ENDPOINT[type]}?url=${encodeURIComponent(url)}${header}`;
}
