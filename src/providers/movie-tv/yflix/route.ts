import Elysia, { t } from "elysia";
import { yFlix } from "./yflix";

const yFlixRoutes = new Elysia({ prefix: "/yflix" })
  .get("/", () => {
    return {
      provider: "yflix",
      type: "movie/tv",
      endpoints: [
        "/yflix/home",
        "/yflix/search/:query"
      ]
    }
  })
  .get("/home", async () => {
    const response = await yFlix.home();
    return response;
  })
  .get("/search", async ({ query: { query, type, page } }) => {
    const pageNo = page ? +page : 1;
    console.log(type);
    const response = await yFlix.search(query, pageNo, type);
    return response;
  },
    {
      query: t.Object({
        query: t.String(),
        page: t.Optional(t.Numeric()),
        type: t.Optional(t.Union([
          t.Literal("movie"),
          t.Literal("tv")
        ]))
      })
    }
  );

export { yFlixRoutes };

