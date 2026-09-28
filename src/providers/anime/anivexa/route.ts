import { Elysia } from "elysia";
import anivexaWorker, { PROVIDER_NAMES, ROUTES } from "./index.js";

const BASE_PATH = "/anime/anivexa";

export const anivexaRoutes = new Elysia({ prefix: "/anivexa" })
  .get(
    "/",
    () => ({
      service: "anivexa",
      description: "Anivexa — multi-provider anime episode & stream API (AniList-ID-based)",
      version: "2.2.1",
      providers: PROVIDER_NAMES,
      endpoints: ROUTES.map((route) => `GET ${BASE_PATH}${route}`),
    }),
    { detail: { tags: ["anime"], summary: "Anivexa — Provider Overview" } },
  )
  .get("/*", ({ request }) => {
    const url = new URL(request.url);
    url.pathname = url.pathname.replace(/^\/anime\/anivexa/, "") || "/";
    return anivexaWorker.fetch(new Request(url, { headers: request.headers }), {
      basePath: BASE_PATH,
    });
  });
