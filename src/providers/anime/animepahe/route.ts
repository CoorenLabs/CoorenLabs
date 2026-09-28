import { Elysia } from "elysia";
import { Animepahe } from "./animepahe";

const encoder = new TextEncoder();

export const animepaheRoutes = new Elysia({ prefix: "/animepahe" })
  .get("/search/:query", async ({ params }) => ({ results: await Animepahe.search(params.query) }))
  .get("/latest", async () => ({ results: await Animepahe.latest() }))
  .get(
    "/info/:id",
    async ({ params }) => (await Animepahe.info(params.id)) ?? { error: "Anime not found" },
  )
  .get("/episodes/:id", async ({ params }) => ({
    results: await Animepahe.fetchAllEpisodes(params.id),
  }))
  .get("/episode/:id/:session", ({ params }) => {
    const results = Animepahe.streams(params.id, params.session);
    const body = new ReadableStream({
      async pull(controller) {
        const { value, done } = await results.next();
        if (done) controller.close();
        else controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
      },
      cancel() {
        void results.return(undefined);
      },
    });
    return new Response(body, { headers: { "Content-Type": "application/json" } });
  });
