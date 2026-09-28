import { Cache } from "../../../core/cache";
import { Logger } from "../../../core/logger";
import { proxyUrl } from "../../../core/proxy";
import { asCdn } from "./as-cdn";
import { rubystm } from "./rubystm";
import { turbovid } from "./turbovid";
import type { DirectSource } from "./types";

const extractors = [asCdn, rubystm, turbovid];

export async function extractSource(url: string, referer: string): Promise<DirectSource | null> {
  const extractor = extractors.find(({ pattern }) => pattern.test(url));
  if (!extractor) return null;
  try {
    const { data } = await Cache.remember(`embeds:${url}`, extractor.ttl, () =>
      extractor.extract(url, referer),
    );
    if (!data) Logger.debug(`[embeds] No stream found in ${url}`);
    return data && { ...data, proxiedUrl: proxyUrl(data.url, data.headers, data.type) };
  } catch (err) {
    Logger.warn(`[embeds] ${url}: ${(err as Error).message}`);
    return null;
  }
}

export async function extractSources(urls: string[], referer: string) {
  const sources = await Promise.all(urls.map((url) => extractSource(url, referer)));
  return sources.filter((source) => source !== null);
}
