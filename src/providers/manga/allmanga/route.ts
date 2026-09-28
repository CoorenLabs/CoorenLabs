import { Elysia } from "elysia";
import { num, required, respond } from "../shared";
import { allmanga } from "./allmanga";

const doc = (summary: string) => ({ detail: { tags: ["manga"], summary } });

export const allmangaRoutes = new Elysia({ prefix: "/allmanga" })
  .get(
    "/",
    () => ({
      provider: "AllManga",
      status: "operational",
      description:
        "AllManga is a comprehensive manga database and reading platform offering a vast collection of manga titles across various genres. It provides users with an extensive library of manga series, including popular titles and hidden gems, along with features like personalized recommendations, user reviews, and a user-friendly interface for discovering and reading manga online.",
      message: "AllManga provider is running. Visit /docs for available endpoints.",
    }),
    doc("AllManga Status"),
  )
  .get("/home", ({ set }) => respond(set, () => allmanga.parseHome()), doc("AllManga Home"))
  .get(
    "/search",
    ({ query, set }) =>
      respond(set, () => allmanga.parseSearch(required(query.q, "q"), num(query.page, 1))),
    doc("AllManga Search"),
  )
  .get(
    "/latest",
    ({ query, set }) => respond(set, () => allmanga.parseSearch("", num(query.page, 1))),
    doc("AllManga Latest Updates"),
  )
  .get(
    "/popular",
    ({ query, set }) =>
      respond(set, () =>
        allmanga.parsePopular(
          num(query.page, 1),
          num(query.size, 20, 1, 100),
          query.period || "daily",
        ),
      ),
    doc("AllManga Popular (daily, weekly, monthly, all)"),
  )
  .get(
    "/random",
    ({ set }) => respond(set, () => allmanga.parseRandom()),
    doc("AllManga Random Recommendations"),
  )
  .get(
    "/tags",
    ({ query, set }) => respond(set, () => allmanga.parseTags(num(query.page, 1))),
    doc("AllManga List All Available Tags/Genres"),
  )
  .get(
    "/genre/:genre",
    ({ params, query, set }) =>
      respond(set, () => allmanga.parseSearch("", num(query.page, 1), { genres: [params.genre] })),
    doc("AllManga Search By Genre Slug"),
  )
  .get(
    "/author/:author",
    ({ params, query, set }) =>
      respond(set, () =>
        allmanga.parseSearch("", num(query.page, 1), { authors: [params.author] }),
      ),
    doc("AllManga Search By Author Slug"),
  )
  .get(
    "/detail",
    ({ query, set }) => respond(set, () => allmanga.parseDetail(required(query.id, "id"))),
    doc("AllManga Detail"),
  )
  .get(
    "/read",
    ({ query, set }) => respond(set, () => allmanga.parseRead(required(query.id, "id"))),
    doc("AllManga Read Chapter Pages"),
  )
  .get("/image/*", ({ request }) => allmanga.proxy(request), doc("AllManga Image Proxy"));
