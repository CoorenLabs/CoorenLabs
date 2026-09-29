import { Elysia } from "elysia";
import { Animepahe, AnimepaheUnavailable } from "./animepahe";

const encoder = new TextEncoder();

const prefix = "/anime/animepahe";

async function guard(set: { status?: number | string }, task: () => Promise<unknown>) {
  try {
    return await task();
  } catch (err) {
    if (!(err instanceof AnimepaheUnavailable)) throw err;
    set.status = 502;
    return { error: err.message };
  }
}

export const animepaheRoutes = new Elysia({ prefix: "/animepahe" })
  .get("/", () => ({
    name: "animepahe",
    description: "Anime provider backed by animepahe — search, info, episodes and kwik streams.",
    endpoints: [
      prefix + "/search/:query",
      prefix + "/latest",
      prefix + "/info/:id",
      prefix + "/episodes/:id",
      prefix + "/episode/:id/:session",
    ],
  }))
  .get("/search/:query", ({ params, set }) =>
    guard(set, async () => ({ results: await Animepahe.search(params.query) })),
  )
  .get("/latest", ({ set }) => guard(set, async () => ({ results: await Animepahe.latest() })))
  .get("/info/:id", ({ params, set }) =>
    guard(set, async () => {
      const info = await Animepahe.info(params.id);
      if (info) return info;
      set.status = 404;
      return { error: "Anime not found" };
    }),
  )
  .get("/episodes/:id", ({ params, set }) =>
    guard(set, async () => {
      const results = await Animepahe.fetchAllEpisodes(params.id);
      if (results) return { results };
      set.status = 404;
      return { error: "Anime not found" };
    }),
  )
  .get("/episode/:id/:session", ({ params, set }) =>
    guard(set, async () => {
      const streams = Animepahe.streams(params.id, params.session);
      const first = await streams.next();
      if (first.done) {
        set.status = 404;
        return { error: "No streams found" };
      }
      let pending: typeof first | null = first;
      const body = new ReadableStream({
        async pull(controller) {
          const { value, done } = pending ?? (await streams.next());
          pending = null;
          if (done) controller.close();
          else controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
        },
        cancel() {
          void streams.return(undefined);
        },
      });
      return new Response(body, {
        headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
      });
    }),
  );
