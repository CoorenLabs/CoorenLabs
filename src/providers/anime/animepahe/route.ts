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

    const stream = new ReadableStream({
      async start(controller) {
        for await (const result of Animepahe.streams(id, session)) {
          controller.enqueue(
            new TextEncoder().encode(JSON.stringify(result) + "\n")
          );
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/json"
      }
    });

  });