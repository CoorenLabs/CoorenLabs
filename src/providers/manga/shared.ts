import { SERVER_ORIGIN } from "../../core/config";
import { Logger } from "../../core/logger";

export const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";

const TIMEOUT = 15_000;
const IMAGE_TIMEOUT = 30_000;
const HOSTNAME = /^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i;
const IMAGE_TYPE = /^(?:image\/(?!svg)|(?:application|binary)\/octet-stream)/i;
const EXTENSION_TYPES: Record<string, string> = {
  avif: "image/avif",
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request(label: string, url: string, init: RequestInit = {}, rejectsInput = false) {
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: init.signal ?? AbortSignal.timeout(TIMEOUT) });
  } catch (err) {
    Logger.warn(`[${label}] ${url}: ${(err as Error).message}`);
    if ((err as Error).name === "TimeoutError") throw new HttpError(504, `${label} timed out`);
    throw new HttpError(502, `${label} is unreachable`);
  }
  if (res.ok) return res;
  void res.body?.cancel();
  Logger.warn(`[${label}] ${res.status} from ${url}`);
  if (res.status === 404) throw new HttpError(404, `Not found on ${label}`);
  if (res.status === 400 && rejectsInput)
    throw new HttpError(400, `${label} rejected the request parameters`);
  if (res.status === 429)
    throw new HttpError(503, `${label} is rate limiting requests, try again shortly`);
  throw new HttpError(502, `${label} responded with HTTP ${res.status}`);
}

export async function getJson<T = any>(
  label: string,
  url: string,
  init?: RequestInit,
  rejectsInput = false,
): Promise<T> {
  const res = await request(label, url, init, rejectsInput);
  try {
    return (await res.json()) as T;
  } catch {
    throw new HttpError(502, `${label} returned an invalid response`);
  }
}

export async function respond(set: { status?: number | string }, task: () => Promise<unknown>) {
  try {
    return { status: 200, success: true, data: await task() };
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    if (status === 500) Logger.error(err);
    set.status = status;
    return { status, success: false, message: (err as Error).message, data: null };
  }
}

export function required(value: string | undefined, name: string) {
  if (!value) throw new HttpError(400, `Query parameter '${name}' is required`);
  return value;
}

export function num(value: string | undefined, fallback: number, min = 1, max = Infinity) {
  const parsed = parseInt(value ?? "", 10);
  return Number.isNaN(parsed) ? fallback : Math.min(Math.max(parsed, min), max);
}

export function imageUrl(provider: string, url: string) {
  return `${SERVER_ORIGIN}/manga/${provider}/image/${url.replace(/^https?:\/\//, "")}`;
}

export async function proxyImage(
  req: Request,
  referer: string,
  rewrite?: (url: URL) => void,
): Promise<Response> {
  const { pathname, search } = new URL(req.url);
  let target: URL;
  try {
    target = new URL(`https://${pathname.slice(pathname.indexOf("/image/") + 7)}${search}`);
  } catch {
    return new Response("Invalid image URL", { status: 400 });
  }
  if (!HOSTNAME.test(target.hostname)) return new Response("Invalid image host", { status: 400 });
  rewrite?.(target);

  let res: Response;
  try {
    res = await fetch(target, {
      headers: { Referer: referer, Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8" },
      signal: AbortSignal.any([req.signal, AbortSignal.timeout(IMAGE_TIMEOUT)]),
    });
  } catch {
    return new Response("Image unavailable", { status: 502 });
  }

  const extension = target.pathname.split(".").pop()?.toLowerCase() ?? "";
  const type =
    res.headers.get("content-type") || EXTENSION_TYPES[extension] || "application/octet-stream";
  if (!res.ok || !IMAGE_TYPE.test(type)) {
    void res.body?.cancel();
    return new Response("Image unavailable", { status: res.ok ? 502 : res.status });
  }

  const headers = new Headers({
    "content-type": type,
    "cache-control": "public, max-age=604800, immutable",
    "x-content-type-options": "nosniff",
  });
  const length = res.headers.get("content-length");
  if (length && !res.headers.has("content-encoding")) headers.set("content-length", length);
  return new Response(res.body, { headers });
}
