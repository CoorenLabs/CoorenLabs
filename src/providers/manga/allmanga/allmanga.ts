import { createHash } from "node:crypto";
import { Cache } from "../../../core/cache";
import { allmanga as BASE_URL, allmanga_api as API_URL } from "../../origins";
import { getJson, HttpError, imageUrl, proxyImage, USER_AGENT } from "../shared";

const PROVIDER = "allmanga";
const LABEL = "AllManga";
const CDN = "https://wp.youtube-anime.com/aln.youtube-anime.com";
const HOME_TTL = 1800;
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
const CHAPTER_PAGES_HASH = "a062f1b131dae3d17c1950fad14640d066b988ac10347ed49cfbe70f5e7f661b";

type Query = keyof typeof QUERIES;
type GraphQLResponse = { data?: any; errors?: { message?: string }[] };
type Tag = { name: string; slug: string; tagType: string | null; mangaCount: number };

const HASHES = Object.fromEntries(
  Object.entries(QUERIES).map(([name, query]) => [
    name,
    createHash("sha256").update(query).digest("hex"),
  ]),
) as Record<Query, string>;

async function execute(sha256Hash: string, variables: Record<string, unknown>, query?: string) {
  const extensions = { persistedQuery: { version: 1, sha256Hash } };
  const params = new URLSearchParams({
    variables: JSON.stringify(variables),
    extensions: JSON.stringify(extensions),
  });
  let body = await getJson<GraphQLResponse>(LABEL, `${API_URL}?${params}`, { headers: HEADERS });
  if (query && body.errors?.some((error) => error.message === "PersistedQueryNotFound")) {
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

function gql(name: Query, variables: Record<string, unknown>) {
  return execute(HASHES[name], variables, QUERIES[name]);
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

function resolve(path: string, head = CDN) {
  if (/^https?:\/\//.test(path)) return path;
  return `${head.replace(/\/$/, "")}/${path.replace(/^\/+/, "")}`;
}

function cover(thumbnail?: string | null) {
  if (!thumbnail) return null;
  const url = /^https?:\/\//.test(thumbnail) ? thumbnail : `${resolve(thumbnail)}?w=250`;
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

async function parseRead(chapterId: string) {
  const [mangaId, translationType = "sub", chapterString = "1"] = chapterId.split(":");
  const { chapterPages } = await execute(CHAPTER_PAGES_HASH, {
    mangaId,
    translationType,
    chapterString,
    limit: 10,
    offset: 0,
  });
  const source = chapterPages?.edges?.[0];
  if (!source?.pictureUrls?.length) throw new HttpError(404, "Chapter pages not found");
  return {
    provider: LABEL,
    id: chapterId,
    pages: source.pictureUrls.map((picture: { url: string; num: number }) => ({
      page: picture.num + 1,
      img: imageUrl(PROVIDER, resolve(picture.url, source.pictureUrlHead || CDN)),
    })),
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
