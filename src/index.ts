import cors from "@elysiajs/cors";
import openapi from "@elysiajs/openapi";
import { Elysia } from "elysia";
import {
  CORS_CREDENTIALS,
  CORS_ORIGIN,
  OPENAPI_VERSION,
  PORT,
  REPO_URL,
  validateConfig
} from "./core/config";
import { Logger } from "./core/logger";
import { mappingRoutes } from "./core/mappingRoutes";
import { proxyRoutes } from "./core/proxyRoutes";
import { animeRoutes } from "./providers/anime/route";
import { yFlixRoutes } from "./providers/yflix/route";
import { mangaRoutes } from "./providers/manga/route";
import { tidalRoutes } from "./providers/tidal/route";

validateConfig();

const app = new Elysia()
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
  path: '/swagger', //Todo : Snozxyx (Fix : Make this /docs and add a redirect from /docs to /swagger)
  documentation: {
    info: {
      title: 'Mangaball API Documentation',
      version: '1.0.0',
    }
  }
}));

app
  .get("/", () => {
    return {
      name: "Cooren API",
      version: OPENAPI_VERSION,
      repo: REPO_URL,
      environment: process.env.NODE_ENV || "development",
      about: "Cooren is a high-performance, scalable scraping engine designed to collect, organize, and deliver structured data from across the world of anime, movies, manga, and music, all in one unified ecosystem",
      status: "operational"
    };
  })
  .use(animeRoutes)
  .use(yFlixRoutes)
  .use(animeRoutes)
  .use(mangaRoutes)
  .use(tidalRoutes)
  .use(proxyRoutes)
  .use(mappingRoutes)
  .get("/tidal-demo", () => Bun.file("tests/tidal_demo.html"))
  .onError(({ code, error, set }: { code: string, error: Error, set: any }) => {
    if (code === 'NOT_FOUND') {
      set.status = 404;
      return { status: 404, success: false, message: "Route not found", data: null };
    }
    set.status = 500;
    return { status: 500, success: false, message: error.message || "Internal Server Error", data: null };
  });

  
app.listen(PORT);

Logger.info(
  `Started at ${app.server?.protocol}://${app.server?.hostname}:${PORT}`,
);
