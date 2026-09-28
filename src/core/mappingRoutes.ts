import { Elysia, t } from "elysia";
import { Cache } from "./cache";
import { Logger } from "./logger";

const ANI_ZIP_MAPPINGS = "https://api.ani.zip/mappings";
const MAPPINGS_CACHE_TTL = 86_400;

const ID_PARAMS = [
  "mal_id",
  "anilist_id",
  "kitsu_id",
  "anidb_id",
  "themoviedb_id",
  "imdb_id",
] as const;

const FIELDS = [
  "animeplanet_id",
  "kitsu_id",
  "mal_id",
  "type",
  "anilist_id",
  "anisearch_id",
  "anidb_id",
  "notifymoe_id",
  "livechart_id",
  "thetvdb_id",
  "imdb_id",
  "themoviedb_id",
] as const;

type Mappings = Record<(typeof FIELDS)[number], string | number | null>;

async function fetchMappings(params: URLSearchParams): Promise<Mappings | null> {
  try {
    const res = await fetch(`${ANI_ZIP_MAPPINGS}?${params}`);
    if (!res.ok) {
      Logger.warn(`[AniZip] ${res.status} ${res.statusText} for ${params}`);
      return null;
    }
    const { mappings } = (await res.json()) as { mappings?: Record<string, unknown> };
    if (!mappings || typeof mappings !== "object") return null;
    return Object.fromEntries(
      FIELDS.map((field) => [field, (mappings[field] as string | number | undefined) ?? null]),
    ) as Mappings;
  } catch (err) {
    Logger.warn(`[AniZip] ${String(err)}`);
    return null;
  }
}

export const mappingRoutes = new Elysia().get(
  "/mappings",
  async ({ query, set }) => {
    const params = new URLSearchParams();
    for (const key of ID_PARAMS) {
      const value = query[key]?.trim();
      if (value) params.set(key, value);
    }

    if (!params.size) {
      set.status = 400;
      return { error: `Provide at least one ID parameter (${ID_PARAMS.join(", ")})` };
    }

    const { data } = await Cache.remember(`mappings:${params}`, MAPPINGS_CACHE_TTL, () =>
      fetchMappings(params),
    );
    if (!data) {
      set.status = 404;
      return { error: "No mappings found for the given ID" };
    }
    return data;
  },
  {
    query: t.Object(Object.fromEntries(ID_PARAMS.map((key) => [key, t.Optional(t.String())]))),
    detail: {
      tags: ["core"],
      summary: "Get Cross-Platform ID Mappings (MAL, AniList, TMDB, IMDB, Kitsu, etc.)",
    },
  },
);
