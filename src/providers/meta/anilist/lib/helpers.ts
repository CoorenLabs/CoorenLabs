// ─── Shared formatting helpers ────────────────────────────────────────────────
// Ported from anime-stream-link/server.js

export function formatStatus(status: string | undefined | null): string {
  if (status === "FINISHED") return "Completed";
  if (!status) return "Unknown";
  return status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
}

export function formatAiringInfo(media: any): { timeLeft: string; episodeCount: string } {
  let timeLeft = "";
  let episodeCount: string = media.episodes?.toString() || "NA";

  if (media.nextAiringEpisode) {
    const seconds: number = media.nextAiringEpisode.timeUntilAiring;
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    timeLeft = `${days}d ${hours}h`;
    episodeCount = media.nextAiringEpisode.episode?.toString();
  }

  return { timeLeft, episodeCount };
}

export function extractAniZipImages(
  aniZipData: any,
  customOverride?: any,
): { banner: string; logo: string } {
  let banner: string = customOverride?.banner_image || "";
  let logo: string = customOverride?.clear_logo || "";

  if (banner && logo) return { banner, logo };

  const images: any[] = aniZipData?.images || [];
  for (const img of images) {
    if (img.coverType === "Fanart" && !banner) banner = img.url;
    if (img.coverType === "Clearlogo" && !logo) logo = img.url;
    if (banner && logo) break;
  }

  return { banner, logo };
}

export function getSeason(): string {
  const month = new Date().getMonth();
  if (month >= 0 && month <= 2) return "WINTER";
  if (month >= 3 && month <= 5) return "SPRING";
  if (month >= 6 && month <= 8) return "SUMMER";
  return "FALL";
}

// ─── Fetch with retry + timeout ───────────────────────────────────────────────

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  timeoutMs = 10_000,
): Promise<Response> {
  let lastError: unknown;

  for (let i = 0; i < retries; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        ...options,
        signal: options.signal || controller.signal,
      });
      clearTimeout(timer);

      if (res.status === 429) {
        console.warn(`[anilist-meta] Rate limited, retrying… (${i + 1}/${retries})`);
        const retryAfter = res.headers.get("Retry-After");
        const delayMs = retryAfter && !isNaN(parseInt(retryAfter, 10)) 
          ? parseInt(retryAfter, 10) * 1000 
          : 1000 * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      return res;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      console.warn(`[anilist-meta] Fetch failed (${i + 1}/${retries}):`, (err as Error).message);
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
  }

  throw lastError ?? new Error("Failed to fetch after multiple retries");
}
