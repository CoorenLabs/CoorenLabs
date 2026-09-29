import { Elysia, t } from "elysia";
import { AnimeSaturn } from "./animesaturn";

export const animesaturnRoutes = new Elysia({ prefix: "/animesaturn" })

  // ─── Search ──────────────────────────────────────────────────────────────────
  .get(
    "/search/:query",
    async ({ params: { query }, query: qs }) => {
      const page = parseInt(qs?.page as string) || 1;
      return await AnimeSaturn.search(query, page);
    },
    {
      params: t.Object({
        query: t.String({ description: "Search query" }),
      }),
      query: t.Object({
        page: t.Optional(t.String({ description: "Page number" })),
      }),
      detail: {
        description: "Search for anime titles on AnimeSaturn (Italian source).",
      },
    },
  )

  // ─── Info ────────────────────────────────────────────────────────────────────
  .get(
    "/info/:id",
    async ({ params: { id }, set }) => {
      const res = await AnimeSaturn.info(id);
      if (!res) {
        set.status = 404;
        return { message: "Anime not found" };
      }
      return res;
    },
    {
      params: t.Object({
        id: t.String({ description: "The anime ID (e.g., One-Piece-Sub-ITA-a)" }),
      }),
      detail: {
        description:
          "Fetch full anime information and episode list from AnimeSaturn (Italian source).",
      },
    },
  )

  // ─── Watch / Stream Sources ───────────────────────────────────────────────
  // Accepts full composite ID (animeSlug/episodeSlug) or just the episode slug
  .get(
    "/watch/*",
    async ({ params, set }) => {
      const episodeId = params["*"];
      if (!episodeId) {
        set.status = 400;
        return { message: "episodeId is required" };
      }
      return await AnimeSaturn.streams(episodeId);
    },
    {
      detail: {
        description:
          "Fetch streaming sources for a specific AnimeSaturn episode (Italian source). Supports full composite ID or just the episode ID. Pass as /watch/{id}",
      },
    },
  );
