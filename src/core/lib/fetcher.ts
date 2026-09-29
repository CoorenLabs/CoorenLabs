import { Cache } from "../cache";
import { Logger } from "../logger";
import { getCloudflareClearance } from "./cf-bypass";
import { browserFetch } from "./impersonate";

export type FetchResult = { success: boolean; status: number; text: string };

type CfCredentials = { cookie: string; userAgent: string };

type Attempt = FetchResult & { challenged: boolean };

const BLOCKED_STATUSES = [403, 503];
const CHALLENGE_PAGE = /_cf_chl_opt|<title>Just a moment/i;
const RATE_LIMIT_RETRY_DELAY = 2_000;
const CREDENTIALS_FALLBACK_TTL = 2 * 3600;
const UNSOLVABLE_BACKOFF = 10 * 60_000;
const CLIENT_HINTS = ["sec-ch-ua", "sec-ch-ua-mobile", "sec-ch-ua-platform"];

const remembered = new Map<string, { credentials: CfCredentials; expires: number }>();
const solving = new Map<string, Promise<CfCredentials | null>>();
const unsolvable = new Map<string, number>();
const browserTlsHosts = new Set<string>();

async function loadCredentials(key: string): Promise<CfCredentials | null> {
  const entry = remembered.get(key);
  if (entry && entry.expires > Date.now()) return entry.credentials;
  return Cache.getJson<CfCredentials>(key);
}

function saveCredentials(key: string, credentials: CfCredentials, ttl: number) {
  remembered.set(key, { credentials, expires: Date.now() + ttl * 1000 });
  void Cache.setJson(key, credentials, ttl);
}

function browserHeaders(init: RequestInit, credentials: CfCredentials | null): Headers {
  const headers = new Headers(init.headers);
  for (const hint of CLIENT_HINTS) headers.delete(hint);
  if (!credentials) return headers;
  const cookie = headers.get("cookie");
  headers.set("cookie", cookie ? `${credentials.cookie}; ${cookie}` : credentials.cookie);
  headers.set("user-agent", credentials.userAgent);
  return headers;
}

async function request(
  url: string,
  init: RequestInit,
  { browserTls, credentials }: { browserTls: boolean; credentials: CfCredentials | null },
): Promise<Attempt> {
  const res = browserTls
    ? await browserFetch(url, {
        method: init.method,
        headers: browserHeaders(init, credentials),
        body: typeof init.body === "string" ? init.body : undefined,
      })
    : await fetch(url, init);
  const text = await res.text();
  const challenged =
    res.headers.get("cf-mitigated") === "challenge" ||
    (BLOCKED_STATUSES.includes(res.status) && CHALLENGE_PAGE.test(text));
  return { success: res.ok, status: res.status, text, challenged };
}

function solve(url: string, key: string, label: string): Promise<CfCredentials | null> {
  if ((unsolvable.get(key) ?? 0) > Date.now()) return Promise.resolve(null);
  let pending = solving.get(key);
  if (!pending) {
    Logger.info(`[${label}] Cloudflare challenge on ${new URL(url).host}, solving in browser`);
    pending = getCloudflareClearance(url)
      .then((clearance) => {
        if (!clearance.success) {
          unsolvable.set(key, Date.now() + UNSOLVABLE_BACKOFF);
          return null;
        }
        const credentials = {
          cookie: `cf_clearance=${clearance.cfClearance}`,
          userAgent: clearance.userAgent,
        };
        saveCredentials(key, credentials, clearance.ttl || CREDENTIALS_FALLBACK_TTL);
        return credentials;
      })
      .finally(() => solving.delete(key));
    solving.set(key, pending);
  }
  return pending;
}

export async function fetcher(
  url: string,
  detectCloudflare: boolean,
  label = "default",
  init: RequestInit = {},
): Promise<FetchResult | undefined> {
  const key = `${label}:cf-clearance`;
  const { host } = new URL(url);
  try {
    const credentials = detectCloudflare ? await loadCredentials(key) : null;
    const browserTls = credentials !== null || browserTlsHosts.has(host);
    const first = await request(url, init, { browserTls, credentials });
    if (first.success || !detectCloudflare || !BLOCKED_STATUSES.includes(first.status)) {
      if (!first.success) Logger.warn(`[${label}] HTTP ${first.status} from ${url}`);
      return first;
    }

    let last = first;
    if (credentials && first.challenged) {
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_RETRY_DELAY));
      last = await request(url, init, { browserTls: true, credentials });
      if (last.success) return last;
    } else if (!browserTls) {
      last = await request(url, init, { browserTls: true, credentials: null });
      if (last.success) {
        browserTlsHosts.add(host);
        return last;
      }
    }

    if (!last.challenged) {
      Logger.warn(`[${label}] HTTP ${last.status} from ${url}`);
      return last;
    }

    remembered.delete(key);
    const cleared = await solve(url, key, label);
    if (!cleared) {
      Logger.warn(`[${label}] HTTP ${first.status} from ${url} (Cloudflare challenge unsolved)`);
      return first;
    }
    const retried = await request(url, init, { browserTls: true, credentials: cleared });
    if (!retried.success) Logger.warn(`[${label}] HTTP ${retried.status} after clearance: ${url}`);
    return retried;
  } catch (err) {
    Logger.warn(`[${label}] Request failed for ${url}: ${(err as Error).message}`);
  }
}
