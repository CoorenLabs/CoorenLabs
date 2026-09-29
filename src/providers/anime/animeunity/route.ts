import { Elysia, t } from "elysia";
import { AnimeUnity } from "./animeunity";

export const animeunityRoutes = new Elysia({ prefix: "/animeunity" })

  // ─── Search ──────────────────────────────────────────────────────────────────
  .get(
    "/search/:query",
    async ({ params: { query } }) => {
      return await AnimeUnity.search(query);
    },
    {
      params: t.Object({
        query: t.String({ description: "Search query" }),
      }),
      detail: {
        description: "Search for anime titles on AnimeUnity (Italian source).",
      },
    },
  )

  // ─── Info ────────────────────────────────────────────────────────────────────
  .get(
    "/info/:id",
    async ({ params: { id }, set }) => {
      const res = await AnimeUnity.info(id);
      if (!res) {
        set.status = 404;
        return { message: "Anime not found" };
      }
      return res;
    },
    {
      params: t.Object({
        id: t.String({ description: "The anime ID (e.g., 12)" }),
      }),
      detail: {
        description:
          "Fetch full anime information and episode list from AnimeUnity (Italian source).",
      },
    },
  )

  // ─── Watch / Stream Sources ───────────────────────────────────────────────
  // episodeId format: "animeId/epId" (e.g., 12/5987)
  .get(
    "/watch/*",
    async ({ params }) => {
      const episodeId = params["*"];
      return await AnimeUnity.streams(episodeId);
    },
    {
      detail: {
        description:
          "Fetch streaming sources for a specific AnimeUnity episode (Italian source). Format: /watch/{animeId}/{epId}",
      },
    },
  );
