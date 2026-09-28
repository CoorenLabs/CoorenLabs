import { Elysia, t } from "elysia";
import { Cache } from "../../../core/cache";
import { Logger } from "../../../core/logger";
import { scrapeEpisodes } from "./scrapers/episodes";
import { scrapeStream } from "./scrapers/stream";

const EPISODES_CACHE_TTL = 3600 * 6;
const STREAM_CACHE_TTL = 3600 * 2;

const prefix = "/anime/animelok";

async function respond<T, R>(
  key: string,
  ttl: number,
  load: () => Promise<T>,
  cacheable: (data: T) => boolean,
  present: (data: T) => R,
) {
  const started = performance.now();
  try {
    let fresh: T | undefined;
    const { data, cached } = await Cache.remember(key, ttl, async () => {
      fresh = await load();
      return cacheable(fresh) ? fresh : null;
    });
    return {
      success: true,
      served_cache: cached,
      took_ms: (performance.now() - started).toFixed(2),
      data: present((data ?? fresh) as T),
    };
  } catch (err) {
    Logger.error(`[animelok] ${key}: ${String(err)}`);
    return { success: false, error: (err as Error).message };
  }
}

export const animelokAnimeRoutes = new Elysia({ prefix: "/animelok" })
  .get("/", () => ({
    name: "animelok",
    version: "1.0",
    description:
      "Anime provider backed by animelok.cc — episode lists and embed stream sources keyed by AniList ID.",
    endpoints: [
      prefix + "/episodes/:anilistId?page=&pageSize=",
      prefix + "/stream/:anilistId/:episode?quality=",
    ],
  }))

  .get(
    "/episodes/:anilistId",
    ({ params: { anilistId }, query }) => {
      const page = Math.max(Math.floor(Number(query.page)) || 0, 0);
      const size = Math.max(Math.floor(Number(query.pageSize)) || 30, 1);
      return respond(
        `animelok:episodes:${anilistId}`,
        EPISODES_CACHE_TTL,
        () => scrapeEpisodes(anilistId),
        (list) => list.episodes.length > 0,
        (list) => ({
          episodes: list.episodes.slice(page * size, (page + 1) * size),
          total: list.total,
          page,
        }),
      );
    },
    {
      params: t.Object({ anilistId: t.String() }),
      query: t.Object({
        page: t.Optional(t.Number({ default: 0 })),
        pageSize: t.Optional(t.Number({ default: 30 })),
      }),
      detail: {
        tags: ["anime"],
        summary: "animelok — Episode List",
        description: "Returns a paginated episode list for an anime identified by its AniList ID.",
      },
    },
  )

  .get(
    "/stream/:anilistId/:episode",
    ({ params: { anilistId, episode }, query }) =>
      respond(
        `animelok:stream:${anilistId}:${episode}`,
        STREAM_CACHE_TTL,
        () => scrapeStream(anilistId, episode),
        ({ sub, dub }) => sub.embeds.length > 0 || dub.embeds.length > 0,
        (tracks) => ({
          episodeNumber: parseInt(episode, 10),
          preferQuality: query.quality ?? "1080p",
          ...tracks,
        }),
      ),
    {
      params: t.Object({
        anilistId: t.String(),
        episode: t.String(),
      }),
      query: t.Object({
        quality: t.Optional(t.String({ default: "1080p" })),
      }),
      detail: {
        tags: ["anime"],
        summary: "animelok — Stream Sources",
        description:
          "Returns the sub and dub embed players (plus the as-cdn video hash when available) for a given episode.",
      },
    },
  );
