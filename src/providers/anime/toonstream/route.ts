import { Elysia, t } from "elysia";
import { Cache } from "../../../core/cache";
import { Logger } from "../../../core/logger";
import { ScrapeHomePage } from "./scrapers/home";
import { ScrapeMovieInfo, ScrapeMovies, ScrapeMovieSources } from "./scrapers/movie";
import { ScrapeSearch } from "./scrapers/search";
import { ScrapeEpisodeSources, ScrapeSeries, ScrapeSeriesInfo } from "./scrapers/series";

const LIST_TTL = 43_200;
const MOVIE_INFO_TTL = 3600 * 24 * 14;
const SERIES_INFO_TTL = 3600 * 24 * 3;
const NO_DATA = "No Data Scraped!";

const prefix = "/anime/toonstream";
const pageParam = t.Optional(t.Number({ default: 1, minimum: 1 }));

async function attempt<T>(producer: () => Promise<T>) {
  const start = performance.now();
  const value = await producer().catch((err: Error) => {
    Logger.warn(`[toonstream] ${err.message}`);
    return null;
  });
  return { value, took_ms: (performance.now() - start).toFixed(2) };
}

async function cached<T>(
  key: string,
  ttl: number,
  producer: () => Promise<T | null>,
  extra: Record<string, unknown> = {},
) {
  const { value, took_ms } = await attempt(() =>
    Cache.remember(`toonstream:${key}`, ttl, producer),
  );
  return value?.data
    ? { success: true, served_cache: value.cached, ...extra, took_ms, data: value.data }
    : { success: false, ...extra, took_ms, msg: NO_DATA };
}

export const toonstreamRoutes = new Elysia({ prefix: "/toonstream" })
  .get("/", () => ({
    name: "toonstream-api",
    version: "0.1",
    endpoints: [
      prefix + "/home",
      prefix + "/search/{query}/{page}",
      "----------------------",
      prefix + "/movies/{page}",
      prefix + "/movies/info/{slug}",
      prefix + "/movies/sources/{slug}",
      "----------------------",
      prefix + "/series/{page}",
      prefix + "/series/info/{slug}",
      prefix + "/episode/sources/{slug}?season={season}&episode={episode}",
    ],
  }))
  .get("/home", () => cached("home", LIST_TTL, ScrapeHomePage))
  .get(
    "/search/:query/:page?",
    ({ params: { query, page } }) =>
      cached(`search:${query}:${page}`, LIST_TTL, () => ScrapeSearch(query, Number(page))),
    { params: t.Object({ query: t.String(), page: pageParam }) },
  )
  .get(
    "/movies/:page?",
    ({ params }) => {
      const page = Number(params.page);
      return cached(`movies:${page}`, LIST_TTL, () => ScrapeMovies(page), { page });
    },
    { params: t.Object({ page: pageParam }) },
  )
  .get("/movies/info/:slug", ({ params: { slug } }) =>
    cached(`movie:${slug}`, MOVIE_INFO_TTL, () => ScrapeMovieInfo(slug)),
  )
  .get("/movies/sources/:slug", async ({ params: { slug } }) => {
    const { value, took_ms } = await attempt(() => ScrapeMovieSources(slug));
    return value
      ? { success: true, took_ms, data: value }
      : { success: false, took_ms, msg: NO_DATA };
  })
  .get(
    "/series/:page?",
    ({ params }) => {
      const page = Number(params.page);
      return cached(`series:${page}`, LIST_TTL, () => ScrapeSeries(page), { page });
    },
    { params: t.Object({ page: pageParam }) },
  )
  .get("/series/info/:slug", ({ params: { slug } }) =>
    cached(`series:info:${slug}`, SERIES_INFO_TTL, () => ScrapeSeriesInfo(slug)),
  )
  .get(
    "/episode/sources/:slug",
    async ({ params: { slug }, query: { season, episode } }) => {
      const episodeSlug =
        season === undefined || episode === undefined ? slug : `${slug}-${season}x${episode}`;
      const { value } = await attempt(() => ScrapeEpisodeSources(episodeSlug));
      return value ? { success: true, data: value } : { success: false, msg: NO_DATA };
    },
    {
      query: t.Object({
        season: t.Optional(t.Numeric({ minimum: 0 })),
        episode: t.Optional(t.Numeric({ minimum: 0 })),
      }),
    },
  );
