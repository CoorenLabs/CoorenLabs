import { Elysia } from "elysia";
import { AnimeKai } from "./animekai";

export const animekaiRoutes = new Elysia({ prefix: "/animekai" })

  // ─── Search ────────────────────────────────────────────────────────────────
  .get("/search/:query", async ({ params: { query }, query: qs }) => {
    const page = parseInt(qs?.page as string) || 1;
    return await AnimeKai.search(query, page);
  })

  // ─── Spotlight ─────────────────────────────────────────────────────────────
  .get("/spotlight", async () => {
    return { results: await AnimeKai.spotlight() };
  })

  // ─── Schedule ──────────────────────────────────────────────────────────────
  .get("/schedule/:date", async ({ params: { date } }) => {
    return { results: await AnimeKai.schedule(date) };
  })

  // ─── Search Suggestions ────────────────────────────────────────────────────
  .get("/suggestions/:query", async ({ params: { query } }) => {
    return { results: await AnimeKai.suggestions(query) };
  })

  // ─── Recent Episodes (recently updated) ────────────────────────────────────
  .get("/recent-episodes", async ({ query: qs }) => {
    const page = parseInt(qs?.page as string) || 1;
    return await AnimeKai.recentlyUpdated(page);
  })

  // ─── Recently Added ────────────────────────────────────────────────────────
  .get("/recent-added", async ({ query: qs }) => {
    const page = parseInt(qs?.page as string) || 1;
    return await AnimeKai.recentlyAdded(page);
  })

  // ─── Latest Completed ──────────────────────────────────────────────────────
  .get("/completed", async ({ query: qs }) => {
    const page = parseInt(qs?.page as string) || 1;
    return await AnimeKai.latestCompleted(page);
  })

  // ─── New Releases ──────────────────────────────────────────────────────────
  .get("/new-releases", async ({ query: qs }) => {
    const page = parseInt(qs?.page as string) || 1;
    return await AnimeKai.newReleases(page);
  })

  // ─── Movies ────────────────────────────────────────────────────────────────
  .get("/movies", async ({ query: qs }) => {
    const page = parseInt(qs?.page as string) || 1;
    return await AnimeKai.movies(page);
  })

  // ─── TV ────────────────────────────────────────────────────────────────────
  .get("/tv", async ({ query: qs }) => {
    const page = parseInt(qs?.page as string) || 1;
    return await AnimeKai.tv(page);
  })

  // ─── OVA ───────────────────────────────────────────────────────────────────
  .get("/ova", async ({ query: qs }) => {
    const page = parseInt(qs?.page as string) || 1;
    return await AnimeKai.ova(page);
  })

  // ─── ONA ───────────────────────────────────────────────────────────────────
  .get("/ona", async ({ query: qs }) => {
    const page = parseInt(qs?.page as string) || 1;
    return await AnimeKai.ona(page);
  })

  // ─── Specials ──────────────────────────────────────────────────────────────
  .get("/specials", async ({ query: qs }) => {
    const page = parseInt(qs?.page as string) || 1;
    return await AnimeKai.specials(page);
  })

  // ─── Genre List ────────────────────────────────────────────────────────────
  .get("/genres", async () => {
    return { results: await AnimeKai.genres() };
  })

  // ─── By Genre ──────────────────────────────────────────────────────────────
  .get("/genre/:genre", async ({ params: { genre }, query: qs }) => {
    const page = parseInt(qs?.page as string) || 1;
    return await AnimeKai.genreSearch(genre, page);
  })

  // ─── Anime Info ────────────────────────────────────────────────────────────
  .get("/info/:id?", async ({ params: { id }, set }) => {
    if (!id) {
      set.status = 400;
      return { message: "id is required" };
    }
    const res = await AnimeKai.info(id);
    if (!res) {
      set.status = 404;
      return { message: "Anime not found" };
    }
    return res;
  })

// ─── Watch / Stream Sources ────────────────────────────────────────────────
  .get("/watch/:episodeId", async ({ params: { episodeId }, query: qs, set }) => {
    if (!episodeId) {
      set.status = 400;
      return { message: "episodeId is required" };
    }
    
    const type = qs?.type as "softsub" | "dub" | "hardsub" | undefined;
    const animeSlug = episodeId.split("$")[0] ?? episodeId;
    
    // Return the response directly as it's already structured perfectly
    return await AnimeKai.streams(animeSlug, episodeId, type);
  })

  // ─── Episode Servers ───────────────────────────────────────────────────────
.get("/servers/:episodeId", async ({ params: { episodeId }, query: qs, set }) => {
  if (!episodeId) {
    set.status = 400;
    return { message: "episodeId is required" };
  }

  const type = qs?.type as "softsub" | "dub" | "hardsub" | undefined;
  return { 
    servers: await AnimeKai.fetchEpisodeServers(episodeId, type ?? "hardsub") 
  };
});
