import * as cheerio from "cheerio";
import { fetcher } from "../../../core/lib/fetcher";
import { flamecomics as BASE_URL } from "../../origins";
import { HttpError } from "../shared";
import type {
  FlameComicsChapter,
  FlameComicsChapterPages,
  FlameComicsMangaDetail,
  FlameComicsSeries,
} from "./types";

const CDN = `https://cdn.${new URL(BASE_URL).host}/uploads/images/series`;
const BUILD_ID = /"buildId"\s*:\s*"([^"]+)"/;
const TIMEOUT = 15_000;

let build: Promise<string> | undefined;

function upstream(status: number) {
  if (status === 404) return new HttpError(404, "Not found on FlameComics");
  if (status === 429) return new HttpError(503, "FlameComics is rate limiting requests");
  return new HttpError(502, `FlameComics responded with HTTP ${status}`);
}

async function get(url: string) {
  const res = await fetcher(url, true, "flamecomics", { signal: AbortSignal.timeout(TIMEOUT) });
  if (!res) throw new HttpError(502, "FlameComics is unreachable");
  return res;
}

function buildId() {
  build ??= get(`${BASE_URL}/`)
    .then((res) => {
      if (!res.success) throw upstream(res.status);
      const id = res.text.match(BUILD_ID)?.[1];
      if (!id) throw new HttpError(502, "FlameComics build id not found");
      return id;
    })
    .catch((err) => {
      build = undefined;
      throw err;
    });
  return build;
}

async function data(path: string, retry = true): Promise<any> {
  const res = await get(`${BASE_URL}/_next/data/${await buildId()}${path}.json`);
  let body: any;
  try {
    body = JSON.parse(res.text);
  } catch {
    body = undefined;
  }
  if (res.success && body?.pageProps) return body.pageProps;
  if (body?.notFound) throw upstream(404);
  if (res.success) throw new HttpError(502, "FlameComics returned an invalid response");
  if (res.status !== 404) throw upstream(res.status);
  if (!retry) throw new HttpError(502, "FlameComics data route is unavailable");
  build = undefined;
  return data(path, false);
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function names(value: unknown) {
  return Array.isArray(value) ? value.map((entry) => String(entry).trim()).filter(Boolean) : [];
}

function date(seconds?: number) {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

function cover(series: any) {
  if (!series.cover) return null;
  const src = `${CDN}/${series.series_id}/${series.cover}${series.last_edit ? `?${series.last_edit}` : ""}`;
  return `${BASE_URL}/_next/image?url=${encodeURIComponent(src)}&w=1920&q=75`;
}

function toSeries(series: any): FlameComicsSeries {
  return {
    id: String(series.series_id),
    title: series.title,
    cover: cover(series),
    type: series.type ?? null,
    status: series.status ?? null,
    url: `${BASE_URL}/series/${series.series_id}`,
  };
}

function seriesId(id: string) {
  if (!/^\d+$/.test(id)) throw new HttpError(400, "Invalid series id, expected a numeric id");
  return id;
}

async function search(query: string): Promise<FlameComicsSeries[]> {
  const { series } = await data("/browse");
  if (!Array.isArray(series)) throw new HttpError(502, "FlameComics returned an invalid response");
  const needle = normalize(query);
  return series
    .filter((entry) => entry.series_id && normalize(entry.title ?? "").includes(needle))
    .map(toSeries);
}

async function detail(id: string): Promise<FlameComicsMangaDetail> {
  const { series, chapters } = await data(`/series/${seriesId(id)}`);
  if (!series?.series_id) throw new HttpError(404, "Series not found");
  const description = series.description ? cheerio.load(series.description).text().trim() : "";
  return {
    ...toSeries(series),
    description: description || null,
    altTitles: names(series.altTitles),
    genres: names(series.tags ?? series.categories),
    authors: names(series.author),
    artists: names(series.artist),
    year: series.year ?? null,
    chapters: (Array.isArray(chapters) ? chapters : []).map((chapter): FlameComicsChapter => ({
      id: String(chapter.chapter_id),
      number: Number(chapter.chapter),
      title: chapter.title || null,
      token: chapter.token,
      releaseDate: date(chapter.release_date),
      url: `${BASE_URL}/series/${series.series_id}/${chapter.token}`,
    })),
  };
}

async function read(mangaId: string, token: string): Promise<FlameComicsChapterPages> {
  const { chapter, previous, next } = await data(
    `/series/${seriesId(mangaId)}/${encodeURIComponent(token)}`,
  );
  if (!chapter?.token) throw new HttpError(404, "Chapter not found");
  const version = chapter.edit_time ? `?${chapter.edit_time}` : "";
  const images = Object.entries(chapter.images ?? {})
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, image]: [string, any]) => (typeof image === "string" ? image : image?.name))
    .filter(Boolean)
    .map(
      (name) =>
        `${CDN}/${chapter.series_id}/${chapter.token}/${encodeURIComponent(name)}${version}`,
    );
  if (!images.length) throw new HttpError(404, "Chapter has no pages");
  return {
    id: String(chapter.chapter_id),
    mangaId: String(chapter.series_id),
    mangaTitle: chapter.title || null,
    number: Number(chapter.chapter),
    title: chapter.chapter_title || null,
    token: chapter.token,
    releaseDate: date(chapter.release_date),
    images,
    prevToken: previous || null,
    nextToken: next || null,
  };
}

export const flamecomics = { search, detail, read };
