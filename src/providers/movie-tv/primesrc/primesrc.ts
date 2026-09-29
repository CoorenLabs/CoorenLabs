import { Cache } from "../../../core/cache";
import { fetcher } from "../../../core/lib/fetcher";
import { Logger } from "../../../core/logger";
import { proxyUrl } from "../../../core/proxy";
import { primesrc as origin } from "../../origins";
import { BROWSER_HEADERS } from "./constants";
import { extractDoodstream } from "./extractors/doodstream";
import { extractPrimevid } from "./extractors/primevid";
import { extractStreamtape } from "./extractors/streamtape";
import type { Extracted, Result, ServerSource, Source } from "./types";

const LINK_INTERVAL = 1200;
const FOUND_TTL = 3 * 3600;
const MISSING_TTL = 10 * 60;
const CHALLENGE = /challenge-platform|<title>just a moment/i;

type Server = {
  name: string;
  key: string;
  quality?: number | string | null;
  file_name?: string | null;
  file_size?: string | null;
};

const EXTRACTORS: Record<string, (url: string) => Promise<Extracted | undefined>> = {
  PrimeVid: extractPrimevid,
  Streamtape: extractStreamtape,
  Dood: extractDoodstream,
};

const SIZE_UNITS: Record<string, number> = { KB: 2 ** 10, MB: 2 ** 20, GB: 2 ** 30, TB: 2 ** 40 };

function describe(source: Source, server: Server): Source {
  const size = server.file_size?.match(/([\d.]+)\s*([KMGT]B)/i);
  return {
    ...source,
    quality:
      source.quality ??
      (Number(server.quality) || Number(server.file_name?.match(/(\d{3,4})p/i)?.[1]) || undefined),
    sizeBytes:
      source.sizeBytes ??
      (size ? Math.round(parseFloat(size[1]) * SIZE_UNITS[size[2].toUpperCase()]) : undefined),
    ...(source.headers && { proxiedUrl: proxyUrl(source.url, source.headers, source.type) }),
  };
}

function linkOf(text: string): string | undefined {
  try {
    return JSON.parse(text).link;
  } catch {
    return undefined;
  }
}

async function extract(server: Server, link: string): Promise<ServerSource | undefined> {
  const result = await EXTRACTORS[server.name](link).catch(() => undefined);
  if (!result?.sources.length) return;
  return {
    name: server.name,
    sources: result.sources.map((source) => describe(source, server)),
    subtitles: result.subtitles,
  };
}

async function getSources(type: "movie" | "tv", query: string) {
  const headers = {
    ...BROWSER_HEADERS,
    "cache-control": "no-cache",
    pragma: "no-cache",
    origin,
    referer: `${origin}/embed/${type}?${query}`,
  };

  try {
    const res = await fetch(`${origin}/api/v1/s?${query}&type=${type}`, { headers });
    if (!res.ok) {
      Logger.warn(`[primesrc] servers request failed (${res.status})`);
      return;
    }
    const { servers } = (await res.json()) as { servers?: Server[] };

    const jobs: Promise<ServerSource | undefined>[] = [];
    const supported = (servers ?? []).filter((server) => EXTRACTORS[server.name]);
    for (const [index, server] of supported.entries()) {
      if (index) await new Promise((resolve) => setTimeout(resolve, LINK_INTERVAL));
      const res = await fetcher(`${origin}/api/v1/l?key=${server.key}`, true, "primesrc", {
        headers,
      });
      if (res?.status === 403 && CHALLENGE.test(res.text)) {
        Logger.warn("[primesrc] link endpoint is challenged, skipping remaining servers");
        break;
      }

      const link = res?.success ? linkOf(res.text) : undefined;
      if (!link) {
        Logger.warn(`[primesrc] no link for ${server.name} (${res?.status ?? "network error"})`);
        continue;
      }
      jobs.push(extract(server, link));
    }
    return (await Promise.all(jobs)).filter((source) => source !== undefined);
  } catch (error) {
    Logger.error("[primesrc] failed to load sources", error);
  }
}

async function cached(
  key: string,
  load: () => Promise<ServerSource[] | undefined>,
): Promise<Result<ServerSource[]>> {
  const hit = await Cache.getJson<ServerSource[]>(key);
  const data = hit ?? (await load()) ?? [];
  if (!hit) void Cache.setJson(key, data, data.length ? FOUND_TTL : MISSING_TTL);
  return data.length ? { success: true, status: 200, data } : { success: false, status: 404 };
}

export class Primesrc {
  static getMovieSource(tmdbId: number) {
    return cached(`primesrc:movie:${tmdbId}`, () => getSources("movie", `tmdb=${tmdbId}`));
  }

  static getTvSource(tmdbId: number, season: number, episode: number) {
    return cached(`primesrc:tv:${tmdbId}:${season}:${episode}`, () =>
      getSources("tv", `tmdb=${tmdbId}&season=${season}&episode=${episode}`),
    );
  }
}
