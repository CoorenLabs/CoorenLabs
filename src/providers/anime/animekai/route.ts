import { Elysia } from "elysia";
import { AnimeKai } from "./animekai";

export const animekaiRoutes = new Elysia({ prefix: "/animekai" })
  // Search
  .get("/search/:query", async ({ params: { query }, query: qs }) => {
    const page = parseInt(qs?.page as string) || 1;
    return await AnimeKai.search(query, page);
  })

  // Spotlight
  .get("/spotlight", async () => {
    return { results: await AnimeKai.spotlight() };
  })

  // Schedule
  .get("/schedule", async ({ query: qs }) => {
    return { results: await AnimeKai.schedule(qs?.date as string) };
  })

  // Search Suggestions
  .get("/suggestions/:query", async ({ params: { query } }) => {
    return { results: await AnimeKai.suggestions(query) };
  })

  // Recent Episodes (recently updated)
  .get("/recent-episodes", async ({ query: qs }) => {
    const page = parseInt(qs?.page as string) || 1;
    return await AnimeKai.recentlyUpdated(page);
  })

  // Recently Added
  .get("/recent-added", async ({ query: qs }) => {
    const page = parseInt(qs?.page as string) || 1;
    return await AnimeKai.recentlyAdded(page);
  })

  // Latest Completed
  .get("/completed", async ({ query: qs }) => {
    const page = parseInt(qs?.page as string) || 1;
    return await AnimeKai.latestCompleted(page);
  })

  // New Releases
  .get("/new-releases", async ({ query: qs }) => {
    const page = parseInt(qs?.page as string) || 1;
    return await AnimeKai.newReleases(page);
  })

  // Movies
  .get("/movies", async ({ query: qs }) => {
    const page = parseInt(qs?.page as string) || 1;
    return await AnimeKai.movies(page);
  })

  // TV
  .get("/tv", async ({ query: qs }) => {
    const page = parseInt(qs?.page as string) || 1;
    return await AnimeKai.tv(page);
  })

  // OVA
  .get("/ova", async ({ query: qs }) => {
    const page = parseInt(qs?.page as string) || 1;
    return await AnimeKai.ova(page);
  })

  // ONA
  .get("/ona", async ({ query: qs }) => {
    const page = parseInt(qs?.page as string) || 1;
    return await AnimeKai.ona(page);
  })

  // Specials
  .get("/specials", async ({ query: qs }) => {
    const page = parseInt(qs?.page as string) || 1;
    return await AnimeKai.specials(page);
  })

  // Genre List
  .get("/genres", async () => {
    return { results: await AnimeKai.genres() };
  })

  // By Genre
  .get("/genre/:genre", async ({ params: { genre }, query: qs }) => {
    const page = parseInt(qs?.page as string) || 1;
    return await AnimeKai.genreSearch(genre, page);
  })

  // Episode Servers
  .get("/servers/:episodeId", async ({ params: { episodeId }, query: qs }) => {
    const dubParam = qs?.dub;
    const subOrDub: "softsub" | "dub" =
      dubParam === "true" || dubParam === "1" ? "dub" : "softsub";
    return { servers: await AnimeKai.fetchEpisodeServers(episodeId, subOrDub) };
  });
