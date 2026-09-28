import { Elysia } from "elysia";
import { num, required, respond } from "../shared";
import { mangaball, type SearchOptions } from "./mangaball";

type Query = Record<string, string | undefined>;

const doc = (summary: string) => ({ detail: { tags: ["manga"], summary } });
const page = (query: Query) => num(query.page, 1);
const limit = (query: Query, fallback: number) => num(query.limit, fallback, 1, 100);

const FEEDS: [path: string, summary: string, load: (query: Query) => Promise<unknown>][] = [
  [
    "/recommendation",
    "Get Recommended Manga",
    (query) => mangaball.feed("recommended", { limit: limit(query, 12) }),
  ],
  [
    "/latest",
    "Get Latest Updated Manga",
    (query) => mangaball.feed("recently-updated", { page: page(query), limit: limit(query, 24) }),
  ],
  [
    "/new-chap",
    "Get Manga with New Chapters",
    (query) => mangaball.feed("recently-updated", { page: page(query), limit: limit(query, 24) }),
  ],
  [
    "/added",
    "Get Recently Added Manga",
    (query) => mangaball.feed("recently-added", { page: page(query), limit: limit(query, 24) }),
  ],
  [
    "/foryou",
    "Get Most Read Titles (?time=day|week|month)",
    (query) => mangaball.topChapters(query.time, limit(query, 12), true),
  ],
  [
    "/recent",
    "Get Most Read Chapters (?time=day|week|month)",
    (query) => mangaball.topChapters(query.time, limit(query, 12)),
  ],
  [
    "/popular",
    "Get Most Viewed Manga",
    (query) => mangaball.search({ sort: "views", limit: limit(query, 24) }),
  ],
  ["/origin", "Get Manga by Origin", (query) => mangaball.byOrigin(query.origin)],
  ["/filters", "Advanced Manga Search Filters", (query) => mangaball.filters(query)],
  ["/tags", "Get All Available Tags/Genres", () => mangaball.parseTags()],
  ["/tags-detail", "Get Detailed Tag Statistics", () => mangaball.parseTagsDetail()],
];

const BROWSE: [path: string, summary: string, options: SearchOptions][] = [
  ["/manga", "Browse Japanese Manga", { type: "manga" }],
  ["/manhwa", "Browse Korean Manhwa", { type: "manhwa" }],
  ["/manhua", "Browse Chinese Manhua", { type: "manhua" }],
  ["/comics", "Browse English Comics", { type: "comics" }],
  ["/ongoing", "Browse Ongoing Series", { status: "ongoing" }],
  ["/completed", "Browse Completed Series", { status: "completed" }],
  ["/on-hold", "Browse On-Hold Series", { status: "on_hold" }],
  ["/cancelled", "Browse Cancelled Series", { status: "cancelled" }],
  ["/hiatus", "Browse Series on Hiatus", { status: "hiatus" }],
];

export const mangaballRoutes = new Elysia({ prefix: "/mangaball" })
  .get(
    "/",
    () => ({
      provider: "Mangaball",
      status: "operational",
      description:
        "Mangaball is a popular online manga reading platform that offers a wide variety of manga titles across different genres. It provides users with an extensive library of manga series, including both classic and contemporary titles, along with features like personalized recommendations, user reviews, and a user-friendly interface for discovering and reading manga online.",
      message: "Mangaball provider is running. Visit /docs for available endpoints.",
    }),
    doc("Mangaball Status"),
  )
  .get(
    "/home",
    ({ set }) => respond(set, () => mangaball.parseHome()),
    doc("Get Featured Manga for Home Page"),
  )
  .get(
    "/search",
    ({ query, set }) =>
      respond(set, () =>
        mangaball.search({
          keyword: required(query.q, "q"),
          page: page(query),
          limit: limit(query, 24),
        }),
      ),
    doc("Search Manga by Title"),
  )
  .get(
    "/tags/:id_tags",
    ({ params, query, set }) =>
      respond(set, () =>
        mangaball.search({
          includedTags: [params.id_tags],
          page: page(query),
          limit: limit(query, 24),
        }),
      ),
    doc("Get Manga by Tag ID"),
  )
  .get(
    "/keyword/:keyword",
    ({ params, query, set }) =>
      respond(set, () =>
        mangaball.search({ keyword: params.keyword, page: page(query), limit: limit(query, 24) }),
      ),
    doc("Get Manga by Keyword"),
  )
  .get(
    "/detail/:slug",
    ({ params, query, set }) =>
      respond(set, () => mangaball.parseDetail(params.slug, query.lang || "en")),
    doc("Get Manga Details and Chapter List (?lang=en|all|...)"),
  )
  .get(
    "/read/:id_chapter",
    ({ params, set }) => respond(set, () => mangaball.parseRead(params.id_chapter)),
    doc("Read Manga Chapter (Get Images)"),
  )
  .get("/image/*", ({ request }) => mangaball.proxy(request), doc("Mangaball Image Proxy"));

for (const [path, summary, load] of FEEDS) {
  mangaballRoutes.get(path, ({ query, set }) => respond(set, () => load(query)), doc(summary));
}

for (const [path, summary, options] of BROWSE) {
  mangaballRoutes.get(
    path,
    ({ query, set }) =>
      respond(set, () =>
        mangaball.search({ ...options, page: page(query), limit: limit(query, 24) }),
      ),
    doc(summary),
  );
}
