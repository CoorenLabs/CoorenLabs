import Elysia, { t } from "elysia";
import { Primesrc } from "./primesrc";


const prefix = "primesrc"

export const primesrcRoutes = new Elysia({ prefix: `/${prefix}` })
    .get("/", () => {
        return {
            name: "Primesrc",
            endpoints: [
                `/${prefix}/movie/{tmdbId}`,
                `/${prefix}/tv/{tmdbId}/{season}/{episode}`
            ]
        }
    })
    .get("/movie/:tmdbid", async ({ params: { tmdbid } }) => {
        return await Primesrc.getMovieSource(+tmdbid);
    }, {
        params: t.Object({
            tmdbid: t.Numeric()
        })
    })
    .get("/tv/:tmdbid/:season/:episode", async ({ params: { tmdbid, season, episode } }) => {
        return await Primesrc.getTvSource(+tmdbid, +season, +episode);
    }, {
        params: t.Object({
            tmdbid: t.Numeric(),
            season: t.Numeric(),
            episode: t.Numeric()
        })
    })

