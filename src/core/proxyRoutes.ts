import { lookup } from "node:dns/promises";
import { Elysia, t } from "elysia";
import { Logger } from "./logger";
import { type ProxyHeaders, type ProxyKind, proxyUrl } from "./proxy";

const MiB = 1024 * 1024;

const LIMIT: Record<ProxyKind, number> = {
  hls: 5 * MiB,
  segment: 50 * MiB,
  file: 50 * MiB,
  mp4: 20 * 1024 * MiB,
};

const FALLBACK_TYPE: Record<ProxyKind, string> = {
  hls: "application/vnd.apple.mpegurl",
  segment: "video/mp2t",
  file: "application/octet-stream",
  mp4: "video/mp4",
};

const PLAYLIST_TAG = /^#EXT-X-(?:MEDIA|I-FRAME-STREAM-INF|RENDITION-REPORT)\b/;

const query = t.Object({ url: t.String(), headers: t.Optional(t.String()) });

type Upstream = {
  ok: boolean;
  status: number;
  url: string;
  headers: { get(name: string): string | null; has(name: string): boolean };
  body: ReadableStream<Uint8Array> | null;
  text(): Promise<string>;
};

type RequestOptions = { headers: Headers; signal: AbortSignal; redirect: "manual" };

class ForbiddenTarget extends Error {}

const MAX_REDIRECTS = 5;
const HOST_CHECK_TTL = 60_000;
const hostChecks = new Map<string, { allowed: boolean; expires: number }>();
const impersonatedHosts = new Set<string>();

function isPrivateAddress(address: string): boolean {
  const value = address.toLowerCase();
  if (value.includes(":")) return value.startsWith("::") || /^(?:f[cd]|fe[89ab])/.test(value);
  const [a, b] = value.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

async function isAllowed(target: URL): Promise<boolean> {
  if (target.protocol !== "http:" && target.protocol !== "https:") return false;
  const host = target.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) return false;
  if (/^[\d.]+$/.test(host) || host.includes(":")) return !isPrivateAddress(host);

  const cached = hostChecks.get(host);
  if (cached && cached.expires > Date.now()) return cached.allowed;
  const addresses = await lookup(host, { all: true }).catch(() => []);
  const allowed = !addresses.some(({ address }) => isPrivateAddress(address));
  if (hostChecks.size > 1000) hostChecks.clear();
  hostChecks.set(host, { allowed, expires: Date.now() + HOST_CHECK_TTL });
  return allowed;
}

async function impersonate(url: string, init: RequestOptions): Promise<Upstream | null> {
  try {
    const { fetch: browserFetch } = await import("wreq-js");
    const res = await browserFetch(url, { ...init, headers: Object.fromEntries(init.headers) });
    return res as unknown as Upstream;
  } catch (err) {
    if (init.signal.aborted) throw err;
    Logger.debug(`[Proxy] Impersonated request failed for ${url}: ${(err as Error).message}`);
    return null;
  }
}

async function send(url: URL, init: RequestOptions): Promise<Upstream> {
  if (impersonatedHosts.has(url.host)) {
    return (await impersonate(url.href, init)) ?? fetch(url, init);
  }
  const res = await fetch(url, init);
  if (res.status !== 403) return res;

  const retry = await impersonate(url.href, init);
  if (!retry?.ok) {
    void retry?.body?.cancel();
    return res;
  }
  void res.body?.cancel();
  impersonatedHosts.add(url.host);
  return retry;
}

async function upstream(target: URL, headers: Headers, signal: AbortSignal): Promise<Upstream> {
  for (let hop = 0; ; hop++) {
    if (!(await isAllowed(target))) throw new ForbiddenTarget(target.href);
    const res = await send(target, { headers, signal, redirect: "manual" });
    const location = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
    if (!location || hop === MAX_REDIRECTS) return res;
    void res.body?.cancel();
    target = new URL(location, target);
  }
}

function parseHeaders(raw: string | undefined): ProxyHeaders | null {
  if (!raw) return {};
  for (const read of [() => raw, () => decodeURIComponent(raw)]) {
    try {
      const value = JSON.parse(read());
      if (value && typeof value === "object" && !Array.isArray(value)) return value;
    } catch {
      continue;
    }
  }
  return null;
}

function absolute(uri: string, base: string): string | null {
  try {
    const url = new URL(uri, base);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function rewritePlaylist(playlist: string, base: string, headers: ProxyHeaders): string {
  const master = playlist.includes("#EXT-X-STREAM-INF");
  const wrap = (uri: string, kind: ProxyKind) => {
    const href = absolute(uri, base);
    return href ? proxyUrl(href, headers, kind) : uri;
  };

  return playlist
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      if (trimmed.startsWith("#")) {
        const kind = PLAYLIST_TAG.test(trimmed) ? "hls" : "file";
        return trimmed.replace(/URI="([^"]+)"/g, (_, uri: string) => `URI="${wrap(uri, kind)}"`);
      }
      return wrap(trimmed, master ? "hls" : "segment");
    })
    .join("\n");
}

async function forward(
  request: Request,
  url: string,
  rawHeaders: string | undefined,
  kind: ProxyKind,
): Promise<Response> {
  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  const headers = parseHeaders(rawHeaders);
  if (!headers) return new Response("Invalid headers format", { status: 400 });

  let upstreamHeaders: Headers;
  try {
    upstreamHeaders = new Headers(headers);
  } catch {
    return new Response("Invalid headers format", { status: 400 });
  }

  const range = kind === "hls" ? null : request.headers.get("range");
  if (range) upstreamHeaders.set("range", range);

  let res: Upstream;
  try {
    res = await upstream(target, upstreamHeaders, request.signal);
  } catch (err) {
    if (err instanceof ForbiddenTarget) return new Response("Forbidden url", { status: 403 });
    if (request.signal.aborted) return new Response("Client disconnected", { status: 499 });
    Logger.warn(`[Proxy] ${url}: ${(err as Error).message}`);
    return new Response("Upstream request failed", { status: 502 });
  }

  if (!res.ok) return new Response(res.body, { status: res.status });

  if (Number(res.headers.get("content-length")) > LIMIT[kind]) {
    void res.body?.cancel();
    return new Response("Payload too large", { status: 413 });
  }

  if (kind === "hls") {
    const playlist = rewritePlaylist(await res.text(), res.url || url, headers);
    return new Response(playlist, { headers: { "content-type": FALLBACK_TYPE.hls } });
  }

  const type = res.headers.get("content-type");
  const disguised = kind === "segment" && /^(?:text\/html|image\/)/i.test(type ?? "");
  const out = new Headers({
    "content-type": type && !disguised ? type : FALLBACK_TYPE[kind],
  });
  if (!res.headers.has("content-encoding")) {
    for (const name of ["content-length", "content-range", "accept-ranges"]) {
      const value = res.headers.get(name);
      if (value) out.set(name, value);
    }
  }
  if (kind === "mp4") out.set("accept-ranges", "bytes");
  if (kind === "segment") out.set("cache-control", "public, max-age=86400");

  return new Response(res.body, { status: res.status, headers: out });
}

export const proxyRoutes = new Elysia({ prefix: "/proxy" })
  .get(
    "/",
    () => ({
      endpoints: [
        "/proxy/m3u8-proxy?url={url}&headers={encodedHeaders}",
        "/proxy/ts-segment?url={url}&headers={encodedHeaders}",
        "/proxy/mp4-proxy?url={url}&headers={encodedHeaders}",
        "/proxy/fetch?url={url}&headers={encodedHeaders}",
      ],
    }),
    { detail: { tags: ["proxy"], summary: "Proxy API Overview" } },
  )
  .get("/m3u8-proxy", ({ request, query }) => forward(request, query.url, query.headers, "hls"), {
    query,
    detail: { tags: ["proxy"], summary: "M3U8 Playlist Proxy" },
  })
  .get(
    "/ts-segment",
    ({ request, query }) => forward(request, query.url, query.headers, "segment"),
    { query, detail: { tags: ["proxy"], summary: "TS Segment Proxy" } },
  )
  .get("/mp4-proxy", ({ request, query }) => forward(request, query.url, query.headers, "mp4"), {
    query,
    detail: { tags: ["proxy"], summary: "MP4 Video Proxy" },
  })
  .get("/fetch", ({ request, query }) => forward(request, query.url, query.headers, "file"), {
    query,
    detail: { tags: ["proxy"], summary: "General Media Fetch Proxy" },
  });
