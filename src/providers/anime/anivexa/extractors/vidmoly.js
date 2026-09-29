import { request, UA } from "../core/http.js";

export function canExtractVidmoly(url) {
  return /vidmoly\.(?:net|biz|to)/i.test(String(url));
}

export async function extractVidmoly(embedUrl, { userAgent = UA, referer } = {}) {
  const url = String(embedUrl).startsWith("//") ? `https:${embedUrl}` : String(embedUrl);
  const response = await request(url, {
    headers: { "User-Agent": userAgent, Referer: referer ?? "https://animenosub.to/" },
  });
  if (!response.ok) throw new Error(`Vidmoly HTTP ${response.status}`);
  const match = (await response.text()).match(
    /sources:\s*\[\s*\{\s*file:\s*['"]([^'"]+\.m3u8[^'"]*)['"]/,
  );
  if (!match) throw new Error("Vidmoly m3u8 not found in embed HTML");
  return [{ url: match[1], type: "hls", referer: `${new URL(response.url || url).origin}/` }];
}
