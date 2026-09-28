import { Logger } from "../logger";

export const CF_CHALLENGE_STATUSES = [403, 429, 503];
export const CF_SIGNATURES = [
  "window._cf_chl_opt",
  "<title>Just a moment...</title>",
  "<title>Attention Required! | Cloudflare</title>",
  'id="challenge-form"',
  "__cf_chl_tk",
];

type Solved = { cfClearance: string; userAgent: string; ttl: number };
type Clearance = ({ success: true } & Solved) | { success: false; error: string };

const TIMEOUT = 15_000;
const POLL_INTERVAL = 250;
const FALLBACK_TTL = 3600;
const CHALLENGE_TITLES = ["Just a moment", "Cloudflare", "Attention Required"];

let browser: any = null;
let page: any = null;
let queue: Promise<unknown> = Promise.resolve();

async function ensurePage() {
  if (browser?.isConnected() && page && !page.isClosed()) return page;
  Logger.info("[cf-bypass] Launching browser");
  if (browser) await browser.close().catch(() => undefined);
  const { connect } = await import("puppeteer-real-browser");
  ({ browser, page } = await connect({
    headless: false,
    turnstile: true,
    disableXvfb: false,
    ignoreAllFlags: false,
  }));
  return page;
}

function waitForClearance(tab: any): Promise<Solved> {
  return new Promise((resolve, reject) => {
    const poll = setInterval(async () => {
      try {
        if (tab.isClosed()) return;
        const title: string = await tab.evaluate(() => document.title).catch(() => "");
        if (CHALLENGE_TITLES.some((marker) => title.includes(marker))) return;

        const cookie = (await tab.cookies()).find((c: any) => c.name === "cf_clearance");
        if (!cookie) return;
        const userAgent: string = await tab.evaluate(() => navigator.userAgent);

        clearInterval(poll);
        clearTimeout(timer);
        const remaining = Math.floor(cookie.expires - Date.now() / 1000);
        resolve({
          cfClearance: cookie.value,
          userAgent,
          ttl: cookie.expires > 0 && remaining > 0 ? remaining : FALLBACK_TTL,
        });
      } catch {
        return;
      }
    }, POLL_INTERVAL);

    const timer = setTimeout(() => {
      clearInterval(poll);
      reject(new Error("Timed out waiting for the cf_clearance cookie"));
    }, TIMEOUT);
  });
}

async function solve(targetUrl: string): Promise<Clearance> {
  try {
    const tab = await ensurePage();
    Logger.info(`[cf-bypass] Navigating to ${targetUrl}`);
    await tab.goto(targetUrl, { waitUntil: "domcontentloaded" });
    const clearance = await waitForClearance(tab);
    Logger.info(`[cf-bypass] Obtained clearance, ttl ${clearance.ttl}s`);
    return { success: true, ...clearance };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    Logger.error(`[cf-bypass] ${error}`);
    return { success: false, error };
  }
}

export function getCloudflareClearance(targetUrl: string): Promise<Clearance> {
  const run = queue.then(() => solve(targetUrl));
  queue = run;
  return run;
}
