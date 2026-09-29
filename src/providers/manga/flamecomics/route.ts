import { Elysia } from "elysia";
import { required, respond } from "../shared";
import { flamecomics } from "./flamecomics";

const doc = (summary: string) => ({ detail: { tags: ["manga"], summary } });

export const flamecomicsRoutes = new Elysia({ prefix: "/flamecomics" })
  .get(
    "/",
    () => ({
      provider: "FlameComics",
      status: "operational",
      description:
        "Flame Comics is a scanlation group publishing English translations of manhwa, manhua and manga, with a catalogue of popular action and fantasy series updated weekly.",
      message: "FlameComics provider is running. Visit /docs for available endpoints.",
    }),
    doc("FlameComics Status"),
  )
  .get(
    "/search",
    ({ query, set }) => respond(set, () => flamecomics.search(required(query.q?.trim(), "q"))),
    doc("FlameComics Search (?q=query)"),
  )
  .get(
    "/detail/:id",
    ({ params, set }) => respond(set, () => flamecomics.detail(params.id)),
    doc("FlameComics Series Details and Chapter List"),
  )
  .get(
    "/read/:mangaId/:token",
    ({ params, set }) => respond(set, () => flamecomics.read(params.mangaId, params.token)),
    doc("FlameComics Read Chapter (mangaId + chapter token from detail)"),
  );
