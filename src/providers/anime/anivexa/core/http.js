import { Logger } from "../../../../core/logger";
import { env } from "../../../../core/runtime";

export const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
export const HTML_ACCEPT = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";

const TIMEOUT = 15_000;
const WREQ_BROWSER = env.WREQ_BROWSER || "chrome_149";
const WREQ_OS = env.WREQ_OS || "windows";
const sessions = new Map();

export function upstreamError(message, rawBody, status) {
  return Object.assign(new Error(message), { rawBody, upstreamStatus: status });
}

export function withStatus(error, status) {
  return Object.assign(error instanceof Error ? error : new Error(String(error)), { status });
}

export function notFound(message) {
  return withStatus(new Error(message), 404);
}

export function request(url, { headers, timeout = TIMEOUT, signal, ...init } = {}) {
  return fetch(url, {
    ...init,
    headers: { "User-Agent": UA, ...headers },
    signal: signal ?? AbortSignal.timeout(timeout),
  });
}

async function checked(response, label) {
  const text = await response.text();
  if (!response.ok)
    throw upstreamError(`${label} HTTP ${response.status}: ${response.url}`, text, response.status);
  return text;
}

export async function fetchText(url, options = {}) {
  const { label = "Upstream", ...init } = options;
  return checked(await request(url, init), label);
}

export function parseJson(text, label = "Upstream") {
  try {
    return JSON.parse(text);
  } catch {
    throw upstreamError(`${label} returned invalid JSON`, text);
  }
}

export async function fetchJson(url, options = {}) {
  const { headers, label = "Upstream", ...init } = options;
  const text = await fetchText(url, {
    ...init,
    label,
    headers: { Accept: "application/json, text/plain, */*", ...headers },
  });
  return parseJson(text, label);
}

export function cookiesFrom(headers) {
  const values =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : [headers.get("set-cookie")].filter(Boolean);
  return values
    .map((value) => String(value).split(";")[0].trim())
    .filter((pair) => pair.includes("="));
}

function wreqSession(name) {
  let session = sessions.get(name);
  if (!session) {
    session = import("wreq-js")
      .then(({ createSession }) =>
        createSession({ browser: WREQ_BROWSER, os: WREQ_OS, timeout: TIMEOUT }),
      )
      .catch((error) => {
        sessions.delete(name);
        throw error;
      });
    sessions.set(name, session);
  }
  return session;
}

export async function wreqFetch(session, url, { timeout = TIMEOUT, ...init } = {}) {
  const client = await wreqSession(session);
  return client.fetch(url, { ...init, timeout });
}

export async function browserFetch(url, { session = "default", ...init } = {}) {
  try {
    return await wreqFetch(session, url, init);
  } catch (error) {
    Logger.debug(`[anivexa] wreq ${session} fell back to fetch: ${error?.message ?? error}`);
    return request(url, init);
  }
}
