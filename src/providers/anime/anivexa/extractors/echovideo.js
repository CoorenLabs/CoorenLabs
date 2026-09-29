import { fetchJson, request, UA } from "../core/http.js";

const EMBED = /play\.echovideo\.ru\/(embed-(?:0|1|20))\/([^/?#]+)/i;

function mediaType(url) {
  return /\.mp4(?:$|[?#])/i.test(url) ? "mp4" : "hls";
}

export function canExtractEchoVideo(url) {
  return EMBED.test(String(url));
}

export async function extractEchoVideo(embedUrl, { userAgent = UA } = {}) {
  const url = new URL(String(embedUrl));
  const [, type, id] = String(embedUrl).match(EMBED) ?? [];
  if (!id) throw new Error(`Cannot extract EchoVideo id from ${embedUrl}`);
  const endpoint = new URL(`/${type}/getSources`, url.origin);
  endpoint.searchParams.set("id", id);
  const data = await fetchJson(endpoint, {
    label: "EchoVideo",
    headers: { "User-Agent": userAgent, Referer: url.href, "X-Requested-With": "XMLHttpRequest" },
  });
  const referer = `${url.origin}/`;
  if (type !== "embed-20") {
    const list = Array.isArray(data?.sources) ? data.sources : [data?.sources];
    const sources = list
      .map((item) => (typeof item === "string" ? item : (item?.file ?? item?.url)))
      .filter((source) => typeof source === "string" && source)
      .map((source) => ({ url: source, type: mediaType(source), referer }));
    if (!sources.length) throw new Error("EchoVideo response has no sources");
    return sources;
  }
  const candidates = Object.entries(data?.sources ?? {}).flatMap(([quality, urls]) =>
    (Array.isArray(urls) ? urls : [urls])
      .filter((source) => typeof source === "string" && source)
      .map((source) => ({ url: source, type: "mp4", quality, referer })),
  );
  const available = await Promise.all(
    candidates.map((source) =>
      request(source.url, {
        method: "HEAD",
        headers: { "User-Agent": userAgent, Referer: referer },
      })
        .then((response) => (response.ok ? source : null))
        .catch(() => null),
    ),
  );
  const sources = available.filter(Boolean);
  if (!sources.length) throw new Error("EchoVideo response has no available sources");
  return sources;
}
