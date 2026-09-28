import { Elysia, t } from "elysia";
import { Primesrc } from "./primesrc";

export const primesrcRoutes = new Elysia({ prefix: "/primesrc" })
  .get("/", () => ({
    name: "Primesrc",
    endpoints: ["/primesrc/movie/{tmdbId}", "/primesrc/tv/{tmdbId}/{season}/{episode}"],
  }))
  .get(
    "/movie/:tmdbid",
    async ({ params: { tmdbid }, set }) => {
      const result = await Primesrc.getMovieSource(Number(tmdbid));
      set.status = result.status;
      return result;
    },
    { params: t.Object({ tmdbid: t.Numeric() }) },
  )
  .get(
    "/tv/:tmdbid/:season/:episode",
    async ({ params: { tmdbid, season, episode }, set }) => {
      const result = await Primesrc.getTvSource(Number(tmdbid), Number(season), Number(episode));
      set.status = result.status;
      return result;
    },
    { params: t.Object({ tmdbid: t.Numeric(), season: t.Numeric(), episode: t.Numeric() }) },
  );
