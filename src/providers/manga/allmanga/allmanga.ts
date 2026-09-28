import { createHash } from "node:crypto";
import { Cache } from "../../../core/cache";
import { type Page, withPage } from "../../../core/lib/browser";
import { Logger } from "../../../core/logger";
import {
  allmanga as BASE_URL,
  allmanga_api as API_URL,
  allmanga_reader as READER_URL,
} from "../../origins";
import { getJson, HttpError, imageUrl, proxyImage, USER_AGENT } from "../shared";

const PROVIDER = "allmanga";
const LABEL = "AllManga";
const CDN = "https://wp.youtube-anime.com/aln.youtube-anime.com";
const HOME_TTL = 1800;
const READ_TTL = 86400;
const READ_TIMEOUT = 25_000;
const EMPTY_GRACE = 5_000;
const COLLECT_TIMEOUT = 5_000;
const POLL_INTERVAL = 200;
const CHAPTER_PART = /^[\w.-]+$/;
const TAGS_PER_PAGE = 100;
const HEADERS = { "User-Agent": USER_AGENT, Referer: `${BASE_URL}/`, Origin: BASE_URL };
const PERIODS: Record<string, number> = { daily: 1, weekly: 7, monthly: 30, all: 0 };
const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

const CARD = "_id name englishName nativeName thumbnail score availableChapters";
const QUERIES = {
  popular: `query($type:VaildPopularTypeEnumType!,$size:Int!,$dateRange:Int,$page:Int,$allowAdult:Boolean,$allowUnknown:Boolean){queryPopular(type:$type,size:$size,dateRange:$dateRange,page:$page,allowAdult:$allowAdult,allowUnknown:$allowUnknown){total recommendations{anyCard{${CARD}}}}}`,
  search: `query($search:SearchInput,$limit:Int,$page:Int,$translationType:VaildTranslationTypeMangaEnumType,$countryOrigin:VaildCountryOriginEnumType){mangas(search:$search,limit:$limit,page:$page,translationType:$translationType,countryOrigin:$countryOrigin){pageInfo{total}edges{${CARD}}}}`,
  random: `query($format:String!){queryRandomRecommendation(format:$format){${CARD}}}`,
  tags: `query($page:Int,$limit:Int,$search:TagSearchInput){queryTags(page:$page,limit:$limit,search:$search){pageInfo{total}edges{name slug tagType mangaCount}}}`,
  tagList: `query($search:ListForTagInput!){queryListForTag(search:$search){edges{${CARD}}}}`,
  manga: `query($_id:String!){manga(_id:$_id){_id name englishName nativeName thumbnail description authors genres status availableChapters availableChaptersDetail airedStart airedEnd}}`,
};

type Query = keyof typeof QUERIES;
type GraphQLResponse = { data?: any; errors?: { message?: string }[] };
type Tag = { name: string; slug: string; tagType: string | null; mangaCount: number };
type Clearance = Parameters<ReturnType<Page["browserContext"]>["setCookie"]>[0];

const HASHES = Object.fromEntries(
  Object.entries(QUERIES).map(([name, query]) => [
    name,
    createHash("sha256").update(query).digest("hex"),
  ]),
) as Record<Query, string>;

const reading = new Map<string, Promise<string[]>>();
let clearance: Clearance | null = null;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function gql(name: Query, variables: Record<string, unknown>) {
  const query = QUERIES[name];
  const extensions = { persistedQuery: { version: 1, sha256Hash: HASHES[name] } };
  const params = new URLSearchParams({
    variables: JSON.stringify(variables),
    extensions: JSON.stringify(extensions),
  });
  let body = await getJson<GraphQLResponse>(LABEL, `${API_URL}?${params}`, { headers: HEADERS });
  if (body.errors?.some((error) => error.message === "PersistedQueryNotFound")) {
    body = await getJson<GraphQLResponse>(LABEL, API_URL, {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables, extensions }),
    });
  }
  const messages = body.errors?.map((error) => error.message).join("; ");
  if (messages?.includes("NEED_CAPTCHA")) {
    throw new HttpError(503, "AllManga requires captcha verification for this request");
  }
  if (messages) throw new HttpError(502, `AllManga API error: ${messages}`);
  return body.data ?? {};
}

function clean(text?: string | null) {
  return (text ?? "")
    .replace(/<[^>]*>?/g, " ")
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
      if (entity[0] !== "#") return ENTITIES[entity.toLowerCase()] ?? match;
      const code = /x/i.test(entity[1]) ? parseInt(entity.slice(2), 16) : +entity.slice(1);
      return code <= 0x10ffff ? String.fromCodePoint(code) : match;
    })
    .replace(/\s+/g, " ")
    .trim();
}

function cover(thumbnail?: string | null) {
  if (!thumbnail) return null;
  const url = /^https?:\/\//.test(thumbnail)
    ? thumbnail
    : `${CDN}/${thumbnail.replace(/^\/+/, "")}?w=250`;
  return imageUrl(PROVIDER, url);
}

function toCards(list: any[] = []) {
  return list.map((item) => {
    const card = item.anyCard ?? item;
    return {
      id: card._id,
      title: clean(card.name),
      englishTitle: clean(card.englishName),
      nativeTitle: clean(card.nativeName),
      cover: cover(card.thumbnail),
      score: card.score,
      availableChapters: card.availableChapters || { sub: 0, raw: 0 },
    };
  });
}

async function fetchTags(search: Record<string, unknown>, page = 1, limit?: number) {
  const { queryTags } = await gql("tags", { search: { format: "manga", ...search }, page, limit });
  return { total: queryTags?.pageInfo?.total ?? 0, tags: (queryTags?.edges ?? []) as Tag[] };
}

async function parsePopular(page = 1, size = 20, period = "daily") {
  const { queryPopular } = await gql("popular", {
    type: "manga",
    size,
    dateRange: PERIODS[period] ?? PERIODS.daily,
    page,
    allowAdult: false,
    allowUnknown: false,
  });
  return {
    provider: LABEL,
    total: queryPopular?.total || 0,
    page,
    period,
    results: toCards(queryPopular?.recommendations),
  };
}

async function parseSearch(query: string, page = 1, filters: Record<string, unknown> = {}) {
  const { mangas } = await gql("search", {
    search: {
      isManga: true,
      allowAdult: false,
      allowUnknown: false,
      ...filters,
      ...(query && { query }),
    },
    limit: 26,
    page,
    translationType: "sub",
    countryOrigin: "ALL",
  });
  return {
    provider: LABEL,
    total: mangas?.pageInfo?.total || 0,
    page,
    results: toCards(mangas?.edges),
  };
}

async function parseRandom() {
  const { queryRandomRecommendation } = await gql("random", { format: "manga" });
  return { provider: LABEL, results: toCards(queryRandomRecommendation) };
}

async function parseTags(page = 1) {
  const { total, tags } = await fetchTags({}, page, TAGS_PER_PAGE);
  return {
    provider: LABEL,
    total,
    page,
    tags: tags.map((tag) => ({
      name: tag.name,
      slug: tag.slug,
      type: tag.tagType || "genre",
      count: tag.mangaCount,
    })),
  };
}

async function taggedManga({ slug, name, tagType }: Tag) {
  const { queryListForTag } = await gql("tagList", {
    search: { slug, format: "manga", tagType: tagType ?? null, name },
  });
  return { results: toCards(queryListForTag?.edges) };
}

async function buildHome() {
  const year = new Date().getFullYear();
  const section = (id: string, title: string, task: Promise<{ results: unknown[] }>) =>
    task.then(({ results }) => ({ id, title, items: results }));

  const tagSections = fetchTags({ queryType: "Home" }).then(({ tags }) =>
    Promise.allSettled(tags.map((tag) => section(tag.slug, tag.name, taggedManga(tag)))),
  );
  const core = await Promise.allSettled([
    section("popular-daily", "Popular Manga (Daily)", parsePopular(1, 15, "daily")),
    section("latest", "Latest Updates", parseSearch("", 1)),
    section(`manga-${year}`, `Manga ${year}`, parseSearch("", 1, { year })),
    section("random", "Random Recommendations", parseRandom()),
  ]);
  const tagged = await tagSections.catch(() => []);

  const sections = [...core, ...tagged].flatMap((result) =>
    result.status === "fulfilled" && result.value.items.length ? [result.value] : [],
  );
  if (!sections.length) throw new HttpError(502, "AllManga home is unavailable");
  return { provider: LABEL, sections };
}

async function parseHome() {
  return (await Cache.remember("allmanga:home", HOME_TTL, buildHome)).data;
}

async function parseDetail(id: string) {
  const { manga } = await gql("manga", { _id: id });
  if (!manga) throw new HttpError(404, "Manga not found");
  const chapters: string[] = [...(manga.availableChaptersDetail?.sub ?? [])].sort(
    (a, b) => Number(b) - Number(a),
  );
  return {
    provider: LABEL,
    id: manga._id,
    title: clean(manga.name),
    englishTitle: clean(manga.englishName),
    nativeTitle: clean(manga.nativeName),
    cover: cover(manga.thumbnail),
    description: clean(manga.description),
    genres: (manga.genres ?? []).map((genre: string) => ({ genre, slug: genre })),
    authors: (manga.authors ?? []).map((author: string) => ({ author, slug: author })),
    status: manga.status || "Unknown",
    totalChapters: manga.availableChapters?.sub || 0,
    rawChapters: manga.availableChapters?.raw || 0,
    airedStart: manga.airedStart,
    airedEnd: manga.airedEnd,
    chapterList: chapters.map((chapter) => ({
      id: `${manga._id}:sub:${chapter}`,
      number: Number(chapter),
      title: `Chapter ${chapter}`,
      lang: "sub",
    })),
  };
}

function apiErrors(body: string) {
  try {
    const { errors } = JSON.parse(body) as GraphQLResponse;
    return errors?.map((error) => error.message).join("; ") ?? "";
  } catch {
    return "";
  }
}

function watchChapter(page: Page, path: string) {
  const chapter = {
    reached: false,
    answeredAt: 0,
    status: 0,
    error: "",
    retryAt: 0,
    captcha: false,
  };
  page.on("response", (response) => {
    const request = response.request();
    if (request.resourceType() === "document") {
      if (response.ok() && response.url().startsWith(READER_URL)) chapter.reached = true;
      return;
    }
    if (!["fetch", "xhr"].includes(request.resourceType())) return;
    if (!`${request.url()} ${request.postData() ?? ""}`.includes("chapterString")) return;
    void response.text().then(
      (body) => {
        const error = apiErrors(body);
        if (body.includes("NEED_CAPTCHA")) {
          if (!chapter.captcha) Logger.warn(`[${LABEL}] ${path}: reader requested captcha`);
          chapter.captcha = true;
        } else if (/too many requests/i.test(error)) {
          const seconds = Number(/(\d+)\s*second/i.exec(error)?.[1] ?? 3);
          chapter.retryAt = Date.now() + (seconds + Math.random()) * 1000;
          Logger.debug(`[${LABEL}] ${path}: rate limited, reloading in ${seconds}s`);
        } else {
          chapter.status = response.status();
          chapter.error = error;
          chapter.answeredAt ||= Date.now();
        }
      },
      () => undefined,
    );
  });
  return chapter;
}

async function waitForSlots(
  page: Page,
  chapter: ReturnType<typeof watchChapter>,
  deadline: number,
) {
  let slots = 0;
  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL);
    if (chapter.retryAt && Date.now() >= chapter.retryAt) {
      chapter.retryAt = 0;
      const timeout = Math.max(deadline - Date.now(), 1_000);
      await page.reload({ waitUntil: "domcontentloaded", timeout }).catch(() => undefined);
      continue;
    }
    const count = await page
      .evaluate(() => document.querySelectorAll(".reader-page").length)
      .catch(() => null);
    if (count === null) continue;
    if (count && count === slots) return;
    slots = count;
    if (!slots && chapter.answeredAt && Date.now() - chapter.answeredAt > EMPTY_GRACE) {
      if (chapter.error) throw new HttpError(502, `AllManga API error: ${chapter.error}`);
      throw chapter.status < 400
        ? new HttpError(404, "Chapter pages not found")
        : new HttpError(502, `AllManga reader responded with HTTP ${chapter.status}`);
    }
  }
  if (!chapter.reached) {
    clearance = null;
    throw new HttpError(503, "AllManga reader verification did not complete");
  }
  if (chapter.retryAt) {
    throw new HttpError(503, "AllManga is rate limiting chapter requests, try again shortly");
  }
  if (chapter.captcha) {
    throw new HttpError(503, "AllManga requires captcha verification for this request");
  }
  throw new HttpError(504, "AllManga reader timed out");
}

async function keepClearance(page: Page) {
  const cookies = await page
    .browserContext()
    .cookies()
    .catch(() => []);
  const cookie = cookies.find((item) => item.name === "cf_clearance");
  if (!cookie) return;
  const { name, value, domain, path, expires, httpOnly, secure, sameSite } = cookie;
  clearance = { name, value, domain, path, expires, httpOnly, secure, sameSite };
}

function collectPages(page: Page, timeout: number) {
  return page.evaluate(async (limit: number) => {
    const until = Date.now() + limit;
    const source = (slot: Element) => {
      const src = slot.querySelector("img")?.src ?? "";
      return /^https?:\/\//.test(src) ? src : "";
    };
    const urls: string[] = [];
    for (const slot of document.querySelectorAll(".reader-page")) {
      while (!source(slot) && Date.now() < until) {
        slot.scrollIntoView({ block: "start" });
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      urls.push(source(slot));
    }
    return urls;
  }, timeout);
}

async function capture(page: Page, path: string) {
  const started = Date.now();
  const deadline = started + READ_TIMEOUT;
  const chapter = watchChapter(page, path);
  if (clearance && clearance.expires > started / 1000) {
    await page.browserContext().setCookie(clearance);
  }
  await page.goto(`${READER_URL}${path}`, { waitUntil: "domcontentloaded", timeout: READ_TIMEOUT });

  try {
    await waitForSlots(page, chapter, deadline);
  } finally {
    if (chapter.reached) await keepClearance(page);
  }

  const urls = await collectPages(page, Math.max(deadline - Date.now(), COLLECT_TIMEOUT));
  if (!urls.length || urls.some((url) => !url)) {
    throw new HttpError(502, "AllManga reader returned incomplete pages");
  }
  Logger.info(`[${LABEL}] ${path}: ${urls.length} pages in ${Date.now() - started}ms`);
  return urls;
}

async function readChapter(path: string) {
  try {
    return await withPage((page) => capture(page, path));
  } catch (err) {
    const error =
      err instanceof HttpError
        ? err
        : new HttpError(
            (err as Error).name === "TimeoutError" ? 504 : 502,
            "AllManga reader is unavailable",
          );
    if (error.status !== 404) Logger.warn(`[${LABEL}] ${path}: ${(err as Error).message}`);
    throw error;
  }
}

async function parseRead(chapterId: string) {
  const [mangaId, translationType = "sub", chapterString = "1"] = chapterId.split(":");
  const parts = [mangaId, translationType, chapterString];
  if (!parts.every((part) => CHAPTER_PART.test(part))) {
    throw new HttpError(400, "Invalid chapter id");
  }
  const key = parts.join(":");
  let pending = reading.get(key);
  if (!pending) {
    const path = `/manga/${mangaId}/chapter-${chapterString}-${translationType}`;
    pending = Cache.remember(`allmanga:read:${key}`, READ_TTL, () => readChapter(path))
      .then(({ data }) => data)
      .finally(() => reading.delete(key));
    reading.set(key, pending);
  }
  const urls = await pending;
  return {
    provider: LABEL,
    id: chapterId,
    pages: urls.map((url, index) => ({ page: index + 1, img: imageUrl(PROVIDER, url) })),
  };
}

function proxy(request: Request) {
  return proxyImage(request, `${BASE_URL}/`);
}

export const allmanga = {
  parseHome,
  parsePopular,
  parseSearch,
  parseRandom,
  parseTags,
  parseDetail,
  parseRead,
  proxy,
};
