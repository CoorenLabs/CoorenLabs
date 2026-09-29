import { Elysia } from "elysia";
import { StreamError } from "../embed";
import { vidcore } from "./vidcore";

type Status = { status?: number | string };

const ok = (data: unknown) => ({ status: 200, success: true, data });
const err = (set: Status, status: number, message: string) => {
  set.status = status;
  return { status, success: false, message, data: null };
};

async function respond(set: Status, load: () => Promise<unknown>) {
  try {
    return ok(await load());
  } catch (error) {
    return err(set, error instanceof StreamError ? error.status : 500, (error as Error).message);
  }
}

export const vidcoreRoutes = new Elysia({ prefix: "/vidcore" })
  .get("/", () => ({
    provider: "Vidcore",
    status: "operational",
    description:
      "Vidcore is a streaming provider that supplies encrypted video sources and multi-language subtitles.",
    message: "Vidcore provider is running. Visit /docs for available endpoints.",
  }))
  .get("/watch", ({ query, set }) => {
    const { type, id, s, e } = query;
    if (!id) return err(set, 400, "TMDB ID is required (?id=...)");
    if (type === "movie") return respond(set, () => vidcore.fetchMovie(id));
    if (type !== "tv") return err(set, 400, "Invalid type. Must be 'movie' or 'tv'");
    if (!s || !e) return err(set, 400, "Season (?s=) and Episode (?e=) are required for TV shows");
    return respond(set, () => vidcore.fetchTv(id, s, e));
  })
  .get("/movie/:id", ({ params, set }) => respond(set, () => vidcore.fetchMovie(params.id)))
  .get("/tv/:id/:season/:episode", ({ params, set }) =>
    respond(set, () => vidcore.fetchTv(params.id, params.season, params.episode)),
  );
