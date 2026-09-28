import { Cache } from "../cache";
import { Logger } from "../logger";
import { CF_CHALLENGE_STATUSES, CF_SIGNATURES, getCloudflareClearance } from "./cf-bypass";

export type FetchResult = { success: boolean; status: number; text: string };

type CfCredentials = { cookie: string; userAgent: string };

const CF_CREDENTIALS_FALLBACK_TTL = 2 * 3600;
const CF_BYPASS_ATTEMPTS = 3;

const remembered = new Map<string, { credentials: CfCredentials; expires: number }>();

async function loadCredentials(key: string): Promise<CfCredentials | null> {
  const entry = remembered.get(key);
  if (entry && entry.expires > Date.now()) return entry.credentials;
  return Cache.getJson<CfCredentials>(key);
}

function saveCredentials(key: string, credentials: CfCredentials, ttl: number) {
  remembered.set(key, { credentials, expires: Date.now() + ttl * 1000 });
  void Cache.setJson(key, credentials, ttl);
}

function withCredentials(init: RequestInit, credentials: CfCredentials): RequestInit {
  const headers = new Headers(init.headers);
  const cookie = headers.get("cookie");
  headers.set("cookie", cookie ? `${credentials.cookie} ${cookie}` : credentials.cookie);
  if (credentials.userAgent) headers.set("user-agent", credentials.userAgent);
  return { ...init, headers };
}

async function request(url: string, init: RequestInit): Promise<FetchResult> {
  const res = await fetch(url, init);
  return { success: res.ok, status: res.status, text: await res.text() };
}

async function bypass(
  url: string,
  init: RequestInit,
  label: string,
  credentialsKey: string,
): Promise<FetchResult | undefined> {
  for (let attempt = 1; attempt <= CF_BYPASS_ATTEMPTS; attempt++) {
    Logger.info(`[${label}] Cloudflare challenge, bypass attempt ${attempt}/${CF_BYPASS_ATTEMPTS}`);
    const clearance = await getCloudflareClearance(url);
    if (!clearance.success) continue;

    const credentials = {
      cookie: `cf_clearance=${clearance.cfClearance};`,
      userAgent: clearance.userAgent,
    };
    saveCredentials(credentialsKey, credentials, clearance.ttl || CF_CREDENTIALS_FALLBACK_TTL);

    const result = await request(url, withCredentials(init, credentials));
    if (result.success) {
      Logger.success(`[${label}] Cloudflare challenge bypassed`);
      return result;
    }
  }
  Logger.error(`[${label}] Cloudflare bypass failed for ${url}`);
}

export async function fetcher(
  url: string,
  detectCloudflare: boolean,
  label = "default",
  init: RequestInit = {},
): Promise<FetchResult | undefined> {
  const credentialsKey = `${label}:cf-clearance`;
  try {
    const credentials = detectCloudflare ? await loadCredentials(credentialsKey) : null;
    const result = await request(url, credentials ? withCredentials(init, credentials) : init);
    if (result.success) return result;

    Logger.warn(`[${label}] ${result.status} from ${url}`);
    const challenged =
      detectCloudflare &&
      CF_CHALLENGE_STATUSES.includes(result.status) &&
      CF_SIGNATURES.some((signature) => result.text.includes(signature));

    return (challenged && (await bypass(url, init, label, credentialsKey))) || result;
  } catch (err) {
    Logger.error(`[${label}] Request failed for ${url}`, err);
  }
}
