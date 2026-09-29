import { Elysia, t } from "elysia";
import { mangapill } from "./mangapill";

export const mangapillRoutes = new Elysia({ prefix: "/mangapill" })
  .get(
    "/search",
    async ({ query }) => {
      return await mangapill.search(query.q as string);
    },
    {
      query: t.Object({
        q: t.String(),
      }),
      detail: {
        tags: ["manga"],
        summary: "MangaPill Search",
        description: "Search for manga by keyword.",
      },
    },
  )
  .get(
    "/detail/:id",
    async ({ params }) => {
      return await mangapill.getMangaDetail(params.id);
    },
    {
      params: t.Object({
        id: t.String({ description: "Manga ID (e.g., one-piece-3)" }),
      }),
      detail: {
        tags: ["manga"],
        summary: "MangaPill Detail & Chapters",
        description:
          "Returns manga details and its complete chapter list. Use chapter `id` values from this response as the `chapterId` for the /read endpoint.",
      },
    },
  )
  .get(
    "/read/:chapterId",
    async ({ params, set }) => {
      const result = await mangapill.getChapterImages(params.chapterId);
      if (!result) {
        set.status = 404;
        return { message: "Chapter not found" };
      }
      return result;
    },
    {
      params: t.Object({
        chapterId: t.String({
          description:
            "Chapter ID from detail endpoint chapters list (e.g., one-piece-3-chapter-1100)",
        }),
      }),
      detail: {
        tags: ["manga"],
        summary: "MangaPill Read Chapter",
        description:
          "Returns chapter page images. The `pages` array contains direct CDN image URLs. Note: images require `Referer: https://mangapill.com` header.",
      },
    },
  );
