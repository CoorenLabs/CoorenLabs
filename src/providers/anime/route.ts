import { Elysia } from "elysia";
import { animepaheRoutes } from "./animepahe/route";
import { animekaiRoutes } from "./animekai/route";

export const animeRoutes = new Elysia({ prefix: "/anime" })
  .use(animepaheRoutes)
  .use(animekaiRoutes)

  // ─── Overview Endpoint ────────────────────────────────────────────────────────
  .get("/", () => ({
    service: "anime",
    description: "Unified anime API — provider-isolated route architecture",
    providers: ["animepahe", "animekai"],
    endpoints: {
      animepahe: [
        "GET /anime/animepahe/search/:query       → Search titles",
        "GET /anime/animepahe/latest              → Latest updated titles",
        "GET /anime/animepahe/info/:id            → Full title details",
        "GET /anime/animepahe/episodes/:id        → Episode list",
        "GET /anime/animepahe/episode/:id/:session → Stream results",
      ],
      animekai: [
        "GET /anime/animekai/search/:query        → Paginated search",
        "GET /anime/animekai/spotlight            → Spotlight anime",
        "GET /anime/animekai/schedule/:date       → Airing schedule (YYYY-MM-DD)",
        "GET /anime/animekai/suggestions/:query   → Search suggestions",
        "GET /anime/animekai/recent-episodes      → Recently updated episodes",
        "GET /anime/animekai/recent-added         → Recently added series",
        "GET /anime/animekai/completed            → Latest completed series",
        "GET /anime/animekai/new-releases         → New anime releases",
        "GET /anime/animekai/movies               → Browse anime movies",
        "GET /anime/animekai/tv                   → Browse TV series",
        "GET /anime/animekai/ova                  → Browse OVA",
        "GET /anime/animekai/ona                  → Browse ONA",
        "GET /anime/animekai/specials             → Browse specials",
        "GET /anime/animekai/genres               → List all genres",
        "GET /anime/animekai/genre/:genre         → Search by genre",
        "GET /anime/animekai/info?id=             → Full anime info + episodes",
        "GET /anime/animekai/watch/:episodeId     → Stream sources (query: dub)",
        "GET /anime/animekai/servers/:episodeId   → Episode servers (query: dub)",
      ],
    },
  }), {
    detail: { tags: ["anime"], summary: "Anime API Overview" },
  });