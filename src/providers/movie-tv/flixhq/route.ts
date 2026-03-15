import Elysia, { t } from "elysia";
import { FlixHQ } from "./flixhq";

const flixhqRoutes = new Elysia({ prefix: "/flixhq" })
  .get("/", () => {
    return {
      provider: "flixhq",
      type: "movie/tv",
      endpoints: [
        "/flixhq/home",
        "/flixhq/media/search",
        "/flixhq/media/suggestions",
        "/flixhq/movies/category/:category",
        "/flixhq/tv/category/:category",
        "/flixhq/media/upcoming",
        "/flixhq/media/filter",
        "/flixhq/media/:id",
        "/flixhq/genres/:genre",
        "/flixhq/countries/:country",
        "/flixhq/media/:id/servers",
        "/flixhq/sources/:episodeId",
      ],
    };
  })
  .get("/home", async () => {
    return await FlixHQ.fetchHome();
  })
  .get("/media/search", async ({ query: { q, page } }) => {
    return await FlixHQ.search(q, page ? Number(page) : undefined);
  }, {
    query: t.Object({
      q: t.String(),
      page: t.Optional(t.Numeric()),
    }),
  })
  .get("/media/suggestions", async ({ query: { q } }) => {
    return await FlixHQ.searchSuggestions(q);
  }, {
    query: t.Object({
      q: t.String(),
    }),
  })
  .get("/movies/category/:category", async ({ params: { category }, query: { page } }) => {
    const pageNum = page ? Number(page) : undefined;
    if (category === "popular") return await FlixHQ.fetchPopularMovies(pageNum);
    if (category === "top-rated") return await FlixHQ.fetchTopMovies(pageNum);
    return { error: "Invalid category" };
  }, {
    params: t.Object({
      category: t.String(),
    }),
    query: t.Object({
      page: t.Optional(t.Numeric()),
    }),
  })
  .get("/tv/category/:category", async ({ params: { category }, query: { page } }) => {
    const pageNum = page ? Number(page) : undefined;
    if (category === "popular") return await FlixHQ.fetchPopularTv(pageNum);
    if (category === "top-rated") return await FlixHQ.fetchTopTv(pageNum);
    return { error: "Invalid category" };
  }, {
    params: t.Object({
      category: t.String(),
    }),
    query: t.Object({
      page: t.Optional(t.Numeric()),
    }),
  })
  .get("/media/upcoming", async ({ query: { page } }) => {
    return await FlixHQ.fetchUpcoming(page ? Number(page) : undefined);
  }, {
    query: t.Object({
      page: t.Optional(t.Numeric()),
    }),
  })
  .get("/media/filter", async ({ query: { type, quality, genre, country, year, page } }) => {
    return await FlixHQ.advancedSearch(type, quality, genre, country, year, page ? Number(page) : undefined);
  }, {
    query: t.Object({
      type: t.Optional(t.String({ default: "all" })),
      quality: t.Optional(t.String({ default: "all" })),
      genre: t.Optional(t.String({ default: "all" })),
      country: t.Optional(t.String({ default: "all" })),
      year: t.Optional(t.String({ default: "all" })),
      page: t.Optional(t.Numeric({ default: 1 })),
    }),
  })
  .get("/media/:id", async ({ params: { id } }) => {
    return await FlixHQ.fetchMediaInfo(id);
  }, {
    params: t.Object({
      id: t.String(),
    }),
  })
  .get("/genres/:genre", async ({ params: { genre }, query: { page } }) => {
    return await FlixHQ.fetchGenre(genre, page ? Number(page) : undefined);
  }, {
    params: t.Object({
      genre: t.String(),
    }),
    query: t.Object({
      page: t.Optional(t.Numeric()),
    }),
  })
  .get("/countries/:country", async ({ params: { country }, query: { page } }) => {
    return await FlixHQ.fetchByCountry(country, page ? Number(page) : undefined);
  }, {
    params: t.Object({
      country: t.String(),
    }),
    query: t.Object({
      page: t.Optional(t.Numeric()),
    }),
  })
  .get("/media/:id/servers", async ({ params: { id } }) => {
    return await FlixHQ.fetchServers(id);
  }, {
    params: t.Object({
      id: t.String(),
    }),
  })
  .get("/sources/:episodeId", async ({ params: { episodeId }, query: { server } }) => {
    return await FlixHQ.fetchSources(episodeId, server);
  }, {
    params: t.Object({
      episodeId: t.String(),
    }),
    query: t.Object({
      server: t.Optional(t.String({ default: "megacloud" })),
    }),
  });

export { flixhqRoutes };
