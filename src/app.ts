import cors from "@elysiajs/cors";
import openapi from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { CORS_CREDENTIALS, CORS_ORIGIN, NODE_ENV, validateConfig } from "./core/config";
import { mappingRoutes } from "./core/mappingRoutes";
import { proxyRoutes } from "./core/proxyRoutes";
import { isNode } from "./core/runtime";
import { animeRoutes } from "./providers/anime/route";
import { mangaRoutes } from "./providers/manga/route";
import { metaRoutes } from "./providers/meta/route";
import { movieTvRoutes } from "./providers/movie-tv/route";
import { musicRoutes } from "./providers/music/route";
import { streamRoutes } from "./providers/stream/route";

const VERSION = "3.0.0";

const documentation = openapi({
  path: "/docs",
  documentation: {
    info: { title: "Cooren API", version: VERSION },
    tags: [
      { name: "anime", description: "📺 Anime Providers & Mappings" },
      { name: "meta", description: "🔍 Meta Providers — AniList-backed anime discovery" },
      { name: "manga", description: "📚 Manga Providers (e.g., Mangaball, Atsu)" },
      { name: "movie", description: "🍿 Movie & TV Providers" },
      { name: "stream", description: "⚡ Direct Stream Providers" },
      { name: "proxy", description: "🥷 Utilities" },
    ],
  },
});

validateConfig();

const adapter = isNode ? (await import("@elysiajs/node")).node() : undefined;

const app = new Elysia({ adapter, serve: { idleTimeout: 120 } })
  .use(
    cors({
      origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN.split(","),
      credentials: CORS_CREDENTIALS,
    }),
  )
  .onRequest(({ request }) => {
    const url = new URL(request.url);
    if (url.pathname.includes("//")) {
      url.pathname = url.pathname.replace(/\/{2,}/g, "/");
      return Response.redirect(url.href, 301);
    }
  })
  .use(documentation)
  .get(
    "/",
    () => ({
      name: "Cooren API",
      version: VERSION,
      repo: "https://github.com/CoorenLabs/CoorenLabs.git",
      environment: NODE_ENV,
      about:
        "Cooren is a high-performance, scalable scraping engine designed to collect, organize, and deliver structured data from across the world of anime, movies, manga, and music, all in one unified ecosystem",
      status: "operational",
    }),
    { detail: { tags: ["core"], summary: "System Status & API Overview" } },
  )
  .use(movieTvRoutes)
  .use(animeRoutes)
  .use(mangaRoutes)
  .use(musicRoutes)
  .use(streamRoutes)
  .use(metaRoutes)
  .use(proxyRoutes)
  .use(mappingRoutes);

export default app;
