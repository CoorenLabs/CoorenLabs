import { Elysia, t } from "elysia";
import { StreamError } from "../embed";
import { vidfast } from "./vidfast";

type Status = { status?: number | string };

async function respond(set: Status, load: () => Promise<unknown>) {
  try {
    return await load();
  } catch (error) {
    set.status = error instanceof StreamError ? error.status : 500;
    return { error: (error as Error).message };
  }
}

export const vidfastRoutes = new Elysia({ prefix: "/vidfast" })
  .get("/", () => ({
    provider: "vidfast",
    status: "active",
    type: "stream",
    capabilities: ["movie", "tv"],
  }))
  .get(
    "/watch",
    ({ query: { type, id, s, e }, set }) => {
      if (type === "movie") return respond(set, () => vidfast.fetchMovie(id));
      if (type === "tv" && s && e) return respond(set, () => vidfast.fetchTv(id, s, e));
      set.status = 400;
      return { error: "Invalid parameters." };
    },
    {
      query: t.Object({
        type: t.String(),
        id: t.String(),
        s: t.Optional(t.String()),
        e: t.Optional(t.String()),
      }),
    },
  )
  .get("/movie/:id", ({ params: { id }, set }) => respond(set, () => vidfast.fetchMovie(id)))
  .get("/tv/:id/:season/:episode", ({ params: { id, season, episode }, set }) =>
    respond(set, () => vidfast.fetchTv(id, season, episode)),
  );
