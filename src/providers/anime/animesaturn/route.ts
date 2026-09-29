import { Elysia, t } from "elysia";
import { AnimeSaturn, AnimeSaturnUnavailable } from "./animesaturn";

const prefix = "/anime/animesaturn";

const SLUG = /^[\w-]+$/;
const EPISODE = /^[\w-]+\/ep-[\w.-]+$/;

async function guard(set: { status?: number | string }, task: () => Promise<unknown>) {
  try {
    return await task();
  } catch (err) {
    if (!(err instanceof AnimeSaturnUnavailable)) throw err;
    set.status = 502;
    return { error: err.message };
  }
}

function invalid(set: { status?: number | string }, error: string) {
  set.status = 400;
  return { error };
}

export const animesaturnRoutes = new Elysia({ prefix: "/animesaturn" })
  .get(
    "/",
    () => ({
      name: "animesaturn",
      description: "Italian anime provider backed by AnimeSaturn — search, info and streams.",
      endpoints: [
        prefix + "/search/:query?page=",
        prefix + "/info/:id",
        prefix + "/watch/:animeId/:episode",
      ],
    }),
    { detail: { tags: ["anime"], summary: "AnimeSaturn — Overview" } },
  )
  .get(
    "/search/:query",
    ({ params: { query }, query: qs, set }) => {
      const page = qs.page === undefined ? 1 : Number(qs.page);
      if (!Number.isInteger(page) || page < 1) {
        return invalid(set, "page must be a positive integer");
      }
      return guard(set, async () => ({ results: await AnimeSaturn.search(query, page) }));
    },
    {
      params: t.Object({ query: t.String({ description: "Search query" }) }),
      query: t.Object({ page: t.Optional(t.String({ description: "Page number" })) }),
      detail: {
        tags: ["anime"],
        summary: "AnimeSaturn — Search",
        description: "Search for anime titles on AnimeSaturn (Italian source).",
      },
    },
  )
  .get(
    "/info/:id",
    ({ params: { id }, set }) => {
      if (!SLUG.test(id)) return invalid(set, "Invalid anime id");
      return guard(set, async () => {
        const info = await AnimeSaturn.info(id);
        if (info) return info;
        set.status = 404;
        return { error: "Anime not found" };
      });
    },
    {
      params: t.Object({
        id: t.String({ description: "The anime ID (e.g., one-piece-ita-bz8UJ)" }),
      }),
      detail: {
        tags: ["anime"],
        summary: "AnimeSaturn — Info",
        description:
          "Fetch full anime information and episode list from AnimeSaturn (Italian source).",
      },
    },
  )
  .get(
    "/watch/*",
    ({ params, set }) => {
      const episodeId = params["*"];
      if (!EPISODE.test(episodeId)) {
        return invalid(set, "Episode id must look like {animeId}/ep-{number}");
      }
      return guard(set, async () => {
        const results = await AnimeSaturn.streams(episodeId);
        if (results?.streams.length) return { results };
        set.status = 404;
        return { error: "No streams found" };
      });
    },
    {
      detail: {
        tags: ["anime"],
        summary: "AnimeSaturn — Stream Sources",
        description:
          "Fetch streaming sources for an AnimeSaturn episode (Italian source). Pass the episode ID from info, e.g. /watch/one-piece-ita-bz8UJ/ep-1. Streams include a proxiedUrl that carries the required Referer.",
      },
    },
  );
