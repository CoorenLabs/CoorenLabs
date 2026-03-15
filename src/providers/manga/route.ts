import { Elysia } from "elysia";
import { mangaballRoutes } from "./mangaball/route";
import { allmangaRoutes } from "./allmanga/route";
import { atsuRoutes } from "./atsu/route";

export const mangaRoutes = new Elysia({ prefix: "/manga" })
  .get("/", () => {
    return {
      service: "manga",
      description: "Unified manga API — provider-isolated route architecture",
      providers: ["mangaball", "allmanga", "atsu"],
      endpoints: {
        mangaball: [
          "GET /manga/mangaball/home          → Featured titles and banners",
          "GET /manga/mangaball/latest        → Latest updated titles",
          "GET /manga/mangaball/recommendation→ Recommended titles",
          "GET /manga/mangaball/popular       → Popular titles this season",
          "GET /manga/mangaball/added         → Recently added titles",
          "GET /manga/mangaball/new-chap      → Titles with new chapters",
          "GET /manga/mangaball/foryou        → Personalized suggestions (?time=day|week|month|year)",
          "GET /manga/mangaball/recent        → Recent chapter reads (?time=day|week|month|year)",
          "GET /manga/mangaball/search        → Search titles (?q=query&page=1)",
          "GET /manga/mangaball/filters       → Advanced filtering with tags and sorts",
          "GET /manga/mangaball/manga         → Browse Japanese Manga",
          "GET /manga/mangaball/manhwa        → Browse Korean Manhwa",
          "GET /manga/mangaball/manhua        → Browse Chinese Manhua",
          "GET /manga/mangaball/comics        → Browse English Comics",
          "GET /manga/mangaball/ongoing       → Browse ongoing series",
          "GET /manga/mangaball/completed     → Browse completed series",
          "GET /manga/mangaball/detail/:slug  → Full title details and chapter list",
          "GET /manga/mangaball/read/:id      → Chapter images and metadata",
          "GET /manga/mangaball/tags          → List all available tags/genres",
          "GET /manga/mangaball/tags-detail   → Detailed tag statistics",
          "GET /manga/mangaball/image/* → Image proxy for bypass"
        ],
        allmanga: [
          "GET /manga/allmanga/home           → Home Page (Popular, Latest, Tags, Random)",
          "GET /manga/allmanga/latest         → Latest updated titles (?page=1)",
          "GET /manga/allmanga/popular        → Popular titles (?page=1&period=daily|weekly|monthly|all)",
          "GET /manga/allmanga/random         → Random recommendations",
          "GET /manga/allmanga/search         → Search titles (?q=query&page=1)",
          "GET /manga/allmanga/tags           → List all available tags, genres, and magazines",
          "GET /manga/allmanga/genre/:genre   → Search titles by genre/tag slug (?page=1)",
          "GET /manga/allmanga/author/:author → Search titles by author slug (?page=1)",
          "GET /manga/allmanga/detail         → Full title details and chapter list (?id=MangaID)",
          "GET /manga/allmanga/read           → Chapter images and metadata (?id=ChapterID)",
          "GET /manga/allmanga/image/* → Image proxy for CDN bypass"
        ],
        atsu: [ 
          "--- STANDARD ENDPOINTS ---",
          "GET /manga/atsu/home               → Get All Home Sections combined",
          "GET /manga/atsu/trending           → Trending titles (?page=0&types=Manga,Manwha)",
          "GET /manga/atsu/most-bookmarked    → Most Bookmarked titles (?page=0&timeframe=1|7|30&types=Manga,Manwha)",
          "GET /manga/atsu/hot-updates        → Hot Updates (?page=0&types=Manga,Manwha)",
          "GET /manga/atsu/top-rated          → Top Rated titles (?page=0&types=Manga,Manwha)",
          "GET /manga/atsu/popular            → Popular titles (?page=0&types=Manga,Manwha)",
          "GET /manga/atsu/recently-added     → Recently added titles (?page=0&types=Manga,Manwha)",
          "",
          "--- DISCOVERY & FILTERS ---",
          "GET /manga/atsu/filters            → List all valid Genre/Type/Status slugs",
          "GET /manga/atsu/explore            → Filtered search (?genres=ID&types=ID&statuses=ID&page=0)",
          "GET /manga/atsu/genre/:slug        → Browse titles by genre ID (?page=0)",
          "",
          "--- CONTENT ENDPOINTS ---",
          "GET /manga/atsu/detail/:id         → Full title details and complete chapter list",
          "GET /manga/atsu/info/:id           → Lightweight metadata + chapter list",
          "GET /manga/atsu/read               → Fetch pages for a chapter (?mangaId=...&chapterId=...)",
          "",
          "--- ADULT (18+) ENDPOINTS ---",
          "GET /manga/atsu/adult/home             → Get All Adult Home Sections combined",
          "GET /manga/atsu/adult/explore          → Filtered Adult search (?genres=ID&types=ID&statuses=ID&page=0)",
          "GET /manga/atsu/adult/genre/:slug      → Browse Adult titles by genre ID (?page=0)",
          "GET /manga/atsu/adult/author/:slug     → Browse Adult titles by author ID (?page=0)",
          "GET /manga/atsu/adult/trending         → Trending Adult titles (?page=0)",
          "GET /manga/atsu/adult/most-bookmarked  → Most Bookmarked Adult titles (?page=0&timeframe=1|7|30)",
          "GET /manga/atsu/adult/hot-updates      → Hot Updates for Adult titles (?page=0)",
          "GET /manga/atsu/adult/top-rated        → Top Rated Adult titles (?page=0)",
          "GET /manga/atsu/adult/popular          → Popular Adult titles (?page=0)",
          "GET /manga/atsu/adult/recently-added   → Recently added Adult titles (?page=0)",
          "",
          "--- UTILS ---",
          "GET /manga/atsu/image/* → Image proxy for bypass"
        ]
      }
    };
  }, {
    detail: { 
      tags: ['manga'], 
      summary: 'Manga API Overview' 
    }
  })
  .use(mangaballRoutes)
  .use(allmangaRoutes)
  .use(atsuRoutes);
