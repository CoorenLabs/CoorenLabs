import Elysia from "elysia";
import { yFlix } from "./yflix";

const yFlixRoutes = new Elysia({ prefix: "/yflix" })
  .get("/",  () => {
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
  .get("/search/:query", async ({ params: { query } }) => {
    const response = await yFlix.search(query);
    return response;
  });

export { yFlixRoutes };

