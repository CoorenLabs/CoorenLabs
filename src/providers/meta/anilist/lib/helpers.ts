import { Logger } from "../../../../core/logger";

const ANILIST_URL = "https://graphql.anilist.co";
const ANIZIP_URL = "https://api.ani.zip/mappings";
const ANIZIP_TIMEOUT_MS = 5_000;
const RETRY_DELAY_MS = 500;

export class AniListError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 2,
  timeoutMs = 10_000,
): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        signal: options.signal ?? AbortSignal.timeout(timeoutMs),
      });
      if (res.status < 500 || attempt >= retries) return res;
      void res.body?.cancel();
    } catch (err) {
      if (attempt >= retries) throw err;
      Logger.warn(
        `[anilist-meta] ${url} failed (${attempt}/${retries}): ${(err as Error).message}`,
      );
    }
    await sleep(RETRY_DELAY_MS * attempt);
  }
}

export async function queryAniList(
  query: string,
  variables: Record<string, unknown>,
): Promise<any> {
  const res = await fetchWithRetry(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  }).catch(() => {
    throw new AniListError("Failed to reach AniList", 502);
  });
  const body = await res.json().catch(() => null);
  const error = body?.errors?.[0];
  if (res.ok && body?.data && !error) return body.data;
  const status = res.status === 429 ? 429 : Number(error?.status) || res.status;
  throw new AniListError(
    error?.message || `AniList responded with HTTP ${res.status}`,
    status >= 400 && status < 500 ? status : 502,
  );
}

export function fetchAniZip(anilistId: number): Promise<any> {
  return fetchWithRetry(`${ANIZIP_URL}?anilist_id=${anilistId}`, {}, 1, ANIZIP_TIMEOUT_MS)
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => null);
}

export function extractAniZipImages(aniZipData: any) {
  let banner = "";
  let logo = "";
  for (const image of aniZipData?.images ?? []) {
    if (!banner && image.coverType === "Fanart") banner = image.url;
    if (!logo && image.coverType === "Clearlogo") logo = image.url;
  }
  return { banner, logo };
}

export function presentMedia(media: any, aniZip?: any) {
  const { banner, logo } = extractAniZipImages(aniZip);
  return {
    title: media.title?.english || media.title?.romaji || "",
    poster: media.coverImage?.extraLarge || "",
    banner: banner || media.bannerImage || media.coverImage?.extraLarge || "",
    logo,
  };
}

export function descriptionOf(media: any): string {
  return media.description?.replace(/<[^>]*>?/gm, "") || "";
}

export function formatSeason(media: any): string {
  if (!media.season || !media.seasonYear) return "Unknown";
  return `${media.season.charAt(0)}${media.season.slice(1).toLowerCase()} ${media.seasonYear}`;
}

export function formatStatus(status: string | undefined | null): string {
  if (status === "FINISHED") return "Completed";
  if (!status) return "Unknown";
  return status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
}

export function formatAiringInfo(media: any): { timeLeft: string; episodeCount: string } {
  const next = media.nextAiringEpisode;
  if (!next) return { timeLeft: "", episodeCount: media.episodes?.toString() || "NA" };
  const days = Math.floor(next.timeUntilAiring / 86_400);
  const hours = Math.floor((next.timeUntilAiring % 86_400) / 3600);
  return { timeLeft: `${days}d ${hours}h`, episodeCount: next.episode?.toString() };
}

export function getSeason(): string {
  const month = new Date().getMonth();
  if (month <= 2) return "WINTER";
  if (month <= 5) return "SPRING";
  if (month <= 8) return "SUMMER";
  return "FALL";
}
