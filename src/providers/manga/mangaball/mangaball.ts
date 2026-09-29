import { Cache } from "../../../core/cache";
import { mangaball as BASE_URL } from "../../origins";
import { getJson, HttpError, imageUrl, num, proxyImage, USER_AGENT } from "../shared";

const API = `https://api.${new URL(BASE_URL).host}/api/v1`;
const COVERS = "https://bulbasaur.poke-black-and-white.net/covers/";
const ADULT_MODE = "all";
const TIMEOUT = 30_000;
const DETAIL_TTL = 600;
const CHAPTER_PAGE_SIZE = 100;
const CHAPTER_CONCURRENCY = 4;
const HEADERS = {
  Accept: "application/json",
  "User-Agent": USER_AGENT,
  Origin: BASE_URL,
  Referer: `${BASE_URL}/`,
};

const STATUS: Record<string, string> = {
  ongoing: "Ongoing",
  completed: "Completed",
  on_hold: "On-Hold",
  cancelled: "Cancelled",
  hiatus: "Hiatus",
};
const ORIGINS: Record<string, string> = {
  jp: "manga",
  ja: "manga",
  kr: "manhwa",
  ko: "manhwa",
  manhua: "cn",
  zh: "cn",
  en: "comics",
};
const PERIODS: Record<string, string> = {
  day: "today",
  today: "today",
  week: "week",
  month: "month",
};
const SORTS: Record<string, string> = {
  updated_chapters: "lastupdate",
  updated: "lastupdate",
  latest: "lastupdate",
  created_at: "created_at",
  added: "created_at",
  rating_average: "rating",
  title: "name",
};

type Params = Record<string, string | number | undefined>;
type Query = Record<string, string | undefined>;

export type SearchOptions = {
  keyword?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: string;
  type?: string;
  status?: string;
  demographic?: string;
  includedTags?: string[];
  excludedTags?: string[];
  tagMode?: string;
};

function api<T = any>(path: string, params: Params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const suffix = query.toString();
  return getJson<T>("Mangaball", `${API}${path}${suffix && `?${suffix}`}`, {
    headers: HEADERS,
    signal: AbortSignal.timeout(TIMEOUT),
  });
}

function compact<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, entry]) =>
        entry !== undefined &&
        entry !== null &&
        entry !== "" &&
        !(Array.isArray(entry) && !entry.length),
    ),
  ) as Partial<T>;
}

function objects(value: unknown): any[] {
  return Array.isArray(value) ? value.filter((entry) => entry && typeof entry === "object") : [];
}

function names(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((entry) => String(entry).trim()).filter(Boolean))];
}

function image(url?: string | null) {
  return url ? imageUrl("mangaball", new URL(url, BASE_URL).href) : undefined;
}

function cover(source: any) {
  const path =
    typeof source === "string"
      ? source
      : [
          source?.cover?.path,
          source?.cover,
          source?.path,
          source?.file,
          source?.cdn_mangadex,
          source?.cdn_mangaupdate,
        ].find((entry) => typeof entry === "string" && entry.trim());
  if (!path) return undefined;
  return image(/^(?:https?:|\/)/.test(path) ? path : `${COVERS}${path}`);
}

function authors(item: any) {
  const seen = new Set<string>();
  return objects(item.authors ?? item.author).flatMap((person) => {
    const id = person._id ?? person.id;
    if (seen.has(id)) return [];
    seen.add(id);
    return [{ authors: person.name, id_authors: id }];
  });
}

function description(value: unknown) {
  if (Array.isArray(value)) return value.join("\n\n").trim();
  return typeof value === "string" ? value.trim() : undefined;
}

function toTitle(item: any) {
  const id = item._id ?? item.id;
  return compact({
    _id: id,
    title: item.name,
    alternateTitle: names(item.alternateName).join(" / "),
    thumbnail: cover(item.image ?? item.cover),
    tags: objects(item.tags).map((tag) => ({ tag: tag.name, id_tags: tag._id ?? tag.id })),
    authors: authors(item),
    status: STATUS[item.status] ?? item.status,
    slug: item.slug ? `${item.slug}-${id}` : id,
    description: description(item.description),
    originalLanguage: item.originalLanguage,
    updated_at: item.latest_chapter_at ?? item.updated_at,
    stats_count: item.stats,
    is18plus: item.is18plus,
  });
}

async function listing(path: string, params: Params) {
  const raw = await api(path, { ...params, adult_mode: ADULT_MODE });
  return { data: objects(raw.data).map(toTitle), pagination: raw.pagination };
}

function category(value?: string) {
  if (!value || value === "any" || value === "all") return undefined;
  return ORIGINS[value] ?? value;
}

function tagList(value: unknown) {
  return [value]
    .flat()
    .flatMap((entry) => (typeof entry === "string" ? entry.split(",") : []))
    .map((entry) => entry.trim())
    .filter(Boolean);
}

async function mapLimit<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>) {
  const results: R[] = [];
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function parseHome() {
  return listing("/title/featured", { limit: 10 });
}

function feed(name: "recommended" | "recently-updated" | "recently-added", params: Params) {
  return listing(`/title/${name}`, params);
}

function byOrigin(origin = "all") {
  return listing("/title/by-origin", { origin: category(origin) ?? "all", limit: 12 });
}

async function topChapters(time: string | undefined, limit = 12, titlesOnly = false) {
  const key = time || "day";
  if (!Object.hasOwn(PERIODS, key)) {
    throw new HttpError(400, "Query parameter 'time' must be one of day, week, month");
  }
  const { data } = await api("/chapter/top-views", {
    period: PERIODS[key],
    limit,
    adult_mode: ADULT_MODE,
  });
  const seen = new Set<string>();
  const entries = objects(data).filter((entry) => {
    if (!titlesOnly) return true;
    if (seen.has(entry.title_id)) return false;
    seen.add(entry.title_id);
    return true;
  });
  return {
    data: entries.map((entry) =>
      titlesOnly
        ? toTitle(entry)
        : compact({
            ...toTitle(entry),
            chapter_id: entry.chapter_id,
            chapter_number: entry.chapter_number,
            chapter_name: entry.chapter_name,
            views: entry.period_views ?? entry.views,
          }),
    ),
  };
}

function search(options: SearchOptions) {
  return listing("/title/search-advanced", {
    keyword: options.keyword,
    page: options.page ?? 1,
    limit: options.limit ?? 24,
    sort_by: options.sort ?? (options.keyword ? undefined : "lastupdate"),
    sort_order: options.order ?? "desc",
    type: category(options.type),
    status: options.status,
    publicationDemographic: options.demographic,
    included_tags: options.includedTags?.join(","),
    excluded_tags: options.excludedTags?.join(","),
    tag_mode: options.tagMode,
  });
}

function filters(query: Query) {
  const [, base, order] = /^(.*?)(?:_(asc|desc))?$/.exec(query.sort ?? "")!;
  const pick = (value?: string) => (value && value !== "any" ? value : undefined);
  return search({
    keyword: query.q,
    page: num(query.page, 1),
    limit: num(query.limit, 10, 1, 100),
    sort: base ? (SORTS[base] ?? base) : undefined,
    order: order ?? query.order ?? "desc",
    type: query.original_lang,
    status: pick(query.status),
    demographic: pick(query.demographic),
    includedTags: tagList(query.tag_included),
    excludedTags: tagList(query.tag_excluded),
    tagMode: query.tag_included_mode?.toUpperCase(),
  });
}

async function parseTags() {
  const { all } = await api("/tag/get-grouped");
  const data: Record<string, unknown[]> = {};
  for (const { _id, id, ...tag } of objects(all)) {
    (data[tag.group ?? "other"] ??= []).push({ ...tag, id_tags: _id ?? id });
  }
  return { data };
}

function formatNumber(value = 0) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

async function parseTagsDetail() {
  const { data } = await api("/tag/overview-stats");
  const overall = data?.overall ?? {};
  const groups: Record<string, any> = data?.groups ?? {};
  const info = (key: string) => {
    const group = groups[key];
    if (!group) return undefined;
    return {
      total_tags: String(group.tag_count ?? 0),
      total_title: formatNumber(group.total_manga),
      total_avg: `${group.percentage ?? 0}%`,
      tags: objects(group.tags).map((tag) => ({
        [key]: tag.name,
        count: formatNumber(tag.count),
        avg: `${tag.percent ?? 0}%`,
      })),
    };
  };
  return compact({
    tags_info: {
      total_tags: String(overall.total_tags ?? 0),
      total_title: formatNumber(overall.total_manga),
      top_genre: overall.top_genre ?? "",
      "avg/tag": formatNumber(overall.avg_per_tag),
      manga: formatNumber(overall.manga),
      manhwa: formatNumber(overall.manhwa),
      manhua: formatNumber(overall.manhua),
      comics: formatNumber(overall.comics),
    },
    genre_info: info("genre"),
    theme_info: info("theme"),
    format_info: info("format"),
    content_info: info("content"),
    origin_info: info("origin"),
    all_tags: Object.entries(groups).flatMap(([group, entry]) =>
      objects(entry.tags).map((tag) => ({
        id_tags: tag.id,
        name: tag.name,
        slug: tag.slug,
        group,
        count: tag.count,
      })),
    ),
  });
}

async function chapterGroups(id: string, language: string) {
  const page = (number: number) =>
    api("/title/chapter-listing", {
      title_id: id,
      page: number,
      limit: CHAPTER_PAGE_SIZE,
      group_by: "chapter",
      sort_order: "desc",
      language,
    });
  const first = await page(1);
  const pages = Array.from(
    { length: Math.max(0, (first.pagination?.total_pages ?? 1) - 1) },
    (_, index) => index + 2,
  );
  const rest = await mapLimit(pages, CHAPTER_CONCURRENCY, page);
  return [first, ...rest].flatMap((result) => objects(result.grouped_data));
}

function toChapter(group: any) {
  return {
    number: group.chapter_number,
    title: group.title,
    translations: objects(group.releases).map((release) =>
      compact({
        id_chapter: release._id ?? release.id,
        name: release.name,
        language: release.lang,
        volume: release.volume,
        date: release.created_at,
        views: release.views,
        group: release.group
          ? compact({
              id_group: release.group._id ?? release.group.id,
              name: release.group.name,
              icon: image(release.group.icon),
            })
          : undefined,
      }),
    ),
  };
}

function titleId(slug: string) {
  return (slug.match(/^([a-f\d]{24})(?:-|$)/i) ?? slug.match(/(?:^|-)([a-f\d]{24})$/i))?.[1];
}

async function buildDetail(slug: string, id: string | undefined, language: string) {
  const [detail, groups] = await Promise.all([
    api(`/title/detail/${encodeURIComponent(id ?? slug)}`),
    id ? chapterGroups(id, language) : undefined,
  ]);
  const title = detail?.data;
  if (!title) throw new HttpError(404, "Title not found");
  const chapters = groups ?? (await chapterGroups(title._id ?? title.id, language));

  return compact({
    _id: title._id ?? title.id,
    slug: title.slug ? `${title.slug}-${title._id ?? title.id}` : undefined,
    title: title.name,
    title_alter: names(title.alternateName),
    thumbnail: cover(title.image),
    description: description(title.description),
    status: STATUS[title.status] ?? title.status,
    originalLanguage: title.originalLanguage,
    year: title.date_published,
    genres: objects(title.tags).map((tag) => ({ name: tag.name, id_tags: tag._id ?? tag.id })),
    keywords: objects(title.keywords).map((keyword) => ({
      name: keyword.name,
      id_keywords: keyword._id ?? keyword.id,
    })),
    authors: authors(title),
    stars: title.ratings?.rating_average,
    likes: title.stats?.likes,
    views: title.stats?.views ?? title.views,
    bookmark: title.stats?.followers,
    is18plus: title.is18plus,
    chapters: {
      language,
      total_chapters: chapters.length,
      all_chapters: chapters.map(toChapter),
    },
  });
}

async function parseDetail(slug: string, language = "en") {
  const id = titleId(slug);
  const key = `mangaball:detail:${id ?? slug}:${language}`;
  return (await Cache.remember(key, DETAIL_TTL, () => buildDetail(slug, id, language))).data;
}

async function parseRead(chapterId: string) {
  const { data } = await api("/chapter-detail", { chapter_id: chapterId });
  const chapter = data?.chapter;
  if (!chapter) throw new HttpError(404, "Chapter not found");
  return compact({
    title_id: chapter.title_id,
    chapter_id: chapter.id,
    chapter_number: chapter.chapter_number == null ? undefined : String(chapter.chapter_number),
    chapter_volume: chapter.volume == null ? undefined : String(chapter.volume),
    chapter_language: chapter.lang,
    images: (Array.isArray(chapter.pages) ? chapter.pages : [])
      .filter((page: unknown) => typeof page === "string" && page)
      .map((page: string) => image(page)),
  });
}

function proxy(request: Request) {
  return proxyImage(request, `${BASE_URL}/`);
}

export const mangaball = {
  parseHome,
  feed,
  byOrigin,
  topChapters,
  search,
  filters,
  parseTags,
  parseTagsDetail,
  parseDetail,
  parseRead,
  proxy,
};
