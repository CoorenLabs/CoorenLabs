import * as cheerio from "cheerio";

export const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36";

const TIMEOUT_MS = 10_000;

type Options = { method?: string; headers?: Record<string, string>; body?: BodyInit };

export async function request(url: string, { headers, ...init }: Options = {}) {
  const res = await fetch(url, {
    ...init,
    headers: { "User-Agent": USER_AGENT, ...headers },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    void res.body?.cancel();
    throw new Error(`HTTP ${res.status} from ${url}`);
  }
  return res;
}

export async function loadHtml(url: string, options?: Options) {
  const res = await request(url, options);
  return cheerio.load(await res.text());
}
