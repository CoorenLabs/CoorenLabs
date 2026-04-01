import { Elysia } from "elysia";
import { mangafire } from "./mangafire";

const ok = (data: unknown) => ({ status: 200, success: true, data });
const err = (set: any, status: number, message: string) => {
  set.status = status;
  return { status, success: false, message, data: null };
};

export const mangafireRoutes = new Elysia({ prefix: "/mangafire" })
  .get("/", () => {
    return {
      provider: "MangaFire",
      status: "operational",
      description: "MangaFire provider.",
      message: "MangaFire provider is running. Visit /docs for available endpoints.",
    };
  })
  .get("/home", async ({ set }) => {
    const data = await mangafire.scrapeHomePage();
    if (data.error) return err(set, 500, data.error);
    return ok(data);
  })
  .get("/search", async ({ query: { q, page = 1 }, set }) => {
    if (!q) return err(set, 400, "Query 'q' is required for search");
    const data = await mangafire.search(q as string, parseInt(page as string));
    if (data.error) return err(set, 500, data.error);
    return ok(data);
  })
  .get("/latest", async ({ query: { page = 1 }, set }) => {
    const data = await mangafire.scrapeLatestPage("updated", parseInt(page as string));
    if (data.error) return err(set, 500, data.error);
    return ok(data);
  })
  .get("/category/:category", async ({ params: { category }, query: { page = 1 }, set }) => {
    const data = await mangafire.scrapeCategory(category, parseInt(page as string));
    if (data.error) return err(set, 500, data.error);
    return ok(data);
  })
  .get("/genre/:genre", async ({ params: { genre }, query: { page = 1 }, set }) => {
    const data = await mangafire.scrapeGenre(genre, parseInt(page as string));
    if (data.error) return err(set, 500, data.error);
    return ok(data);
  })
  .get("/detail/:id", async ({ params: { id }, set }) => {
    const data = await mangafire.scrapeMangaInfo(id);
    if (data.error) return err(set, 500, data.error);
    return ok(data);
  })
  .get("/chapters/:id", async ({ params: { id }, query: { lang = "" }, set }) => {
    const data = await mangafire.getChapters(id, lang as string);
    if (data.error) return err(set, 500, data.error);
    return ok(data);
  })
  .get("/read/:id", async ({ params: { id }, set }) => {
    const data = await mangafire.getChapterImages(id);
    if (data.error) return err(set, 500, data.error);
    return ok(data);
  })
  .get("/volumes/:id", async ({ params: { id }, query: { lang = "en" }, set }) => {
    const data = await mangafire.getVolumes(id, lang as string);
    if (data.error) return err(set, 500, data.error);
    return ok(data);
  });
