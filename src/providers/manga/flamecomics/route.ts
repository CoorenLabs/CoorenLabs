import { Elysia, t } from "elysia";
import { flamecomics } from "./flamecomics";

export const flamecomicsRoutes = new Elysia({ prefix: "/flamecomics" })
  .get(
    "/search",
    async ({ query }) => {
      return await flamecomics.search(query.q as string);
    },
    {
      query: t.Object({
        q: t.String(),
      }),
      detail: {
        tags: ["manga"],
        summary: "FlameComics Search",
        description: "Search for manga by keyword.",
      },
    },
  )
  .get(
    "/detail/:id",
    async ({ params }) => {
      return await flamecomics.getMangaDetail(params.id);
    },
    {
      params: t.Object({
        id: t.String({ description: "Series ID (numeric, e.g., 1)" }),
      }),
      detail: {
        tags: ["manga"],
        summary: "FlameComics Detail & Chapters",
        description:
          "Returns metadata and full chapter list for a series. Each chapter includes a `token` field — use that as the `token` param in the /read endpoint.",
      },
    },
  )
  .get(
    "/read/:mangaId/:token",
    async ({ params, set }) => {
      const result = await flamecomics.getMangaChapter(params.mangaId, params.token);
      if (!result) {
        set.status = 404;
        return { message: "Chapter not found" };
      }
      return result;
    },
    {
      params: t.Object({
        mangaId: t.String({ description: "Series ID (numeric, e.g., 1)" }),
        token: t.String({
          description: "Chapter token from the detail endpoint chapters list (e.g., chapter-1)",
        }),
      }),
      detail: {
        tags: ["manga"],
        summary: "FlameComics Read Chapter",
        description:
          "Returns chapter images and navigation. The `images` array contains direct CDN URLs ready for display.",
      },
    },
  );
