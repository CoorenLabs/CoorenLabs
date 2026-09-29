import { getJson, HttpError, imageUrl, proxyImage, USER_AGENT } from "../shared";

const BASE_URL = "https://atsu.moe";
const CDN = "https://cdn.atsu.moe/static";
const PAGE_SIZE = 40;
const DEFAULT_TYPES = "Manga,Manwha,Manhua,OEL";
const HEADERS = { Accept: "application/json", "User-Agent": USER_AGENT, Referer: `${BASE_URL}/` };
const SEARCH = {
  q: "*",
  query_by: "title,englishTitle,otherNames,authors,acronyms",
  include_fields: "id,title,poster,posterSmall,posterMedium,type,isAdult",
  sort_by: "views:desc",
};

export type Section =
  | "trending"
  | "mostBookmarked"
  | "recentlyUpdated"
  | "topRated"
  | "popular"
  | "recentlyAdded";

type ExploreFilter = {
  genres?: string;
  types?: string;
  statuses?: string;
  page: number;
  adult: boolean;
};

function get<T = any>(path: string, params?: Record<string, string>, rejectsInput = false) {
  const query = params ? `?${new URLSearchParams(params)}` : "";
  return getJson<T>("Atsu", `${BASE_URL}${path}${query}`, { headers: HEADERS }, rejectsInput);
}

function image(path?: string | null) {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return imageUrl("atsu", path);
  return imageUrl("atsu", `${CDN}/${path.replace(/^\/+/, "").replace(/^static\//, "")}`);
}

function toItem(item: any) {
  return {
    id: item.id,
    title: item.title,
    thumbnail: image(item.image ?? item.poster),
    images: {
      small: image(item.smallImage ?? item.posterSmall),
      medium: image(item.mediumImage ?? item.posterMedium),
      large: image(item.largeImage ?? item.image ?? item.poster),
    },
    type: item.type,
    isAdult: item.isAdult ?? false,
  };
}

function list(value?: string) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function quote(value: string) {
  return `\`${value.replace(/`/g, "\\`")}\``;
}

async function parseHome(adult = false) {
  const { homePage } = await get("/api/home/page", adult ? { adult: "1" } : undefined);
  const result: Record<string, { title: string; items: ReturnType<typeof toItem>[] }> = {};
  for (const section of homePage?.sections ?? []) {
    if (section.layout !== "carousel") continue;
    result[section.key] = { title: section.title, items: (section.items ?? []).map(toItem) };
  }
  return result;
}

async function fetchSection(
  section: Section,
  page: number,
  adult: boolean,
  { types, timeframe }: { types?: string; timeframe?: string } = {},
) {
  const params: Record<string, string> =
    section === "topRated"
      ? { offset: String(page * PAGE_SIZE), limit: String(PAGE_SIZE) }
      : { page: String(page) };
  params.types = types || DEFAULT_TYPES;
  if (timeframe) params.timeframe = timeframe;
  if (adult) params.adult = "1";
  const { items } = await get(
    `/api/${section === "topRated" ? "home2" : "infinite"}/${section}`,
    params,
    true,
  );
  return { page, items: (items ?? []).map(toItem) };
}

async function fetchMangaDetails(id: string) {
  const [page, all] = await Promise.all([
    get("/api/manga/page", { id }),
    get("/api/manga/allChapters", { mangaId: id }).catch(() => null),
  ]);
  const manga = page?.mangaPage;
  if (!manga) throw new HttpError(404, "Manga not found");

  const chapters: any[] = all?.chapters?.length ? all.chapters : (manga.chapters ?? []);
  const scanlators = new Map<string, string>(
    (manga.scanlators ?? []).map((scan: any) => [scan.id, scan.name]),
  );

  return {
    id: manga.id,
    title: manga.title,
    englishTitle: manga.englishTitle || null,
    altTitles: manga.otherNames || [],
    synopsis: manga.synopsis || "",
    type: manga.type,
    isAdult: manga.isAdult ?? false,
    status: manga.status || "Unknown",
    genres: (manga.genres ?? []).map((genre: any) => ({ genre: genre.name, slug: genre.id })),
    authors: (manga.authors ?? []).map((author: any) => ({
      author: author.name,
      slug: author.slug || author.id,
      role: author.type || "Author",
    })),
    scanlators: manga.scanlators || [],
    poster: image(manga.poster?.image || manga.poster?.id),
    banner: image(manga.banner?.url),
    rating: manga.avgRating || null,
    views: manga.views || null,
    totalChapters: manga.totalChapterCount || chapters.length,
    chapters: chapters.map((chapter) => {
      const scanId = chapter.scanlationMangaId || chapter.scanId || null;
      return {
        id: chapter.id,
        title: chapter.title || `Chapter ${chapter.number}`,
        number: chapter.number,
        pages: chapter.pageCount,
        createdAt: chapter.createdAt,
        scanId,
        scanlator: (scanId && scanlators.get(scanId)) || "Unknown",
      };
    }),
  };
}

async function fetchChapterInfo(id: string) {
  const info = await get("/api/manga/info", { mangaId: id });
  if (!info?.id) throw new HttpError(404, "Info not found");
  return {
    id: info.id,
    title: info.title,
    type: info.type,
    chapters: (info.chapters ?? []).map((chapter: any) => ({
      id: chapter.id,
      title: chapter.title || `Chapter ${chapter.number}`,
      number: chapter.number,
      pages: chapter.pageCount,
      scanId: chapter.scanId,
    })),
  };
}

async function fetchChapterPages(mangaId: string, chapterId: string) {
  const { readChapter: chapter } = await get("/api/read/chapter", { mangaId, chapterId });
  if (!chapter) throw new HttpError(404, "Chapter not found");
  return {
    id: chapter.id,
    title: chapter.title,
    pages: (chapter.pages ?? []).map((page: any) => ({
      img: image(page.image),
      page: page.number,
    })),
  };
}

async function fetchFilters() {
  const data = await get("/api/explore/availableFilters");
  const options = (entries: any[] = []) =>
    entries.map((entry) => ({ name: entry.name, slug: entry.id }));
  return {
    genres: options(data.genres),
    types: options(data.types),
    statuses: options(data.statuses),
  };
}

async function explore({ genres, types, statuses, page, adult }: ExploreFilter) {
  const typeList = list(types);
  const statusList = list(statuses);
  const filters = [
    ...list(genres).map((genre) => `genreIds:=${quote(genre)}`),
    `type:=[${(typeList.length ? typeList : list(DEFAULT_TYPES)).map(quote).join(",")}]`,
    ...(statusList.length ? [`status:=[${statusList.map(quote).join(",")}]`] : []),
    `isAdult:=${adult}`,
    "views:>0",
    "hidden:!=true",
  ];
  const { hits } = await get("/collections/manga/documents/search", {
    ...SEARCH,
    filter_by: filters.join(" && "),
    page: String(page + 1),
    per_page: String(PAGE_SIZE),
  });
  return { page, items: (hits ?? []).map((hit: any) => toItem(hit.document)) };
}

async function fetchAuthor(slug: string, page: number, type: string | undefined, adult: boolean) {
  const data = await get(
    "/api/browse/author",
    { authorSlug: slug, page: String(page), ...(type && { type }) },
    true,
  );
  if (!data?.author) throw new HttpError(404, "Author not found");
  const items: any[] = data.items ?? [];
  return {
    author: data.author.name || slug,
    role: type || "Any",
    page,
    items: (adult ? items : items.filter((item) => !item.isAdult)).map(toItem),
  };
}

function proxy(request: Request) {
  return proxyImage(request, `${BASE_URL}/`, (url) => {
    if (url.hostname === "atsu.moe") url.hostname = "cdn.atsu.moe";
  });
}

export const atsu = {
  parseHome,
  fetchSection,
  fetchMangaDetails,
  fetchChapterInfo,
  fetchChapterPages,
  fetchFilters,
  explore,
  fetchAuthor,
  proxy,
};
