import cors from "@elysiajs/cors";
import openapi from "@elysiajs/openapi";
import { node } from "@elysiajs/node";
import { Elysia } from "elysia";
import {
  CORS_CREDENTIALS,
  CORS_ORIGIN,
  OPENAPI_VERSION,
  PORT,
  validateConfig
} from "./core/config";
import { Logger } from "./core/logger";
import { mappingRoutes } from "./core/mappingRoutes";
import { proxyRoutes } from "./core/proxyRoutes";
import { animeRoutes } from "./providers/anime/route";
import { mangaRoutes } from "./providers/manga/route";
import { movieTvRoutes } from "./providers/movie-tv/route";
import { musicRoutes } from "./providers/music/route";
import { streamRoutes } from "./providers/stream/route";


validateConfig();

const isBun = typeof Bun !== "undefined";

const app = new Elysia({ adapter: isBun ? undefined : node() })
  .use(cors({
    origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN.split(","),
    credentials: CORS_CREDENTIALS,
  }))
  .onBeforeHandle(({ request }: { request: Request }) => {
    // Normalize paths: remove double slashes and trailing slashes
    const url = new URL(request.url);
    if (url.pathname.includes("//") || (url.pathname.length > 1 && url.pathname.endsWith("/"))) {
      const normalizedPath = url.pathname.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
      if (normalizedPath !== url.pathname) {
        return Response.redirect(url.origin + normalizedPath + url.search, 301);
      }
    }
  });

app.use(openapi({
  path: '/docs',
  documentation: {
    info: {
      title: 'Cooren API',
      version: '1.0.0'
    },
    tags: [
      { name: 'anime', description: '📺 Anime Providers & Mappings' },
      { name: 'manga', description: '📚 Manga Providers (e.g., Mangaball, Atsu)' },
      { name: 'movie', description: '🍿 Movie & TV Providers' },
      { name: 'stream', description: '⚡ Direct Stream Providers (e.g., Peachify)' }, // <-- Added Stream Tag
      { name: 'proxy', description: '🥷 Utilities' }
    ]
  }
}));

app
  .get("/", () => {
    return {
      name: "Cooren API",
      version: OPENAPI_VERSION,
      repo: "https://github.com/CoorenLabs/Cooren.git",
      environment: process.env.NODE_ENV || "development",
      about: "Cooren is a high-performance, scalable scraping engine designed to collect, organize, and deliver structured data from across the world of anime, movies, manga, and music, all in one unified ecosystem",
      status: "operational"
    };
  }, {
    detail: { 
      tags: ['core'], 
      summary: 'System Status & API Overview' 
    }
  })
  .use(movieTvRoutes)
  .use(animeRoutes)
  .use(mangaRoutes)
  .use(musicRoutes)
  .use(streamRoutes)
  .use(proxyRoutes)
  .use(mappingRoutes)

app.listen(PORT);

Logger.info(
  `Started at ${app.server?.protocol || "http"}://${app.server?.hostname || "localhost"}:${PORT}`,
);