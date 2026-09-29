import { Elysia, t } from "elysia";
import { AnimeUnity, AnimeUnityUnavailable } from "./animeunity";

const prefix = "/anime/animeunity";

const ANIME_ID = /^(\d+)(?:-[\w-]*)?$/;
const EPISODE_ID = /^(?:\d+\/)?(\d+)$/;

async function guard(set: { status?: number | string }, task: () => Promise<unknown>) {
  try {
    return await task();
  } catch (err) {
    if (!(err instanceof AnimeUnityUnavailable)) throw err;
    set.status = 502;
    return { error: err.message };
  }
}

function invalid(set: { status?: number | string }, error: string) {
  set.status = 400;
  return { error };
}

export const animeunityRoutes = new Elysia({ prefix: "/animeunity" })
  .get(
    "/",
    () => ({
      name: "animeunity",
      description:
        "Italian anime provider backed by AnimeUnity — search, info and vixcloud streams.",
      endpoints: [
        prefix + "/search/:query",
        prefix + "/info/:id",
        prefix + "/watch/:animeId/:epId",
      ],
    }),
    { detail: { tags: ["anime"], summary: "AnimeUnity — Overview" } },
  )
  .get(
    "/search/:query",
    ({ params: { query }, set }) =>
      guard(set, async () => ({ results: await AnimeUnity.search(query) })),
    {
      params: t.Object({ query: t.String({ description: "Search query" }) }),
      detail: {
        tags: ["anime"],
        summary: "AnimeUnity — Search",
        description: "Search for anime titles on AnimeUnity (Italian source).",
      },
    },
  )
  .get(
    "/info/:id",
    ({ params: { id }, set }) => {
      const animeId = id.match(ANIME_ID)?.[1];
      if (!animeId) return invalid(set, "Anime id must be numeric (e.g., 2998)");
      return guard(set, async () => {
        const info = await AnimeUnity.info(animeId);
        if (info) return info;
        set.status = 404;
        return { error: "Anime not found" };
      });
    },
    {
      params: t.Object({ id: t.String({ description: "The anime ID (e.g., 2998)" }) }),
      detail: {
        tags: ["anime"],
        summary: "AnimeUnity — Info",
        description:
          "Fetch full anime information and episode list from AnimeUnity (Italian source).",
      },
    },
  )
  .get(
    "/watch/*",
    ({ params, set }) => {
      const episodeId = params["*"].match(EPISODE_ID)?.[1];
      if (!episodeId) return invalid(set, "Episode id must look like {animeId}/{epId}");
      return guard(set, async () => {
        const results = await AnimeUnity.streams(episodeId);
        if (results?.streams.length) return { results };
        set.status = 404;
        return { error: "No streams found" };
      });
    },
    {
      detail: {
        tags: ["anime"],
        summary: "AnimeUnity — Stream Sources",
        description:
          "Fetch vixcloud streaming sources for an AnimeUnity episode (Italian source). Format: /watch/{animeId}/{epId}",
      },
    },
  );
