import { Elysia } from "elysia";
import { Animepahe } from "./animepahe";

export const animepaheRoutes = new Elysia({ prefix: "/animepahe" })
  .get("/search/:query", async ({ params: { query } }) => {
    return { results: await Animepahe.search(query) };
  })
  .get("/latest", async () => {
    return { results: await Animepahe.latest() };
  })
  .get("/info/:id", async ({ params: { id } }) => {
    const info = await Animepahe.info(id);
    if (!info) return { error: "Anime not found" };
    return info;
  })
  .get("/episodes/:id", async ({ params: { id } }) => {
    const episodes = await Animepahe.fetchAllEpisodes(id);
    return { results: episodes };
  })
  .get("/episode/:id/:session", async ({ params: { id, session } }) => {
    return { results: await Animepahe.streams(id, session) };
  });
