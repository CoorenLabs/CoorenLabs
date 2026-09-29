import { Elysia } from "elysia";
import { num, required, respond } from "../shared";
import { atsu, type Section } from "./atsu";

const doc = (summary: string) => ({ detail: { tags: ["manga"], summary } });

const SECTIONS: [path: string, section: Section, summary: string][] = [
  ["/trending", "trending", "Trending"],
  ["/most-bookmarked", "mostBookmarked", "Most Bookmarked"],
  ["/hot-updates", "recentlyUpdated", "Hot Updates"],
  ["/top-rated", "topRated", "Top Rated"],
  ["/popular", "popular", "Popular"],
  ["/recently-added", "recentlyAdded", "Recently Added"],
];

function catalog(adult: boolean) {
  const label = adult ? "Atsu Adult" : "Atsu";
  const app = new Elysia(adult ? { prefix: "/adult" } : {})
    .get("/home", ({ set }) => respond(set, () => atsu.parseHome(adult)), doc(`${label} Home`))
    .get(
      "/explore",
      ({ query, set }) =>
        respond(set, () =>
          atsu.explore({
            genres: query.genres,
            types: query.types,
            statuses: query.statuses,
            page: num(query.page, 0, 0),
            adult,
          }),
        ),
      doc(`${label} Explore`),
    )
    .get(
      "/genre/:slug",
      ({ params, query, set }) =>
        respond(set, () =>
          atsu.explore({ genres: params.slug, page: num(query.page, 0, 0), adult }),
        ),
      doc(`${label} Genre`),
    )
    .get(
      "/author/:slug",
      ({ params, query, set }) =>
        respond(set, () => atsu.fetchAuthor(params.slug, num(query.page, 0, 0), query.type, adult)),
      doc(`${label} Author`),
    );

  for (const [path, section, summary] of SECTIONS) {
    app.get(
      path,
      ({ query, set }) =>
        respond(set, () =>
          atsu.fetchSection(section, num(query.page, 0, 0), adult, {
            types: query.types,
            timeframe: section === "mostBookmarked" ? query.timeframe || "7" : undefined,
          }),
        ),
      doc(`${label} ${summary}`),
    );
  }
  return app;
}

export const atsuRoutes = new Elysia({ prefix: "/atsu" })
  .get(
    "/",
    () => ({
      provider: "Atsu",
      status: "operational",
      description:
        "Atsu is a sleek online manga reading platform that offers a wide variety of manga, manhwa, and manhua titles across different genres. It provides users with an extensive, high-quality library, including both classic and contemporary titles, along with features like personalized recommendations, trending sections, and a user-friendly interface for discovering and reading comics online.",
      message: "Atsu provider is running. Visit /docs for available endpoints.",
    }),
    doc("Atsu Status"),
  )
  .use(catalog(false))
  .use(catalog(true))
  .get(
    "/detail/:id",
    ({ params, set }) => respond(set, () => atsu.fetchMangaDetails(params.id)),
    doc("Atsu Detail"),
  )
  .get(
    "/info/:id",
    ({ params, set }) => respond(set, () => atsu.fetchChapterInfo(params.id)),
    doc("Atsu Chapter Info"),
  )
  .get(
    "/read",
    ({ query, set }) =>
      respond(set, () =>
        atsu.fetchChapterPages(
          required(query.mangaId, "mangaId"),
          required(query.chapterId, "chapterId"),
        ),
      ),
    doc("Atsu Read Chapter Pages"),
  )
  .get("/filters", ({ set }) => respond(set, () => atsu.fetchFilters()), doc("Atsu Filters"))
  .get("/image/*", ({ request }) => atsu.proxy(request), doc("Atsu Image Proxy"));
