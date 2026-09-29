import type { connect } from "puppeteer-real-browser";
import { Logger } from "../logger";

type Browser = Awaited<ReturnType<typeof connect>>["browser"];
type Context = Awaited<ReturnType<Browser["createBrowserContext"]>>;
export type Page = Awaited<ReturnType<Context["newPage"]>>;

const MAX_PAGES = 3;

const LAUNCH_ARGS = [
  "--disable-notifications",
  "--mute-audio",
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--window-size=1280,720",
  "--window-position=-32000,-32000",
  "--hide-scrollbars",
  "--disable-blink-features=AutomationControlled",
  "--disable-background-timer-throttling",
  "--disable-backgrounding-occluded-windows",
  "--disable-renderer-backgrounding",
  "--disable-features=PictureInPicture,MediaSessionService,DocumentPictureInPictureAPI",
];

const TEARDOWN_ERRORS = /Target closed|Session closed|main frame too early/i;

let browser: Promise<Browser> | null = null;
let active = 0;
let guarded = false;
const waiting: (() => void)[] = [];

function ignoreTeardownErrors() {
  if (guarded) return;
  guarded = true;
  process.on("unhandledRejection", (reason) => {
    const message = reason instanceof Error ? reason.message : String(reason);
    if (!TEARDOWN_ERRORS.test(message)) throw reason;
    Logger.debug(`[browser] Ignored page teardown error: ${message}`);
  });
}

function getBrowser(): Promise<Browser> {
  if (browser) return browser;
  ignoreTeardownErrors();
  Logger.info("[browser] Launching");
  const launching = import("puppeteer-real-browser")
    .then(({ connect }) =>
      connect({
        headless: false,
        turnstile: true,
        disableXvfb: false,
        ignoreAllFlags: false,
        args: LAUNCH_ARGS,
      }),
    )
    .then(({ browser: instance }) => {
      instance.once("disconnected", () => {
        if (browser === launching) browser = null;
      });
      return instance;
    });
  launching.catch(() => {
    if (browser === launching) browser = null;
  });
  browser = launching;
  return launching;
}

export async function withPage<T>(task: (page: Page) => Promise<T>): Promise<T> {
  if (active < MAX_PAGES) active++;
  else await new Promise<void>((resolve) => waiting.push(resolve));
  let context: Context | undefined;
  try {
    context = await (await getBrowser()).createBrowserContext();
    return await task(await context.newPage());
  } finally {
    void context?.close().catch(() => undefined);
    const next = waiting.shift();
    if (next) next();
    else active--;
  }
}
