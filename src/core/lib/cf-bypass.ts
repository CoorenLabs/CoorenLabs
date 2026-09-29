import { Logger } from "../logger";
import { type Page, withPage } from "./browser";

type Solved = { cfClearance: string; userAgent: string; ttl: number };
type Clearance = ({ success: true } & Solved) | { success: false; error: string };

const TIMEOUT = 15_000;
const POLL_INTERVAL = 250;
const FALLBACK_TTL = 3600;
const CHALLENGE_TITLES = ["Just a moment", "Cloudflare", "Attention Required"];

function waitForClearance(page: Page): Promise<Solved> {
  return new Promise((resolve, reject) => {
    const poll = setInterval(async () => {
      try {
        const title: string | null = await page.evaluate(() => document.title).catch(() => null);
        if (title === null || CHALLENGE_TITLES.some((marker) => title.includes(marker))) return;

        const cookie = (await page.cookies()).find((c) => c.name === "cf_clearance");
        if (!cookie) return;
        const userAgent: string = await page.evaluate(() => navigator.userAgent);

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

export async function getCloudflareClearance(targetUrl: string): Promise<Clearance> {
  try {
    const clearance = await withPage(async (page) => {
      await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: TIMEOUT });
      return waitForClearance(page);
    });
    Logger.info(`[cf-bypass] Cleared ${new URL(targetUrl).host}`);
    return { success: true, ...clearance };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    Logger.warn(`[cf-bypass] ${new URL(targetUrl).host}: ${error}`);
    return { success: false, error };
  }
}
