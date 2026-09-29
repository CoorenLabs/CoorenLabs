import { Cache } from "../../../../core/cache";
import { Logger } from "../../../../core/logger";
import { proxyUrl } from "../../../../core/proxy";
import { asCdn } from "./as-cdn";
import { rubystm } from "./rubystm";
import { turbovid } from "./turbovid";
import type { DirectSource } from "./types";

const extractors = [asCdn, rubystm, turbovid];
const HOST_COOLDOWN = 5 * 60_000;
const unavailable = new Map<string, number>();

async function extractSource(url: string, referer: string): Promise<DirectSource | null> {
  const extractor = extractors.find(({ pattern }) => pattern.test(url));
  if (!extractor) return null;
  const { host } = new URL(url);
  if ((unavailable.get(host) ?? 0) > Date.now()) return null;
  try {
    const { data } = await Cache.remember(`embeds:${url}`, extractor.ttl, () =>
      extractor.extract(url, referer),
    );
    if (!data) Logger.debug(`[embeds] No stream found in ${url}`);
    return data && { ...data, proxiedUrl: proxyUrl(data.url, data.headers, data.type) };
  } catch (err) {
    const message = (err as Error).message.replace(/ from https?:\/\/\S+/, "").replace(/\.$/, "");
    const hostDown = /HTTP 5\d\d|timed out|Unable to connect|fetch failed/i.test(message);
    if (hostDown) unavailable.set(host, Date.now() + HOST_COOLDOWN);
    Logger.warn(`[embeds] ${host}: ${message}${hostDown ? "; skipping it for 5 minutes" : ""}`);
    return null;
  }
}

export async function extractSources(urls: string[], referer: string) {
  const sources = await Promise.all(urls.map((url) => extractSource(url, referer)));
  return sources.filter((source) => source !== null);
}
