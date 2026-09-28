import { Elysia, t } from "elysia";
import { AnimeSalt } from "./animesalt";

const prefix = "/anime/animesalt";
const pageParam = t.Optional(t.Number({ default: 1, minimum: 1 }));

function notFound(set: { status?: number | string }) {
  set.status = 404;
  return { error: "Not found" };
}

function ndjson(items: Promise<unknown>[]) {
  const encoder = new TextEncoder();
  let open = true;
  const stream = new ReadableStream({
    async start(controller) {
      await Promise.all(
        items.map(async (item) => {
          const value = await item;
          if (value && open) controller.enqueue(encoder.encode(JSON.stringify(value) + "\n"));
        }),
      );
      if (open) controller.close();
    },
    cancel() {
      open = false;
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
  });
}

export const animesaltRoutes = new Elysia({ prefix: "/animesalt" })
  .get("/", () => ({
    name: "animesalt-api",
    version: "2.0",
    endpoints: [
      prefix + "/home",
      prefix + "/search/{query}/{page}",
      prefix + "/category/{type}/{page}?type={movies|series}",
      prefix + "/movies/{page}",
      prefix + "/movies/info/{slug}",
      prefix + "/series/info/{slug}",
      prefix + "/episode/stream/{slug}",
    ],
  }))
  .get("/home", async () => ({ results: await AnimeSalt.home() }))
  .get(
    "/search/:query/:page?",
    async ({ params: { query, page } }) => ({
      results: await AnimeSalt.search(query, Number(page)),
    }),
    { params: t.Object({ query: t.String(), page: pageParam }) },
  )
  .get(
    "/category/*",
    async ({ params, query }) => {
      const segments = params["*"]
        .split("/")
        .filter((segment) => segment && segment !== "." && segment !== "..");
      const page =
        segments.length > 1 && /^[1-9]\d*$/.test(segments[segments.length - 1])
          ? Number(segments.pop())
          : 1;
      return { results: await AnimeSalt.category(segments.join("/"), page, query.type) };
    },
    { query: t.Object({ type: t.Optional(t.String()) }) },
  )
  .get(
    "/movies/:page?",
    async ({ params: { page } }) => ({ results: await AnimeSalt.movies(Number(page)) }),
    { params: t.Object({ page: pageParam }) },
  )
  .get(
    "/movies/info/:slug",
    async ({ params: { slug }, set }) => (await AnimeSalt.movieInfo(slug)) ?? notFound(set),
  )
  .get(
    "/series/info/:slug",
    async ({ params: { slug }, set }) => (await AnimeSalt.seriesInfo(slug)) ?? notFound(set),
  )
  .get("/episode/stream/:slug", async ({ params: { slug }, set }) => {
    const streams = await AnimeSalt.streams(slug);
    return streams ? ndjson(streams) : notFound(set);
  });
