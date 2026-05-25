import { Elysia } from "elysia";
import { anilistMetaRoutes } from "./anilist/route";

export const metaRoutes = new Elysia({ prefix: "/meta" })
  .use(anilistMetaRoutes)

  // ── Overview ──────────────────────────────────────────────────────────────────
  .get(
    "/",
    () => ({
      service: "meta",
      description: "Meta providers — anime/movie discovery via AniList and external data sources",
      providers: ["anilist"],
      endpoints: {
        anilist: [
          "GET /meta/anilist/home              → Home page (spotlight + sections)",
          "GET /meta/anilist/anime/:id         → Full anime metadata",
          "GET /meta/anilist/search/:query     → AniList search",
        ],
      },
    }),
    {
      detail: { tags: ["meta"], summary: "Meta API Overview" },
    },
  );
