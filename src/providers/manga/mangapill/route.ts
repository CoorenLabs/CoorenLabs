import { Elysia } from "elysia";
import { required, respond } from "../shared";
import { mangapill } from "./mangapill";

const doc = (summary: string) => ({ detail: { tags: ["manga"], summary } });

export const mangapillRoutes = new Elysia({ prefix: "/mangapill" })
  .get(
    "/",
    () => ({
      provider: "MangaPill",
      status: "operational",
      description:
        "MangaPill is a free online manga reader with a large catalogue of manga, manhwa and manhua, offering fast chapter updates and a simple, lightweight reading experience.",
      message: "MangaPill provider is running. Visit /docs for available endpoints.",
    }),
    doc("MangaPill Status"),
  )
  .get(
    "/search",
    ({ query, set }) => respond(set, () => mangapill.search(required(query.q?.trim(), "q"))),
    doc("MangaPill Search (?q=query)"),
  )
  .get(
    "/detail/:id",
    ({ params, set }) => respond(set, () => mangapill.detail(params.id)),
    doc("MangaPill Manga Details and Chapter List"),
  )
  .get(
    "/read/:chapterId",
    ({ params, set }) => respond(set, () => mangapill.read(params.chapterId)),
    doc("MangaPill Read Chapter (chapterId from detail)"),
  )
  .get("/image/*", ({ request }) => mangapill.proxy(request), doc("MangaPill Image Proxy"));
