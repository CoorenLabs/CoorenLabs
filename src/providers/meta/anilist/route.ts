import { Elysia, t } from "elysia";
import { Cache } from "../../../core/cache";
import { scrapeHome } from "./scrapers/home";
import { scrapeAnimeDetail } from "./scrapers/anime";
import { scrapeSearch } from "./scrapers/search";

// Cache TTLs
const HOME_CACHE_TTL = 3600 * 12; // 12hr
const ANIME_CACHE_TTL = 3600 * 24 * 1; // 1 day(s)
const SEARCH_CACHE_TTL = 3600 * 6; // 6hr

const prefix = "/meta/anilist";

export const anilistMetaRoutes = new Elysia({ prefix: "/anilist" })

  // ── Overview ────────────────────────────────────────────────────────────────
  .get("/", () => ({
    name: "anilist-meta-api",
    version: "1.0",
    description:
      "Meta provider for anime discovery — powered by AniList GraphQL + ani.zip image mappings.",
    endpoints: [
      prefix + "/home                        → Home page (spotlight + sections)",
      prefix + "/:category                   → Specific home category (e.g. spotlight, recently-added)",
      prefix + "/anime/:id                   → Full anime metadata",
      prefix + "/search/:query?page=&perPage= → AniList search",
    ],
  }))

  // ── Home ─────────────────────────────────────────────────────────────────────
  .get("/home", async () => {
    const then = performance.now();

    const cached = await Cache.get("anilist:meta:home");
    if (cached) {
      return {
        success: true,
        served_cache: true,
        took_ms: (performance.now() - then).toFixed(2),
        data: JSON.parse(cached),
      };
    }

    try {
      const data = await scrapeHome();
      Cache.set("anilist:meta:home", JSON.stringify(data), HOME_CACHE_TTL);

      return {
        success: true,
        served_cache: false,
        took_ms: (performance.now() - then).toFixed(2),
        data,
      };
    } catch (err: any) {
      console.error("[anilist-meta/home]", err);
      return { success: false, error: err.message };
    }
  })

  // ── Home Categories ──────────────────────────────────────────────────────────
  .get(
    "/:category",
    async ({ params: { category } }) => {
      const then = performance.now();

      let homeData;
      const cached = await Cache.get("anilist:meta:home");

      if (cached) {
        homeData = JSON.parse(cached);
      } else {
        try {
          homeData = await scrapeHome();
          Cache.set("anilist:meta:home", JSON.stringify(homeData), HOME_CACHE_TTL);
        } catch (err: any) {
          console.error(`[anilist-meta/${category}]`, err);
          return { success: false, error: err.message };
        }
      }

      return {
        success: true,
        served_cache: !!cached,
        took_ms: (performance.now() - then).toFixed(2),
        data: homeData[category as keyof typeof homeData],
      };
    },
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
    }
  )

  // ── Anime Detail ─────────────────────────────────────────────────────────────
  .get(
    "/anime/:id",
    async ({ params: { id } }) => {
      const then = performance.now();

      const cacheKey = `anilist:meta:anime:${id}`;
      const cached = await Cache.get(cacheKey);
      if (cached) {
        return {
          success: true,
          served_cache: true,
          took_ms: (performance.now() - then).toFixed(2),
          data: JSON.parse(cached),
        };
      }

      try {
        const data = await scrapeAnimeDetail(id);
        Cache.set(cacheKey, JSON.stringify(data), ANIME_CACHE_TTL);

        return {
          success: true,
          served_cache: false,
          took_ms: (performance.now() - then).toFixed(2),
          data,
        };
      } catch (err: any) {
        console.error(`[anilist-meta/anime/${id}]`, err);
        return { success: false, error: err.message };
      }
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

  // ── Search ───────────────────────────────────────────────────────────────────
  .get(
    "/search/:query",
    async ({ params: { query }, query: q }) => {
      const then = performance.now();
      const page = Number(q.page ?? 1);
      const perPage = Number(q.perPage ?? 20);

      const cacheKey = `anilist:meta:search:${query}:${page}:${perPage}`;
      const cached = await Cache.get(cacheKey);
      if (cached) {
        return {
          success: true,
          served_cache: true,
          took_ms: (performance.now() - then).toFixed(2),
          data: JSON.parse(cached),
        };
      }

      try {
        const data = await scrapeSearch(query, page, perPage);
        Cache.set(cacheKey, JSON.stringify(data), SEARCH_CACHE_TTL);

        return {
          success: true,
          served_cache: false,
          took_ms: (performance.now() - then).toFixed(2),
          data,
        };
      } catch (err: any) {
        console.error(`[anilist-meta/search]`, err);
        return { success: false, error: err.message };
      }
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
