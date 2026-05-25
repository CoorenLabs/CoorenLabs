export { animelok as ANIMELOK_BASE } from "../../../origins";

export const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.6",
  "sec-ch-ua": '"Chromium";v="148", "Google Chrome";v="148", "Not:A-Brand";v="99"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
};

export const QUALITY_ORDER = ["Multi", "1080p", "720p", "480p", "360p", "unknown"];

// Cache TTLs
export const EPISODES_CACHE_TTL = 3600 * 6; // 6hr
export const STREAM_CACHE_TTL = 3600 * 2; // 2hr
