import { Elysia, t } from "elysia";
import { Miruro } from "./miruro";

type Query = Record<string, string | undefined>;

const int = (value: string | undefined, fallback: number) => parseInt(value ?? "") || fallback;

const listQuery = t.Object({
  page: t.Optional(t.String()),
  perPage: t.Optional(t.String()),
  allowAll: t.Optional(t.String()),
});

const pageQuery = t.Object({
  page: t.Optional(t.String()),
  perPage: t.Optional(t.String()),
});

const idParams = t.Object({ id: t.String() });

async function orFail<T>(
  result: Promise<T | null>,
  set: { status?: number | string },
  status: number,
  message: string,
) {
  const data = await result;
  if (data) return data;
  set.status = status;
  return { message };
}

const detail = (summary: string, description: string) => ({
  tags: ["miruro"],
  summary: `Miruro — ${summary}`,
  description,
});

const collection =
  (load: (page: number, perPage: number, allowAll: boolean) => Promise<unknown>, name: string) =>
  ({ query, set }: { query: Query; set: { status?: number | string } }) =>
    orFail(
      load(int(query.page, 1), int(query.perPage, 20), query.allowAll === "true"),
      set,
      500,
      `${name} failed`,
    );

export const miruroRoutes = new Elysia({ prefix: "/miruro" })

  .get("/", () => ({
    name: "miruro",
    version: "1.0",
    description: "Anime provider backed by AniList metadata and the Miruro catalog API.",
    endpoints: [
      "/search/:query?page=&perPage= → Search anime",
      "/suggestions/:query           → Lightweight search suggestions",
      "/filter                       → Advanced filter",
      "/spotlight                    → Spotlight anime",
      "/trending                     → Trending anime",
      "/popular                      → Popular anime",
      "/upcoming                     → Upcoming anime",
      "/recent                       → Recently updated/airing anime",
      "/schedule                     → Anime schedule",
      "/info/:id                     → Full anime info",
      "/characters/:id               → Anime characters",
      "/relations/:id                → Anime relations",
      "/recommendations/:id          → Anime recommendations",
      "/episodes/:id                 → Anime episodes",
      "/watch/:provider/:anilistId/:category/:slug → Watch stream sources ('all' matches any provider/category)",
    ],
  }))

  .get(
    "/search/:query",
    ({ params, query, set }) =>
      orFail(
        Miruro.search(params.query, int(query.page, 1), int(query.perPage, 20)),
        set,
        500,
        "Search failed",
      ),
    {
      params: t.Object({ query: t.String() }),
      query: pageQuery,
      detail: detail("Search", "Search anime by name. Returns full metadata per result."),
    },
  )

  .get(
    "/suggestions/:query",
    ({ params, set }) => orFail(Miruro.suggestions(params.query), set, 500, "Suggestions failed"),
    {
      params: t.Object({ query: t.String() }),
      detail: detail("Suggestions", "Lightweight search for autocomplete / dropdown."),
    },
  )

  .get("/filter", ({ query, set }) => orFail(Miruro.filter(query), set, 500, "Filter failed"), {
    detail: detail("Filter", "Advanced filter / browse. Combine any filters."),
  })

  .get(
    "/spotlight",
    ({ query, set }) =>
      orFail(Miruro.spotlight(query.allowAll === "true"), set, 500, "Spotlight failed"),
    {
      query: t.Object({ allowAll: t.Optional(t.String()) }),
      detail: detail("Spotlight", "The ultra-curated 'What's Hot' list."),
    },
  )

  .get("/trending", collection(Miruro.trending.bind(Miruro), "Trending"), {
    query: listQuery,
    detail: detail("Trending", "Currently trending anime across the community."),
  })

  .get("/popular", collection(Miruro.popular.bind(Miruro), "Popular"), {
    query: listQuery,
    detail: detail("Popular", "Most popular anime of all time by total user count."),
  })

  .get("/upcoming", collection(Miruro.upcoming.bind(Miruro), "Upcoming"), {
    query: listQuery,
    detail: detail("Upcoming", "Most anticipated anime that haven't aired yet."),
  })

  .get("/recent", collection(Miruro.recent.bind(Miruro), "Recent"), {
    query: listQuery,
    detail: detail("Recent", "Currently airing / this season's anime."),
  })

  .get(
    "/schedule",
    ({ query, set }) =>
      orFail(
        Miruro.schedule(int(query.page, 1), int(query.perPage, 20)),
        set,
        500,
        "Schedule failed",
      ),
    { query: pageQuery, detail: detail("Schedule", "Next episodes airing soon.") },
  )

  .get(
    "/info/:id",
    ({ params, set }) => orFail(Miruro.info(params.id), set, 404, "Anime info not found"),
    { params: idParams, detail: detail("Info", "Complete anime page data.") },
  )

  .get(
    "/characters/:id",
    ({ params, query, set }) =>
      orFail(
        Miruro.characters(params.id, int(query.page, 1), int(query.perPage, 25)),
        set,
        404,
        "Anime characters not found",
      ),
    {
      params: idParams,
      query: pageQuery,
      detail: detail("Characters", "Paginated character list."),
    },
  )

  .get(
    "/relations/:id",
    ({ params, set }) => orFail(Miruro.relations(params.id), set, 404, "Anime relations not found"),
    { params: idParams, detail: detail("Relations", "All related media for an anime.") },
  )

  .get(
    "/recommendations/:id",
    ({ params, query, set }) =>
      orFail(
        Miruro.recommendations(params.id, int(query.page, 1), int(query.perPage, 10)),
        set,
        404,
        "Anime recommendations not found",
      ),
    {
      params: idParams,
      query: pageQuery,
      detail: detail("Recommendations", "Community recommendations for an anime."),
    },
  )

  .get(
    "/episodes/:id",
    ({ params, set }) => orFail(Miruro.episodes(params.id), set, 404, "Episodes not found"),
    {
      params: idParams,
      detail: detail(
        "Episodes",
        "Episode list for an AniList ID; each episode id is a ready-made watch path.",
      ),
    },
  )

  .get(
    "/watch/:provider/:anilistId/:category/:slug",
    ({ params: { provider, anilistId, category, slug }, set }) =>
      orFail(
        Miruro.watch(provider, anilistId, category, slug),
        set,
        404,
        "Stream sources not found",
      ),
    {
      params: t.Object({
        provider: t.String(),
        anilistId: t.String(),
        category: t.String(),
        slug: t.String(),
      }),
      detail: detail(
        "Watch",
        "Stream sources for an episode. provider (e.g. anikoto, icarus, kickassanime) and category (sub, dub, ssub) accept 'all'; slug ends with the episode number. Streams include a proxiedUrl that carries the required headers.",
      ),
    },
  );
