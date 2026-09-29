import * as cheerio from "cheerio";
import { fetcher } from "../../../core/lib/fetcher";
import { mangapill as BASE_URL } from "../../origins";
import { HttpError, imageUrl, proxyImage, USER_AGENT } from "../shared";
import type {
  MangaPillChapter,
  MangaPillChapterPages,
  MangaPillMangaDetail,
  MangaPillSeries,
} from "./types";

const TIMEOUT = 15_000;
const HEADERS = { "User-Agent": USER_AGENT, Referer: `${BASE_URL}/` };

async function page(path: string) {
  const res = await fetcher(`${BASE_URL}${path}`, true, "mangapill", {
    headers: HEADERS,
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!res) throw new HttpError(502, "MangaPill is unreachable");
  if (res.status === 404) throw new HttpError(404, "Not found on MangaPill");
  if (res.status === 429) throw new HttpError(503, "MangaPill is rate limiting requests");
  if (!res.success) throw new HttpError(502, `MangaPill responded with HTTP ${res.status}`);
  return cheerio.load(res.text);
}

function image(url?: string) {
  return url ? imageUrl("mangapill", new URL(url, BASE_URL).href) : null;
}

function number(text: string) {
  const match = text.match(/chapter\s*(\d+(?:\.\d+)?)/i);
  return match ? Number(match[1]) : null;
}

function year(text?: string) {
  const value = parseInt(text ?? "", 10);
  return Number.isNaN(value) ? null : value;
}

function chapterId(href?: string) {
  return href?.match(/^\/chapters\/([^/]+)/)?.[1] ?? null;
}

async function search(query: string): Promise<MangaPillSeries[]> {
  const $ = await page(`/quick-search?q=${encodeURIComponent(query)}`);
  return $("a[href^='/manga/']")
    .toArray()
    .flatMap((el) => {
      const link = $(el);
      const href = link.attr("href") ?? "";
      const id = href.match(/^\/manga\/(\d+)/)?.[1];
      const title = link.find(".font-black").first().text().trim();
      if (!id || !title) return [];
      const [type, released, status] = link
        .find(".text-xs > div")
        .toArray()
        .map((meta) => $(meta).text().trim());
      return [
        {
          id,
          title,
          altTitle: link.find(".text-sm.text-secondary").first().text().trim() || null,
          cover: image(link.find("img").attr("data-src") || link.find("img").attr("src")),
          type: type || null,
          status: status || null,
          year: year(released),
          url: `${BASE_URL}${href}`,
        },
      ];
    });
}

async function detail(id: string): Promise<MangaPillMangaDetail> {
  if (!/^\d+$/.test(id)) throw new HttpError(400, "Invalid manga id, expected a numeric id");
  const $ = await page(`/manga/${id}`);
  const heading = $("h1").first();
  const title = heading.text().trim();
  if (!title) throw new HttpError(502, "MangaPill returned an unexpected page");
  const field = (name: string) =>
    $("label")
      .filter((_, el) => $(el).text().trim() === name)
      .first()
      .next()
      .text()
      .trim() || null;
  const chapters = $("#chapters a[href^='/chapters/']")
    .toArray()
    .flatMap((el): MangaPillChapter[] => {
      const href = $(el).attr("href");
      const chapter = chapterId(href);
      const name = $(el).text().trim();
      return chapter
        ? [{ id: chapter, number: number(name), title: name, url: `${BASE_URL}${href}` }]
        : [];
    });
  const cover = $("img[data-src]").first();
  return {
    id,
    title,
    altTitle: heading.next(".text-sm").text().trim() || null,
    cover: image(cover.attr("data-src") || cover.attr("src")),
    type: field("Type"),
    status: field("Status"),
    year: year(field("Year") ?? undefined),
    description: $("p.text-sm").first().text().trim() || null,
    genres: $("a[href^='/search?genre=']")
      .toArray()
      .map((el) => $(el).text().trim())
      .filter(Boolean),
    url: `${BASE_URL}/manga/${id}`,
    chapters,
  };
}

async function read(id: string): Promise<MangaPillChapterPages> {
  if (!/^\d+-\d+$/.test(id))
    throw new HttpError(400, "Invalid chapter id, expected e.g. 2-11194000");
  const $ = await page(`/chapters/${id}`);
  const pages = $("chapter-page img")
    .toArray()
    .map((el) => image($(el).attr("data-src") || $(el).attr("src")))
    .filter((src): src is string => !!src);
  if (!pages.length) throw new HttpError(502, "MangaPill returned a chapter without pages");
  const title = $("h1").first().text().trim();
  return {
    id,
    mangaId: id.split("-")[0],
    title,
    number: number(title),
    pages,
    url: `${BASE_URL}/chapters/${id}`,
    prevChapterId: chapterId($("a[data-hotkey='ArrowLeft']").first().attr("href")),
    nextChapterId: chapterId($("a[data-hotkey='ArrowRight']").first().attr("href")),
  };
}

function proxy(request: Request) {
  return proxyImage(request, `${BASE_URL}/`);
}

export const mangapill = { search, detail, read, proxy };
