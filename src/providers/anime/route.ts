import { Elysia } from "elysia";
import { animepaheRoutes } from "./animepahe/route";
import { toonstreamRoutes } from "./toonstream/route";
import { animelokAnimeRoutes } from "./animelok/route";
import { miruroRoutes } from "./miruro/route";
import { anivexaRoutes } from "./anivexa/route";

export const animeRoutes = new Elysia({ prefix: "/anime" })
  .use(animepaheRoutes)
  .use(toonstreamRoutes)
  .use(animelokAnimeRoutes)
  .use(miruroRoutes)
  .use(anivexaRoutes)

  .get(
    "/",
    () => ({
      service: "anime",
      description: "Unified anime API — provider-isolated route architecture",
      providers: ["animepahe", "toonstream", "animelok", "miruro", "anivexa"],
      endpoints: {
        animepahe: [
          "GET /anime/animepahe/search/:query         → Search titles",
          "GET /anime/animepahe/latest                → Latest updated titles",
          "GET /anime/animepahe/info/:id              → Full title details",
          "GET /anime/animepahe/episodes/:id          → Episode list",
          "GET /anime/animepahe/episode/:id/:session  → Stream results",
        ],
        toonstream: [
          "GET /anime/toonstream/home                           → Home page (featured + recent)",
          "GET /anime/toonstream/search/:query/:page?           → Search titles",
          "GET /anime/toonstream/movies/:page?                  → Browse movies",
          "GET /anime/toonstream/movies/info/:slug              → Movie details",
          "GET /anime/toonstream/movies/sources/:slug           → Movie stream sources",
          "GET /anime/toonstream/series/:page?                  → Browse series",
          "GET /anime/toonstream/series/info/:slug              → Series details + episodes",
          "GET /anime/toonstream/episode/sources/:slug          → Episode stream sources (?season=&episode= or full episode slug)",
        ],
        animelok: [
          "GET /anime/animelok/episodes/:anilistId?page={page}&pageSize={pageSize}    → Episode list",
          "GET /anime/animelok/stream/:anilistId/:episode                             → Sub/dub embed sources",
        ],
        miruro: [
          "GET /anime/miruro/search/:query               → Search titles",
          "GET /anime/miruro/suggestions/:query          → Lightweight search suggestions",
          "GET /anime/miruro/filter                      → Advanced filter",
          "GET /anime/miruro/spotlight                   → Spotlight anime",
          "GET /anime/miruro/trending                    → Trending anime",
          "GET /anime/miruro/popular                     → Popular anime",
          "GET /anime/miruro/upcoming                    → Upcoming anime",
          "GET /anime/miruro/recent                      → Recently updated/airing anime",
          "GET /anime/miruro/schedule                    → Anime schedule",
          "GET /anime/miruro/info/:id                    → Full anime info",
          "GET /anime/miruro/characters/:id              → Anime characters",
          "GET /anime/miruro/relations/:id               → Anime relations",
          "GET /anime/miruro/recommendations/:id         → Anime recommendations",
          "GET /anime/miruro/episodes/:id                → Anime episodes",
          "GET /anime/miruro/watch/:provider/:anilistId/:category/:slug → Stream sources ('all' matches any provider/category; slug ends with episode number)",
        ],
        anivexa: [
          "GET /anime/anivexa/                                                  → Provider overview",
          "GET /anime/anivexa/map/:anilistId                                    → Multi-DB ID mappings",
          "GET /anime/anivexa/episodes/:anilistId                               → All-provider episodes",
          "GET /anime/anivexa/episodes/:provider[/:provider...]/:anilistId      → Filtered episodes (?map=true|false)",
          "GET /anime/anivexa/watch/:provider/:id/sub|dub/:provider-:ep         → Stream sources",
          "GET /anime/anivexa/stream/reanime/:id/sub|dub/:ep                    → Reanime direct stream",
          "GET /anime/anivexa/stream/2dhive/:id/sub|dub/:ep                     → 2dhive direct stream",
          "GET /anime/anivexa/captcha/mkissa                                    → MKissa captcha helper",
        ],
      },
    }),
    {
      detail: { tags: ["anime"], summary: "Anime API Overview" },
    },
  );
