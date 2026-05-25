import { Elysia, t } from "elysia";
import { Cache } from "../../../core/cache";
import { scrapeEpisodes } from "./scrapers/episodes";
import { scrapeStreamBilingual } from "./scrapers/stream";

const EPISODES_CACHE_TTL = 3600 * 6; // 6hr
const STREAM_CACHE_TTL = 3600 * 2; // 2hr

const prefix = "/anime/animelok";

export const animelokAnimeRoutes = new Elysia({ prefix: "/animelok" })

  // ── Overview ────────────────────────────────────────────────────────────────
  .get("/", () => ({
    name: "animelok",
    version: "1.0",
    description:
      "Anime provider backed by animelok.xyz — fetches episode lists and HLS/MP4 stream sources via cookie-warmed API calls.",
    endpoints: [
      prefix + "/episodes/:anilistId?title=&page=&lang=&pageSize=",
      prefix + "/stream/:anilistId/:episode?title=&quality=",
    ],
  }))

  // ── Episodes ─────────────────────────────────────────────────────────────────
  .get(
    "/episodes/:anilistId",
    async ({ params: { anilistId }, query }) => {
      const then = performance.now();

      const title = query.title as string | undefined;
      if (!title) {
        return { success: false, error: "`title` query param is required" };
      }

      const page = Number(query.page ?? 0);
      const lang = (query.lang as string | undefined) ?? "ALL";
      const pageSize = Number(query.pageSize ?? 30);

      const cacheKey = `animelok:episodes:${anilistId}:${title}:${page}:${lang}:${pageSize}`;
      const cached = await Cache.get(cacheKey);
      if (cached) {
        return {
          success: true,
          served_cache: true,
          took_ms: (performance.now() - then).toFixed(2),
          data: JSON.parse(cached),
        };
      }

      try {
        const data = await scrapeEpisodes(anilistId, title, page, lang, pageSize);
        Cache.set(cacheKey, JSON.stringify(data), EPISODES_CACHE_TTL);

        return {
          success: true,
          served_cache: false,
          took_ms: (performance.now() - then).toFixed(2),
          data,
        };
      } catch (err: any) {
        console.error("[animelok/episodes]", err);
        return { success: false, error: err.message };
      }
    },
    {
      params: t.Object({ anilistId: t.String() }),
      query: t.Object({
        title: t.String(),
        page: t.Optional(t.Number({ default: 0 })),
        lang: t.Optional(t.String({ default: "ALL" })),
        pageSize: t.Optional(t.Number({ default: 30 })),
      }),
      detail: {
        tags: ["anime"],
        summary: "animelok — Episode List",
        description:
          "Returns a paginated episode list for an anime identified by its AniList ID and title slug.",
      },
    },
  )

  // ── Stream ───────────────────────────────────────────────────────────────────
  .get(
    "/stream/:anilistId/:episode",
    async ({ params: { anilistId, episode }, query }) => {
      const then = performance.now();

      const title = query.title as string | undefined;
      if (!title) {
        return { success: false, error: "`title` query param is required" };
      }

      const quality = (query.quality as string | undefined) ?? "1080p";

      const cacheKey = `animelok:stream:${anilistId}:${episode}:${title}:${quality}`;
      const cached = await Cache.get(cacheKey);
      if (cached) {
        return {
          success: true,
          served_cache: true,
          took_ms: (performance.now() - then).toFixed(2),
          data: JSON.parse(cached),
        };
      }

      try {
        const data = await scrapeStreamBilingual(anilistId, episode, title, quality);

        // Only cache if at least one language has stream sources
        if (
          data.sub.servers.length > 0 ||
          data.dub.servers.length > 0 ||
          data.sub.embeds.length > 0 ||
          data.dub.embeds.length > 0
        ) {
          Cache.set(cacheKey, JSON.stringify(data), STREAM_CACHE_TTL);
        }

        return {
          success: true,
          served_cache: false,
          took_ms: (performance.now() - then).toFixed(2),
          data,
        };
      } catch (err: any) {
        console.error("[animelok/stream]", err);
        return { success: false, error: err.message };
      }
    },
    {
      params: t.Object({
        anilistId: t.String(),
        episode: t.String(),
      }),
      query: t.Object({
        title: t.String(),
        quality: t.Optional(t.String({ default: "1080p" })),
      }),
      detail: {
        tags: ["anime"],
        summary: "animelok — Stream Sources",
        description:
          "Returns direct HLS/MP4 stream URLs and embed links for a given episode. Performs cookie warm-up to bypass animelok.xyz bot protection.",
      },
    },
  );
