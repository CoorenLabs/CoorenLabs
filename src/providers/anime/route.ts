import { Elysia } from "elysia";
import { animekaiRoutes } from "./animekai/route";
import { animepaheRoutes } from "./animepahe/route";
import { toonstreamRoutes } from "./toonstream/route";
import { animesaltRoutes } from "./animesalt/route";
import { animesaturnRoutes } from "./animesaturn/route";
import { animeunityRoutes } from "./animeunity/route";
import { animelokAnimeRoutes } from "./animelok/route";
import { miruroRoutes } from "./miruro/route";
import { anivexaRoutes } from "./anivexa/route";

export const animeRoutes = new Elysia({ prefix: "/anime" })
  .use(animepaheRoutes)
  .use(animekaiRoutes)
  .use(toonstreamRoutes)
  .use(animesaltRoutes)
  .use(animesaturnRoutes)
  .use(animeunityRoutes)
  .use(animelokAnimeRoutes)
  .use(miruroRoutes)
  .use(anivexaRoutes)

  // ─── Overview Endpoint ────────────────────────────────────────────────────────
  .get(
    "/",
    () => ({
      service: "anime",
      description: "Unified anime API — provider-isolated route architecture",
      providers: ["animepahe", "animekai", "toonstream", "animesalt", "animesaturn", "animeunity"],
      providers: ["animepahe", "animekai", "toonstream", "animesalt", "looker", "miruro", "anivexa"],
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
          "GET /anime/animekai/watch/:episodeId       → Stream sources (query: dub)",
          "GET /anime/animekai/servers/:episodeId     → Episode servers (query: dub)",
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
        animesaturn: [
          "GET /anime/animesaturn/search/:query                → Search titles",
          "GET /anime/animesaturn/info/:id                     → Full anime info + episodes",
          "GET /anime/animesaturn/watch/*                      → Stream sources (pass the full episode ID from info)",
        ],
        animeunity: [
          "GET /anime/animeunity/search/:query                 → Search titles",
          "GET /anime/animeunity/info/:id                      → Full anime info + episodes",
          "GET /anime/animeunity/watch/*                       → Stream sources (format: animeId/epId)",
        looker: [
          "GET /anime/animelok/episodes/:anilistId?title={title}&page={page}&lang={lang}&pageSize={pageSize}    → Episode list",
          "GET /anime/animelok/stream/:anilistId/:episode?title={title}&lang={lang}&quality={quality}           → Stream sources",
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
          "GET /anime/miruro/watch/:provider/:anilistId/:category/:slug → Stream sources",
        ],
        anivexa: [
          "GET /anime/anivexa/                                                  → Provider overview",
          "GET /anime/anivexa/map/:anilistId                                    → Multi-DB ID mappings",
          "GET /anime/anivexa/episodes/:anilistId                               → All-provider episodes",
          "GET /anime/anivexa/episodes/:provider[/:provider...]/:anilistId      → Filtered episodes (?map=true|false)",
          "GET /anime/anivexa/watch/:provider/:id/sub|dub/:provider-:ep         → Stream sources",
          "GET /anime/anivexa/stream/reanime/:id/sub|dub/:ep                    → Reanime direct stream",
          "GET /anime/anivexa/stream/2dhive/:id/sub|dub/:ep                     → 2dhive direct stream",
          "GET /anime/anivexa/stream/2dhive/download/:id/sub|dub/:ep            → 2dhive download stream",
          "GET /anime/anivexa/captcha/mkissa                                    → MKissa captcha helper",
        ],
      },
    }),
    {
      detail: { tags: ["anime"], summary: "Anime API Overview" },
    },
  );
