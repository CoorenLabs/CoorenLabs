import { Elysia } from "elysia";
import { primesrcRoutes } from "./primesrc/route";

export const movieTvRoutes = new Elysia({ prefix: "/movie-tv" }).use(primesrcRoutes).get(
  "/",
  () => ({
    service: "movie-tv",
    description: "Unified Movie & TV API — provider-isolated route architecture",
    providers: ["primesrc"],
    endpoints: {
      primesrc: [
        "GET /movie-tv/primesrc/movie/:tmdbid   → Get movie sources",
        "GET /movie-tv/primesrc/tv/:tmdbid/:season/:episode → Get TV episode sources",
      ],
    },
  }),
  {
    detail: { tags: ["movie"], summary: "Movie & TV API Overview" },
  },
);
