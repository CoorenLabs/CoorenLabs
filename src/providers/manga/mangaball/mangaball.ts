import axios, { type AxiosInstance } from "axios";
import * as cheerio from "cheerio";

export const MANGABALL_CDN_HOSTS = [
  "https://mangaball.net",
  "https://bulbasaur.poke-black-and-white.net",
  "https://heracross.red-and-blue.net",
];

const MANGABALL_CHAPTER_ORIGINS = [
  "https://mangaball.net",
  "https://bulbasaur.poke-black-and-white.net",
  "https://heracross.red-and-blue.net",
];

import { mangaball as BASE_URL } from "../../origins";
const BASE_API_TITLE = `${BASE_URL}/api/v1/title/search/`;
const BASE_API_SEARCH = `${BASE_URL}/api/v1/title/search-advanced/`;
const BASE_API_TAG = `${BASE_URL}/api/v1/tag/search/`;
const BASE_API_TAG_STATS = `${BASE_URL}/api/v1/tag/stats/`;
const BASE_API_CHAPTER = `${BASE_URL}/api/v1/chapter/chapter-listing-by-title-id/`;
const BASE_API_PERSON = `${BASE_URL}/api/v1/person/search/`;

const DEFAULT_HEADERS = {
  "accept": "*/*",
  "accept-language": "en-US,en;q=0.9",
  "sec-ch-ua": '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
};

// ─── helpers ────────────────────────────────────────────────────────────────

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function cleanHtml(html: string): string {
  if (!html) return "";
  const $ = cheerio.load(html);
  return cleanText($.text());
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function removeEmpty<T>(data: T): T {
  if (Array.isArray(data)) {
    const cleaned = (data as unknown[])
      .map((v) => removeEmpty(v))
      .filter((v) => v !== null && v !== "" && !(Array.isArray(v) && v.length === 0) && !(typeof v === "object" && v !== null && Object.keys(v).length === 0));
    return cleaned as unknown as T;
  }
  if (typeof data === "object" && data !== null) {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      const cleaned = removeEmpty(v);
      if (cleaned !== null && cleaned !== "" && !(Array.isArray(cleaned) && cleaned.length === 0) && !(typeof cleaned === "object" && cleaned !== null && Object.keys(cleaned).length === 0)) {
        result[k] = cleaned;
      }
    }
    return result as T;
  }
  return data;
}

function proxyImage(url: string, baseApiUrl: string): string {
  if (!url || !baseApiUrl) return url;
  const root = baseApiUrl.replace(/\/$/, "");
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const parsed = new URL(url);
      const path = `${parsed.hostname}${parsed.pathname}`;
      return `${root}/image/${path}`;
    } catch {
      return url;
    }
  }
  if (url.startsWith("/")) return `${root}/image${url}`;
  return url;
}

function stripMarkers(text: string): string {
  return cleanText(text.replace(/#\s+\w[\w\s]*/g, ""));
}

function extractSlugFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/$/, "");
    if (path.includes("title-detail/")) {
      return path.split("title-detail/").pop() ?? "";
    }
    return path.split("/").pop() ?? "";
  } catch {
    const path = url.replace(/\/$/, "");
    if (path.includes("title-detail/")) {
      return path.split("title-detail/").pop() ?? "";
    }
    return path.split("/").pop() ?? "";
  }
}

// ─── parser ─────────────────────────────────────────────────────────────────

export class MangaballParser {
  private http: AxiosInstance;
  private csrfToken: string | null = null;
  private cookies: Record<string, string> = {};

  constructor() {
    this.http = axios.create({
      withCredentials: true,
      headers: DEFAULT_HEADERS,
      timeout: 15_000,
    });

    // Manually extract and store cookies (Fixes Bun + CookieJar compatibility issues)
    this.http.interceptors.response.use((response) => {
      this.extractCookies(response.headers["set-cookie"]);
      return response;
    });
  }

  private extractCookies(setCookieHeader: string[] | string | undefined) {
    if (!setCookieHeader) return;
    const cookiesArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];

    for (const cookieStr of cookiesArray) {
      // Bun sometimes merges multiple set-cookie headers into one comma-separated string.
      const individualCookies = cookieStr.split(/,(?=\s*[a-zA-Z0-9_-]+=)/);
      for (const c of individualCookies) {
        const match = c.match(/^([^=]+)=([^;]+)/);
        if (match) {
          this.cookies[match[1].trim()] = match[2].trim();
        }
      }
    }
  }

  // ── CSRF ────────────────────────────────────────────────────────────────

  private async getCsrfToken(): Promise<string | null> {
    if (this.csrfToken) return this.csrfToken;
    try {
      const resp = await this.http.get(BASE_URL);
      const html: string = resp.data;
      const patterns = [
        /<meta\s+name="csrf-token"\s+content="([a-fA-F0-9]+)"/i,
        /<meta\s+content="([a-fA-F0-9]+)"\s+name="csrf-token"/i,
        /"csrf_token"\s*:\s*"([a-fA-F0-9]+)"/,
        /'csrf_token'\s*:\s*'([a-fA-F0-9]+)'/,
        /name=["']_token["']\s+value=["']([a-fA-F0-9]+)["']/,
        /value=["']([a-fA-F0-9]+)["']\s+name=["']_token["']/,
        /csrfToken["']?\s*:\s*["']([a-fA-F0-9]+)["']/,
      ];
      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) {
          this.csrfToken = match[1];
          return this.csrfToken;
        }
      }
    } catch {
      // ignore
    }
    return null;
  }

  private resetToken(): void {
    this.csrfToken = null;
    this.cookies = {};
  }

  // ── core POST helper ────────────────────────────────────────────────────

  private async postApi(
    url: string,
    body: string,
    referer?: string
  ): Promise<Record<string, unknown>> {
    const csrf = await this.getCsrfToken();
    if (!csrf) return { error: "Failed to get CSRF token" };

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-CSRF-TOKEN": csrf,
      "X-Requested-With": "XMLHttpRequest",
      Accept: "*/*",
      Origin: BASE_URL,
      Referer: referer ?? `${BASE_URL}/`,
    };

    const cookieStr = ["show18PlusContent=true", ...Object.entries(this.cookies).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)].join("; ");

    try {
      const resp = await this.http.post(url, body, {
        headers: { ...headers, Cookie: cookieStr },
      });
      return resp.data as Record<string, unknown>;
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 403 || status === 419) {
        this.resetToken();
        const csrf2 = await this.getCsrfToken();
        if (csrf2) {
          try {
            const cookieStr2 = ["show18PlusContent=true", ...Object.entries(this.cookies).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)].join("; ");
            const resp2 = await this.http.post(url, body, {
              headers: { ...headers, "X-CSRF-TOKEN": csrf2, Cookie: cookieStr2 },
            });
            return resp2.data as Record<string, unknown>;
          } catch {
            // fall through
          }
        }
      }
      const msg = err instanceof Error ? err.message : String(err);
      return { error: msg };
    }
  }

  private async postJsonApi(
    url: string,
    payload: Record<string, unknown>,
    referer?: string
  ): Promise<Record<string, unknown>> {
    const csrf = await this.getCsrfToken();
    if (!csrf) return { error: "Failed to get CSRF token" };

    const headers = {
      "Content-Type": "application/json",
      "X-CSRF-TOKEN": csrf,
      "X-Requested-With": "XMLHttpRequest",
      Accept: "*/*",
      Origin: BASE_URL,
      Referer: referer ?? `${BASE_URL}/`,
    };

    const cookieStr = ["show18PlusContent=true", ...Object.entries(this.cookies).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)].join("; ");

    try {
      const resp = await this.http.post(url, payload, {
        headers: { ...headers, Cookie: cookieStr }
      });
      return resp.data as Record<string, unknown>;
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 403 || status === 419) {
        this.resetToken();
        const csrf2 = await this.getCsrfToken();
        if (csrf2) {
          try {
            const cookieStr2 = ["show18PlusContent=true", ...Object.entries(this.cookies).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)].join("; ");
            const resp2 = await this.http.post(url, payload, {
              headers: { ...headers, "X-CSRF-TOKEN": csrf2, Cookie: cookieStr2 },
            });
            return resp2.data as Record<string, unknown>;
          } catch {
            // fall through
          }
        }
      }
      const msg = err instanceof Error ? err.message : String(err);
      return { error: msg };
    }
  }

  // ── transform helpers ───────────────────────────────────────────────────

  private transformTitleItem(item: Record<string, unknown>, baseApiUrl: string): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    if ("_id" in item) result._id = item._id;

    result.title = item.name ?? "";
    const altRaw = (item.alternateName as string) ?? "";
    result.alternateTitle = altRaw ? cleanHtml(altRaw) : "";

    const cover = (item.cover as string) ?? "";
    result.thumbnail = cover ? proxyImage(cover, baseApiUrl) : "";

    const bg = (item.background as string) ?? "";
    result.background = bg ? proxyImage(bg, baseApiUrl) : "";

    const tagsHtml = (item.tags as string) ?? "";
    const tags: Array<{ tag: string; id_tags: string }> = [];
    if (tagsHtml) {
      const $ = cheerio.load(tagsHtml);
      $("[data-tag-id]").each((_, el) => {
        tags.push({
          tag: cleanText($(el).text()),
          id_tags: $(el).attr("data-tag-id") ?? "",
        });
      });
    }
    result.tags = tags;

    const authorsHtml = (item.authors as string) ?? "";
    const authors: Array<{ authors: string; id_authors: string }> = [];
    if (authorsHtml) {
      const $ = cheerio.load(authorsHtml);
      $("[data-person-id]").each((_, el) => {
        authors.push({
          authors: cleanText($(el).text()),
          id_authors: $(el).attr("data-person-id") ?? "",
        });
      });
    }
    result.authors = authors;

    const statusHtml = (item.status as string) ?? "";
    result.status = statusHtml ? cleanHtml(statusHtml) : "";

    const url = (item.url as string) ?? "";
    if (url) result.slug = extractSlugFromUrl(url);

    const descHtml = (item.description as string) ?? "";
    result.description = descHtml ? cleanHtml(descHtml) : "";

    if ("updated_at" in item) result.updated_at = item.updated_at;

    const flag = (item.languageFlag as string) ?? "";
    result.languageFlag = flag ? proxyImage(flag, baseApiUrl) : "";

    if ("stats_count" in item) result.stats_count = item.stats_count;

    return removeEmpty(result);
  }

  private transformTitleList(raw: Record<string, unknown>, baseApiUrl: string): Record<string, unknown> {
    const items = Array.isArray(raw.data) ? (raw.data as Record<string, unknown>[]) : [];
    const transformed = items.map((item) => this.transformTitleItem(item, baseApiUrl));
    const result: Record<string, unknown> = { data: transformed };
    if (raw.pagination && typeof raw.pagination === "object") result.pagination = raw.pagination;
    return result;
  }

  private transformTags(raw: Record<string, unknown>): Record<string, unknown> {
    const data = (raw.data ?? {}) as Record<string, unknown>;
    const result: Record<string, unknown[]> = {};
    for (const [group, items] of Object.entries(data)) {
      if (Array.isArray(items)) {
        result[group] = (items as Record<string, unknown>[]).map((item) => {
          const renamed: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(item)) {
            renamed[k === "_id" ? "id_tags" : k] = v;
          }
          return renamed;
        });
      }
    }
    return { data: result };
  }

  private transformTagsDetail(raw: Record<string, unknown>): Record<string, unknown> {
    const items = Array.isArray(raw.data) ? (raw.data as Record<string, unknown>[]) : [];
    const allTags = items.map((item) => {
      const renamed: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(item)) {
        renamed[k === "_id" ? "id_tags" : k] = v;
      }
      return renamed;
    });

    const groups: Record<string, typeof allTags> = {};
    for (const tag of allTags) {
      const g = (tag.group as string) ?? "other";
      if (!groups[g]) groups[g] = [];
      groups[g].push(tag);
    }

    const grandTotal = allTags.reduce((sum, t) => sum + (((t.stats as Record<string, number>) ?? {}).title ?? 0), 0);
    const totalTagsCount = allTags.length;

    const makeInfo = (groupName: string, fieldKey: string): Record<string, unknown> => {
      const groupItems = groups[groupName] ?? [];
      const totalT = groupItems.length;
      const totalTitle = groupItems.reduce((s, t) => s + (((t.stats as Record<string, number>) ?? {}).title ?? 0), 0);
      const totalAvg = grandTotal > 0 ? `${((totalTitle / grandTotal) * 100).toFixed(1)}%` : "0%";
      const sorted = [...groupItems].sort(
        (a, b) => (((b.stats as Record<string, number>) ?? {}).title ?? 0) - (((a.stats as Record<string, number>) ?? {}).title ?? 0)
      );
      const tagList = sorted.map((t) => {
        const count = (((t.stats as Record<string, number>) ?? {}).title ?? 0);
        const avg = totalTitle > 0 ? `${((count / totalTitle) * 100).toFixed(1)}%` : "0%";
        return { [fieldKey]: t.name ?? "", count: formatNumber(count), avg };
      });
      return { total_tags: String(totalT), total_title: formatNumber(totalTitle), total_avg: totalAvg, tags: tagList };
    };

    const genreTags = groups.genre ?? [];
    const topGenreTag = genreTags.reduce<typeof allTags[number] | null>(
      (best, t) => {
        const c = (((t.stats as Record<string, number>) ?? {}).title ?? 0);
        const bc = best ? (((best.stats as Record<string, number>) ?? {}).title ?? 0) : -1;
        return c > bc ? t : best;
      },
      null
    );

    const originMap: Record<string, number> = {};
    for (const t of groups.origin ?? []) {
      originMap[(t.slug as string) ?? ""] = (((t.stats as Record<string, number>) ?? {}).title ?? 0);
    }

    return removeEmpty({
      tags_info: {
        total_tags: String(totalTagsCount),
        total_title: formatNumber(grandTotal),
        top_genre: topGenreTag?.name ?? "",
        "avg/tag": totalTagsCount > 0 ? formatNumber(Math.floor(grandTotal / totalTagsCount)) : "0",
        manga: formatNumber(originMap.manga ?? 0),
        manhwa: formatNumber(originMap.manhwa ?? 0),
        manhua: formatNumber(originMap.manhua ?? 0),
        comics: formatNumber(originMap.comic ?? originMap.comics ?? 0),
      },
      genre_info: makeInfo("genre", "genre"),
      theme_info: makeInfo("theme", "theme"),
      format_info: makeInfo("format", "format"),
      content_info: makeInfo("content", "content"),
      origin_info: makeInfo("origin", "origin"),
      all_tags: allTags,
    });
  }

  private transformChapters(chapters: Record<string, unknown>, baseApiUrl: string): Record<string, unknown> {
    const allChapters = Array.isArray(chapters.ALL_CHAPTERS)
      ? (chapters.ALL_CHAPTERS as Record<string, unknown>[])
      : [];

    for (const chapter of allChapters) {
      const translations = Array.isArray(chapter.translations)
        ? (chapter.translations as Record<string, unknown>[])
        : [];
      for (const trans of translations) {
        if ("id" in trans) {
          trans.id_chapter = trans.id;
          delete trans.id;
        }
        const group = trans.group as Record<string, unknown> | undefined;
        if (group && typeof group === "object") {
          if ("_id" in group) {
            group.id_tags = group._id;
            delete group._id;
          }
          if (group.icon) group.icon = proxyImage(group.icon as string, baseApiUrl);
        }
        delete trans.url;
      }
    }

    const result: Record<string, unknown> = {};
    if ("TOTAL_CHAPTERS" in chapters) result.total_chapters = chapters.TOTAL_CHAPTERS;
    if ("ALL_CHAPTERS" in chapters) result.all_chapters = allChapters;
    for (const [k, v] of Object.entries(chapters)) {
      if (!["code", "message", "TOTAL_CHAPTERS", "ALL_CHAPTERS"].includes(k)) result[k] = v;
    }
    return result;
  }

  // ── build advanced search payload ───────────────────────────────────────

  private buildAdvancedPayload(opts: {
    q?: string;
    sort?: string;
    page?: number;
    limit?: number;
    tagIncluded?: string[];
    tagIncludedMode?: string;
    tagExcluded?: string[];
    tagExcludedMode?: string;
    demographic?: string;
    person?: string;
    originalLang?: string;
    publicationStatus?: string;
    translatedLang?: string[];
  }): string {
    const {
      q = "",
      sort = "updated_chapters_desc",
      page = 1,
      limit = 24,
      tagIncluded = [],
      tagIncludedMode = "and",
      tagExcluded = [],
      tagExcludedMode = "and",
      demographic = "any",
      person = "any",
      originalLang = "any",
      publicationStatus = "any",
      translatedLang = [],
    } = opts;

    const enc = encodeURIComponent;
    const parts: string[] = [
      `search_input=${enc(q)}`,
      `filters%5Bsort%5D=${enc(sort)}`,
      `filters%5Bpage%5D=${page}`,
      `filters%5Bsearch_limit%5D=${limit}`,
    ];
    for (const id of tagIncluded) parts.push(`filters%5Btag_included_ids%5D%5B%5D=${enc(id)}`);
    parts.push(`filters%5Btag_included_mode%5D=${enc(tagIncludedMode)}`);
    for (const id of tagExcluded) parts.push(`filters%5Btag_excluded_ids%5D%5B%5D=${enc(id)}`);
    parts.push(
      `filters%5Btag_excluded_mode%5D=${enc(tagExcludedMode)}`,
      `filters%5BcontentRating%5D=any`,
      `filters%5Bdemographic%5D=${enc(demographic)}`,
      `filters%5Bperson%5D=${enc(person)}`,
      `filters%5BoriginalLanguages%5D=${enc(originalLang)}`,
      `filters%5BpublicationYear%5D=`,
      `filters%5BpublicationStatus%5D=${enc(publicationStatus)}`
    );
    for (const lang of translatedLang) parts.push(`filters%5BtranslatedLanguage%5D%5B%5D=${enc(lang)}`);
    parts.push(`filters%5BuserSettingsEnabled%5D=false`);
    return parts.join("&");
  }

  // ── public parse methods ────────────────────────────────────────────────

  async parseRecommendation(baseApiUrl = "", limit = 12): Promise<Record<string, unknown>> {
    const raw = await this.postApi(BASE_API_TITLE, `search_type=getRecommend&search_limit=${limit}`);
    if ("error" in raw) return raw;
    return this.transformTitleList(raw, baseApiUrl);
  }

  async parseHome(baseApiUrl = ""): Promise<Record<string, unknown>> {
    const raw = await this.postApi(BASE_API_TITLE, "search_type=getFeatured&search_limit=10");
    if ("error" in raw) return raw;
    return this.transformTitleList(raw, baseApiUrl);
  }

  async parseLatest(baseApiUrl = "", page = 1, limit = 24): Promise<Record<string, unknown>> {
    const raw = await this.postApi(BASE_API_TITLE, `search_type=getLatestTable&search_limit=${limit}&page=${page}`);
    if ("error" in raw) return raw;
    return this.transformTitleList(raw, baseApiUrl);
  }

  async parseForYou(time = "day", baseApiUrl = "", limit = 12): Promise<Record<string, unknown>> {
    const raw = await this.postApi(BASE_API_TITLE, `search_type=getRecentRead&search_limit=${limit}&search_time=${time}`);
    if ("error" in raw) return raw;
    return this.transformTitleList(raw, baseApiUrl);
  }

  async parseRecent(time = "day", baseApiUrl = "", limit = 12): Promise<Record<string, unknown>> {
    const raw = await this.postApi(BASE_API_TITLE, `search_type=getRecentChapterRead&search_limit=${limit}&search_time=${time}`);
    if ("error" in raw) return raw;
    return this.transformTitleList(raw, baseApiUrl);
  }

  async parsePopular(baseApiUrl = "", limit = 24): Promise<Record<string, unknown>> {
    const raw = await this.postApi(BASE_API_TITLE, `search_type=getPopular&search_limit=${limit}`);
    if ("error" in raw) return raw;
    return this.transformTitleList(raw, baseApiUrl);
  }

  async parseOrigin(origin = "all", baseApiUrl = ""): Promise<Record<string, unknown>> {
    const raw = await this.postApi(BASE_API_TITLE, `search_type=getByOrigin&search_limit=12&search_origin=${origin}`);
    if ("error" in raw) return raw;
    return this.transformTitleList(raw, baseApiUrl);
  }

  async parseAdded(page = 1, baseApiUrl = "", limit = 24): Promise<Record<string, unknown>> {
    const raw = await this.postApi(BASE_API_TITLE, `search_type=getRecentlyAdded&page=${page}&search_limit=${limit}`);
    if ("error" in raw) return raw;
    return this.transformTitleList(raw, baseApiUrl);
  }

  async parseNewChap(page = 1, baseApiUrl = "", limit = 24): Promise<Record<string, unknown>> {
    const raw = await this.postApi(BASE_API_TITLE, `search_type=getRecentlyUpdatedChapter&page=${page}&search_limit=${limit}`);
    if ("error" in raw) return raw;
    return this.transformTitleList(raw, baseApiUrl);
  }

  async parseTagsById(idTags: string, page = 1, baseApiUrl = ""): Promise<Record<string, unknown>> {
    const raw = await this.postApi(BASE_API_TITLE, `search_type=getTitlesByTagId-${idTags}&page=${page}`);
    if ("error" in raw) return raw;
    return this.transformTitleList(raw, baseApiUrl);
  }

  async parseKeyword(idKeyword: string, page = 1, baseApiUrl = ""): Promise<Record<string, unknown>> {
    const raw = await this.postApi(BASE_API_TITLE, `search_type=getTitlesByKeywordId-${idKeyword}&page=${page}`);
    if ("error" in raw) return raw;
    return this.transformTitleList(raw, baseApiUrl);
  }

  async parsePerson(idPerson: string, page = 1, baseApiUrl = ""): Promise<Record<string, unknown>> {
    const raw = await this.postApi(BASE_API_TITLE, `search_type=getTitlesByPersonId-${idPerson}&page=${page}`);
    if ("error" in raw) return raw;
    return this.transformTitleList(raw, baseApiUrl);
  }

  async parsePersonSearch(query: string): Promise<Record<string, unknown>> {
    const raw = await this.postJsonApi(BASE_API_PERSON, { q: query });
    if ("error" in raw) return raw;
    const items = Array.isArray(raw.data) ? (raw.data as Record<string, unknown>[]) : [];
    return {
      data: items.map((item) => {
        const { _id, ...rest } = item;
        return { ...rest, id_person: _id ?? "" };
      }),
    };
  }

  async parseSearch(query: string, page = 1, baseApiUrl = "", limit = 24): Promise<Record<string, unknown>> {
    const enc = encodeURIComponent;
    const body =
      `search_input=${enc(query)}&` +
      `filters%5Bsort%5D=updated_chapters_desc&` +
      `filters%5Bpage%5D=${page}&` +
      `filters%5Bsearch_limit%5D=${limit}&` +
      `filters%5Btag_included_mode%5D=and&` +
      `filters%5Btag_excluded_mode%5D=and&` +
      `filters%5BcontentRating%5D=any&` +
      `filters%5Bdemographic%5D=any&` +
      `filters%5Bperson%5D=any&` +
      `filters%5BoriginalLanguages%5D=any&` +
      `filters%5BpublicationYear%5D=&` +
      `filters%5BpublicationStatus%5D=any&` +
      `filters%5BuserSettingsEnabled%5D=false`;
    const raw = await this.postApi(BASE_API_SEARCH, body, `${BASE_URL}/search-advanced?search_input=${enc(query)}`);
    if ("error" in raw) return raw;
    return this.transformTitleList(raw, baseApiUrl);
  }

  async parseFilters(opts: {
    baseApiUrl?: string;
    q?: string;
    sort?: string;
    page?: number;
    limit?: number;
    tagIncluded?: string[];
    tagIncludedMode?: string;
    tagExcluded?: string[];
    tagExcludedMode?: string;
    demographic?: string;
    person?: string;
    originalLang?: string;
    publicationStatus?: string;
    translatedLang?: string[];
  }): Promise<Record<string, unknown>> {
    const { baseApiUrl = "", ...rest } = opts;
    const body = this.buildAdvancedPayload(rest);
    const raw = await this.postApi(BASE_API_SEARCH, body, `${BASE_URL}/search-advanced`);
    if ("error" in raw) return raw;
    return this.transformTitleList(raw, baseApiUrl);
  }

  async parseAdvanced(opts: {
    baseApiUrl?: string;
    page?: number;
    limit?: number;
    originalLang?: string;
    publicationStatus?: string;
  }): Promise<Record<string, unknown>> {
    const { baseApiUrl = "", page = 1, limit = 24, originalLang = "any", publicationStatus = "any" } = opts;
    const body = this.buildAdvancedPayload({ page, limit, originalLang, publicationStatus });
    const raw = await this.postApi(BASE_API_SEARCH, body, `${BASE_URL}/search-advanced`);
    if ("error" in raw) return raw;
    return this.transformTitleList(raw, baseApiUrl);
  }

  async parseTags(): Promise<Record<string, unknown>> {
    const raw = await this.postApi(BASE_API_TAG, "search_type=getTagFilter", `${BASE_URL}/search-advanced`);
    if ("error" in raw) return raw;
    return this.transformTags(raw);
  }

  async parseTagsDetail(): Promise<Record<string, unknown>> {
    const csrf = await this.getCsrfToken();
    if (!csrf) return { error: "Failed to get CSRF token" };
    try {
      const cookieStr = ["show18PlusContent=true", ...Object.entries(this.cookies).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)].join("; ");
      const resp = await this.http.post(BASE_API_TAG_STATS, "", {
        headers: {
          "Content-Length": "0",
          "X-CSRF-TOKEN": csrf,
          "X-Requested-With": "XMLHttpRequest",
          Accept: "*/*",
          Origin: BASE_URL,
          Referer: `${BASE_URL}/genres/`,
          Cookie: cookieStr,
        },
      });
      const raw = resp.data as Record<string, unknown>;
      if ("error" in raw) return raw;
      return this.transformTagsDetail(raw);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { error: msg };
    }
  }

  async parseDetail(slug: string, baseApiUrl = ""): Promise<Record<string, unknown>> {
    const url = `${BASE_URL}/title-detail/${slug}/`;
    let html: string;
    try {
      const resp = await this.http.get(url, { headers: { Referer: `${BASE_URL}/` } });
      html = resp.data as string;
    } catch {
      return { error: "Failed to fetch detail page" };
    }

    const $ = cheerio.load(html);

    const data: Record<string, unknown> = {
      title: "",
      title_alter: [] as string[],
      thumbnail: "",
      status: "",
      genres: [] as Array<{ name: string; id_tags: string }>,
      keywords: [] as Array<{ name: string; id_keywords: string }>,
      stars: "",
      likes: "",
      views: "",
      bookmark: "",
      chapters: [],
    };

    // Thumbnail
    const carousel = $(".featured-comic-carousel");
    if (carousel.length) {
      const style = carousel.attr("style") ?? "";
      const match = style.match(/url\(['"']?(https?:\/\/[^'"')]+)['"']?\)/);
      if (match) data.thumbnail = proxyImage(match[1], baseApiUrl);
    }
    if (!data.thumbnail) {
      const src = $(".featured-cover img").attr("src") ?? "";
      if (src) data.thumbnail = proxyImage(src, baseApiUrl);
    }

    // Status
    const statusEl = $(".badge-status").first();
    if (statusEl.length) data.status = stripMarkers(statusEl.text());

    // Title & alternates
    const comicDetail = $("#comicDetail");
    if (comicDetail.length) {
      const titleEl = comicDetail.find("h6.fw-bold").first();
      if (titleEl.length) data.title = stripMarkers(titleEl.text());

      const alterEl = comicDetail.find(".alternate-name-container").first();
      if (alterEl.length) {
        const raw = alterEl.text().replace(/\s+/g, " ").trim();
        const cleaned = stripMarkers(raw);
        data.title_alter = cleaned
          .split("/")
          .map((t) => t.trim())
          .filter(Boolean);
      }

      // Genres
      const genres: Array<{ name: string; id_tags: string }> = [];
      comicDetail.find(".badge[data-tag-id]").each((_, el) => {
        const tagId = $(el).attr("data-tag-id") ?? "";
        const tagName = cleanText($(el).text());
        if (tagId && tagName) genres.push({ name: tagName, id_tags: tagId });
      });
      data.genres = genres;
    }

    // Keywords
    const keywords: Array<{ name: string; id_keywords: string }> = [];
    $("[data-keyword-id]").each((_, el) => {
      const kwId = $(el).attr("data-keyword-id") ?? "";
      const kwName = cleanText($(el).text());
      if (kwId && kwName) keywords.push({ name: kwName, id_keywords: kwId });
    });
    data.keywords = keywords;

    // Stats
    const likes = $("#titleStatsLikes").first().text().trim();
    if (likes) data.likes = likes;
    const views = $("#titleStatsViews").first().text().trim();
    if (views) data.views = views;

    // Title ID for chapter listing
    const titleId = $("[data-title-id]").first().attr("data-title-id") ?? "";
    if (titleId) {
      const chapterData = await this.postApi(BASE_API_CHAPTER, `title_id=${titleId}`, url);
      if (chapterData && !("error" in chapterData)) {
        data.chapters = this.transformChapters(chapterData, baseApiUrl);
      }
    }

    return removeEmpty(data);
  }

  async parseRead(idChapter: string, baseApiUrl = ""): Promise<Record<string, unknown>> {
    const url = `${BASE_URL}/chapter-detail/${idChapter}/`;
    let html: string;
    try {
      const resp = await this.http.get(url, { headers: { Referer: `${BASE_URL}/` } });
      html = resp.data as string;
    } catch {
      return { error: "Failed to fetch chapter page" };
    }

    const data: Record<string, unknown> = {
      title_id: "",
      chapter_id: "",
      chapter_number: "",
      chapter_volume: "",
      chapter_language: "",
      images: [] as string[],
    };

    const $ = cheerio.load(html);
    let found = false;

    $("script").each((_, el) => {
      if (found) return;
      const scriptText = $(el).html() ?? "";
      if (!scriptText.includes("chapterImages")) return;

      for (const [field, varName] of [
        ["title_id", "titleId"],
        ["chapter_id", "chapterId"],
        ["chapter_number", "chapterNumber"],
        ["chapter_volume", "chapterVolume"],
        ["chapter_language", "chapterLanguage"],
      ]) {
        const match = scriptText.match(new RegExp(`const\\s+${varName}\\s*=\\s*\`([^\`]*)\``));
        if (match) data[field] = match[1];
      }

      const imagesMatch = scriptText.match(/const\s+chapterImages\s*=\s*JSON\.parse\(`(\[.*?\])`\)/s);
      if (imagesMatch) {
        try {
          data.images = JSON.parse(imagesMatch[1]) as string[];
        } catch {
          // ignore
        }
      }

      found = true;
    });

    if (baseApiUrl && Array.isArray(data.images) && data.images.length > 0) {
      data.images = (data.images as string[]).filter(Boolean).map((img) => proxyImage(img, baseApiUrl));
    }

    return removeEmpty(data);
  }

  // ── image proxy ──────────────────────────────────────────────────────────

  async proxyImage(path: string): Promise<{ content: Buffer; contentType: string } | null> {
    const hostnameRe = /^[a-zA-Z0-9]([a-zA-Z0-9-]*\.)+[a-zA-Z]{2,}$/;
    const imageExts = new Set(["jpg", "jpeg", "png", "webp", "gif", "svg", "avif", "bmp", "ico", "tif", "tiff"]);

    const looksLikeHostname = (s: string): boolean => {
      if (!hostnameRe.test(s)) return false;
      const tld = s.split(".").pop()?.toLowerCase() ?? "";
      return !imageExts.has(tld);
    };

    const headers = {
      "User-Agent": DEFAULT_HEADERS["user-agent"],
      Referer: `${BASE_URL}/`,
    };

    // hostname-prefixed format
    const sep = path.indexOf("/");
    if (sep > 0) {
      const firstSeg = path.slice(0, sep);
      if (looksLikeHostname(firstSeg)) {
        try {
          const resp = await this.http.get(`https://${path}`, {
            headers,
            responseType: "arraybuffer",
          });
          if (resp.status === 200) {
            const contentType =
              (resp.headers["content-type"] as string) || "image/jpeg";
            return { content: Buffer.from(resp.data as ArrayBuffer), contentType };
          }
        } catch {
          // fall through
        }
        return null;
      }
    }

    // legacy format: try all CDN hosts
    for (const host of MANGABALL_CDN_HOSTS) {
      try {
        const resp = await this.http.get(`${host}/${path}`, {
          headers,
          responseType: "arraybuffer",
        });
        if (resp.status === 200) {
          const contentType =
            (resp.headers["content-type"] as string) || "image/jpeg";
          return { content: Buffer.from(resp.data as ArrayBuffer), contentType };
        }
      } catch {
        continue;
      }
    }
    return null;
  }
}

// ── Singleton export for Elysia ──────────────────────────────────────────────
export const mangaball = new MangaballParser();