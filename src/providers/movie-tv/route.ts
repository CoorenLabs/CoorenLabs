import { Elysia } from "elysia";
import { primesrcRoutes } from "./primesrc/route";
import { yFlixRoutes } from "./yflix/route";

export const movieTvRoutes = new Elysia({ prefix: "/movie-tv" })
  .use(primesrcRoutes)
  .use(yFlixRoutes)
  
  // ─── Overview Endpoint ────────────────────────────────────────────────────────
  .get("/", () => ({
    service: "movie-tv",
    description: "Unified Movie & TV API — provider-isolated route architecture",
    providers: ["primesrc", "yflix"],
    endpoints: {
      primesrc: [
        "GET /movie-tv/primesrc/movie/:tmdbid   → Get movie sources",
        "GET /movie-tv/primesrc/tv/:tmdbid/:season/:episode → Get TV episode sources"
      ],
      yflix: [
        "GET /movie-tv/yflix/home                → Featured content",
        "GET /movie-tv/yflix/search?query=...     → Search content"
      ]
    }
  }), {
    detail: { tags: ['movie'], summary: 'Movie & TV API Overview' }
  });
