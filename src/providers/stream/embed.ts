import type { connect } from "puppeteer-real-browser";
import { Cache } from "../../core/cache";
import { Logger } from "../../core/logger";
import { proxyUrl } from "../../core/proxy";

type Browser = Awaited<ReturnType<typeof connect>>["browser"];
type Context = Awaited<ReturnType<Browser["createBrowserContext"]>>;
type Page = Awaited<ReturnType<Context["newPage"]>>;
type Capture = { url: string; referer: string; server: number };

export class StreamError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const MAX_PAGES = 3;
const DEADLINE_MS = 22_000;
const FIRST_SERVER_MS = 12_000;
const SERVER_MS = 6_000;
const IDLE_MS = 1_500;
const SERVER_LIST_MS = 3_000;
const PARSE_WAIT_MS = 1_000;
const POLL_MS = 500;
const CACHE_TTL = 600;
const MEDIA_ID = /^(?:tt)?\d+$/;
const NUMBER = /^\d+$/;
const PLAYLIST = /\.m3u8(?:[?#]|$)/i;

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

let browser: Promise<Browser> | null = null;
let active = 0;
const waiting: (() => void)[] = [];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getBrowser(): Promise<Browser> {
  if (browser) return browser;
  Logger.info("[stream] Launching browser");
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

async function withPage<T>(task: (page: Page) => Promise<T>): Promise<T> {
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

function variantsOf(playlist: string, base: string): string[] {
  if (!playlist.includes("#EXT-X-STREAM-INF")) return [];
  return playlist.split(/\r?\n/).flatMap((line) => {
    const value = line.trim();
    const uris = value.startsWith("#")
      ? Array.from(value.matchAll(/URI="([^"]+)"/g), (match) => match[1])
      : [value];
    return uris
      .filter((uri) => uri && URL.canParse(uri, base))
      .map((uri) => new URL(uri, base).href);
  });
}

async function extract(page: Page, target: string) {
  const deadline = Date.now() + DEADLINE_MS;
  const captures: Capture[] = [];
  const variants = new Set<string>();
  const parsing: Promise<void>[] = [];
  const hits = new Set<number>();
  let server = 0;
  let popups = 0;

  page.on("popup", (popup) => {
    popups++;
    void popup?.close().catch(() => undefined);
  });
  page.on("response", (response) => {
    const url = response.url();
    const type = response.headers()["content-type"] ?? "";
    if (!response.ok() || variants.has(url)) return;
    if (!PLAYLIST.test(url) && !/mpegurl/i.test(type)) return;
    hits.add(server);
    if (captures.some((capture) => capture.url === url)) return;
    const headers = response.request().headers();
    captures.push({ url, referer: headers.referer ?? headers.Referer ?? target, server });
    parsing.push(
      response.text().then(
        (playlist) => {
          for (const variant of variantsOf(playlist, url)) variants.add(variant);
        },
        () => undefined,
      ),
    );
  });

  const select = (index: number) =>
    page
      .evaluate((i) => {
        const item = document.querySelectorAll("img[title]")[i]?.parentElement;
        item?.click();
      }, index)
      .catch(() => undefined);

  await page.goto(target, { waitUntil: "domcontentloaded", timeout: DEADLINE_MS });

  let names: string[] = [];
  let failures = 0;
  let cleared = true;
  let clickPopups = 0;
  let slotStart = Date.now();
  let settledAt = 0;

  while (Date.now() < deadline) {
    await sleep(POLL_MS);
    const state = await page
      .evaluate(() => {
        const text = document.body?.innerText ?? "";
        return {
          names: Array.from(document.querySelectorAll("img[title]"), (img) =>
            img.getAttribute("title"),
          ),
          failed: /something went wrong/i.test(text),
          busy: /\b(?:fetching|loading)\b/i.test(text),
        };
      })
      .catch(() => ({ names: [], failed: false, busy: true }));
    if (state.names.length) names = state.names;
    if (!state.failed) cleared = true;

    const hit = hits.has(server);
    const failed = state.failed && cleared && !hit;
    const elapsed = Date.now() - slotStart;
    if (server && !hit && popups !== clickPopups) {
      clickPopups = popups;
      await select(server);
      continue;
    }
    const idle = server > 0 && !state.busy && elapsed >= IDLE_MS;
    if (!hit && !failed && !idle && elapsed < (server ? SERVER_MS : FIRST_SERVER_MS)) continue;
    settledAt ||= Date.now();
    if (!names.length && Date.now() - settledAt < SERVER_LIST_MS) continue;
    Logger.debug(
      `[stream] ${target} ${names[server] ?? `server ${server}`}: ${hit ? "stream" : failed ? "error" : "no stream"} after ${elapsed}ms`,
    );
    if (failed) failures++;
    if (++server >= names.length) break;

    cleared = false;
    settledAt = 0;
    clickPopups = popups;
    slotStart = Date.now();
    await select(server);
  }
  await Promise.race([Promise.all(parsing), sleep(PARSE_WAIT_MS)]);

  const sources = captures.filter((capture) => !variants.has(capture.url));
  if (!sources.length) {
    throw failures
      ? new StreamError("No streams are available for this title", 404)
      : new StreamError("Timed out waiting for streams", 504);
  }
  return sources.map((capture, index) => ({
    type: "hls",
    url: proxyUrl(capture.url, { Referer: capture.referer }, "hls"),
    quality: "auto",
    server: names[capture.server] || `Server ${index + 1}`,
  }));
}

async function fetchSubtitles(name: string, baseUrl: string, params: Record<string, string>) {
  try {
    const res = await fetch(`${baseUrl}/wyzie?${new URLSearchParams(params)}`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 404) return [];
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const list: unknown = await res.json();
    if (!Array.isArray(list)) return [];
    return list
      .filter((sub) => typeof sub?.url === "string")
      .map((sub) => ({
        label: sub.display || sub.language || "Unknown",
        url: proxyUrl(sub.url, null, "file"),
        format: sub.format || "srt",
      }));
  } catch (err) {
    Logger.warn(`[${name}] Subtitles unavailable: ${(err as Error).message}`);
    return [];
  }
}

export function createEmbedScraper(name: string, baseUrl: string) {
  async function scrape(type: "movie" | "tv", id: string, season?: string, episode?: string) {
    const started = Date.now();
    const path = type === "movie" ? `/movie/${id}` : `/tv/${id}/${season}/${episode}`;
    const [subtitles, sources] = await Promise.all([
      fetchSubtitles(name, baseUrl, type === "movie" ? { id } : { id, season, episode }),
      withPage((page) => extract(page, baseUrl + path)).catch((err: Error) => {
        Logger.warn(`[${name}] ${path}: ${err.message}`);
        throw err instanceof StreamError
          ? err
          : new StreamError(`Extraction failed: ${err.message}`, 502);
      }),
    ]);
    Logger.info(
      `[${name}] ${path}: ${sources.length} sources, ${subtitles.length} subtitles in ${Date.now() - started}ms`,
    );
    return {
      type,
      tmdbId: id,
      season,
      episode,
      providerName: name,
      subtitles,
      sources,
      isEncrypted: false,
    };
  }

  async function load(type: "movie" | "tv", id: string, season?: string, episode?: string) {
    if (!MEDIA_ID.test(id) || (type === "tv" && !(NUMBER.test(season) && NUMBER.test(episode)))) {
      throw new StreamError("Invalid id, season or episode", 400);
    }
    const key = [name, type, id, season, episode].filter(Boolean).join(":");
    const { data } = await Cache.remember(key, CACHE_TTL, () => scrape(type, id, season, episode));
    return data;
  }

  return {
    fetchMovie: (id: string) => load("movie", id),
    fetchTv: (id: string, season: string, episode: string) => load("tv", id, season, episode),
  };
}
