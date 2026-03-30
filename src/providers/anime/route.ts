import { Elysia } from "elysia";
import { animekaiRoutes } from "./animekai/route";
import { animepaheRoutes } from "./animepahe/route";
import { toonstreamRoutes } from "./toonstream/route";
import { animesaltRoutes } from "./animesalt/route";

export const animeRoutes = new Elysia({ prefix: "/anime" })
  .use(animepaheRoutes)
  .use(animekaiRoutes)
  .use(toonstreamRoutes)
  .use(animesaltRoutes)

  // ─── Overview Endpoint ────────────────────────────────────────────────────────
  .get(
    "/",
    () => ({
      service: "anime",
      description: "Unified anime API — provider-isolated route architecture",
      providers: ["animepahe", "animekai", "toonstream", "animesalt"],
      endpoints: {
        animepahe: [
          "GET /anime/animepahe/search/:query         → Search titles",
          "GET /anime/animepahe/latest                → Latest updated titles",
          "GET /anime/animepahe/info/:id              → Full title details",
          "GET /anime/animepahe/episodes/:id          → Episode list",
          "GET /anime/animepahe/episode/:id/:session  → Stream results",
        ],
        animekai: [
          "GET /anime/animekai/search/:query          → Paginated search",
          "GET /anime/animekai/spotlight              → Spotlight anime",
          "GET /anime/animekai/schedule/:date         → Airing schedule (YYYY-MM-DD)",
          "GET /anime/animekai/suggestions/:query     → Search suggestions",
          "GET /anime/animekai/recent-episodes        → Recently updated episodes",
          "GET /anime/animekai/recent-added           → Recently added series",
          "GET /anime/animekai/completed              → Latest completed series",
          "GET /anime/animekai/new-releases           → New anime releases",
          "GET /anime/animekai/movies                 → Browse anime movies",
          "GET /anime/animekai/tv                     → Browse TV series",
          "GET /anime/animekai/ova                    → Browse OVA",
          "GET /anime/animekai/ona                    → Browse ONA",
          "GET /anime/animekai/specials               → Browse specials",
          "GET /anime/animekai/genres                 → List all genres",
          "GET /anime/animekai/genre/:genre           → Search by genre",
          "GET /anime/animekai/info?id=               → Full anime info + episodes",
          "GET /anime/animekai/watch/:episodeId        → Stream sources (query: type=hardsub|softsub|dub)",
          "GET /anime/animekai/servers/:episodeId     → Episode servers (query: type=hardsub|softsub|dub)",
        ],
        toonstream: [
          "GET /anime/toonstream/home                           → Home page (featured + recent)",
          "GET /anime/toonstream/search/:query/:page?           → Search titles",
          "GET /anime/toonstream/movies/:page?                  → Browse movies",
          "GET /anime/toonstream/movies/info/:slug               → Movie details",
          "GET /anime/toonstream/movies/sources/:slug            → Movie stream sources",
          "GET /anime/toonstream/series/:page?                  → Browse series",
          "GET /anime/toonstream/series/info/:slug              → Series details + episodes",
          "GET /anime/toonstream/episode/sources/:slug          → Episode stream sources",
          "GET /anime/toonstream/m3u8-proxy?url=&headers=       → HLS playlist proxy",
          "GET /anime/toonstream/ts-segment?url=&headers=       → TS segment proxy",
          "GET /anime/toonstream/mp4-proxy?url=&headers=        → MP4 video proxy",
          "GET /anime/toonstream/fetch?url=&headers=            → Generic media fetch proxy",
        ],
        animesalt: [
          "GET /anime/animesalt/home                           → Home page (featured + recent)",
          "GET /anime/animesalt/search/:query/:page?           → Search titles",
          "GET /anime/animesalt/category/*[:page]              → Browse categories (recursive types)",
          "GET /anime/animesalt/movies/:page?                  → Browse movies",
          "GET /anime/animesalt/movies/info/:slug              → Movie details",
          "GET /anime/animesalt/movies/sources/:slug           → Movie stream sources",
          "GET /anime/animesalt/series/:page?                  → Browse series",
          "GET /anime/animesalt/series/info/:slug              → Series details + episodes",
          "GET /anime/animesalt/episode/sources/:slug          → Episode stream sources",
          "GET /anime/animesalt/m3u8-proxy?url=&headers=       → HLS playlist proxy",
          "GET /anime/animesalt/ts-segment?url=&headers=       → TS segment proxy",
          "GET /anime/animesalt/mp4-proxy?url=&headers=        → MP4 video proxy",
          "GET /anime/animesalt/fetch?url=&headers=            → Generic media fetch proxy",
        ],
      },
    }),
    {
      detail: { tags: ["anime"], summary: "Anime API Overview" },
    },
  );
