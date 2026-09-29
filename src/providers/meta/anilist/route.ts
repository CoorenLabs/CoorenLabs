import { Elysia, t } from "elysia";
import { Cache } from "../../../core/cache";
import { Logger } from "../../../core/logger";
import { AniListError } from "./lib/helpers";
import { scrapeAnimeDetail } from "./scrapers/anime";
import { scrapeHome } from "./scrapers/home";
import { scrapeSearch } from "./scrapers/search";

const HOME_CACHE_TTL = 3600 * 12;
const ANIME_CACHE_TTL = 3600 * 24;
const SEARCH_CACHE_TTL = 3600 * 6;
const HOME_KEY = "anilist:meta:home";

const prefix = "/meta/anilist";

type Status = { status?: number | string };

async function respond<T>(
  set: Status,
  key: string,
  ttl: number,
  producer: () => Promise<T>,
  select: (data: T) => unknown = (data) => data,
) {
  const started = performance.now();
  try {
    const { data, cached } = await Cache.remember(key, ttl, producer);
    return {
      success: true,
      served_cache: cached,
      took_ms: (performance.now() - started).toFixed(2),
      data: select(data),
    };
  } catch (err) {
    const status = err instanceof AniListError ? err.status : 500;
    if (status >= 500) Logger.error(`[anilist-meta] ${key}: ${(err as Error).message}`);
    set.status = status;
    return { success: false, error: (err as Error).message };
  }
}

export const anilistMetaRoutes = new Elysia({ prefix: "/anilist" })
  .get("/", () => ({
    name: "anilist-meta-api",
    version: "1.0",
    description:
      "Meta provider for anime discovery — powered by AniList GraphQL + ani.zip image mappings.",
    endpoints: [
      prefix + "/home                        → Home page (spotlight + sections)",
      prefix +
        "/:category                   → Specific home category (e.g. spotlight, recently-added)",
      prefix + "/anime/:id                   → Full anime metadata",
      prefix + "/search/:query?page=&perPage= → AniList search",
    ],
  }))

  .get("/home", ({ set }) => respond(set, HOME_KEY, HOME_CACHE_TTL, scrapeHome))

  .get(
    "/:category",
    ({ params: { category }, set }) =>
      respond(set, HOME_KEY, HOME_CACHE_TTL, scrapeHome, (home) => home[category]),
    {
      params: t.Object({
        category: t.Union([
          t.Literal("spotlight"),
          t.Literal("recently-added"),
          t.Literal("popular-anime"),
          t.Literal("popular-movies"),
          t.Literal("seasonal-anime"),
          t.Literal("anime-of-all-time"),
          t.Literal("coming-soon"),
        ]),
      }),
      detail: {
        tags: ["meta"],
        summary: "AniList Meta — Home Category",
        description: "Fetch a specific category from the home page.",
      },
    },
  )

  .get(
    "/anime/:id",
    ({ params: { id }, set }) => {
      if (!/^\d+$/.test(id)) {
        set.status = 400;
        return { success: false, error: "Invalid AniList id" };
      }
      return respond(set, `anilist:meta:anime:${id}`, ANIME_CACHE_TTL, () =>
        scrapeAnimeDetail(Number(id)),
      );
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ["meta"],
        summary: "AniList Meta — Anime Detail",
        description:
          "Full AniList metadata for an anime: title, poster, banner, genres, studios, characters, relations, recommendations.",
      },
    },
  )

  .get(
    "/search/:query",
    ({ params: { query }, query: q, set }) => {
      const page = Number(q.page ?? 1);
      const perPage = Number(q.perPage ?? 20);
      return respond(
        set,
        `anilist:meta:search:${query.trim().toLowerCase()}:${page}:${perPage}`,
        SEARCH_CACHE_TTL,
        () => scrapeSearch(query, page, perPage),
      );
    },
    {
      params: t.Object({ query: t.String() }),
      query: t.Object({
        page: t.Optional(t.Number({ default: 1 })),
        perPage: t.Optional(t.Number({ default: 20 })),
      }),
      detail: {
        tags: ["meta"],
        summary: "AniList Meta — Search",
        description: "Search anime titles via AniList GraphQL. Returns paginated results.",
      },
    },
  );
