import {
  ANILIST_URL,
  SPOTLIGHT_QUERY,
  HOME_DATA_QUERY,
} from "../lib/queries";
import {
  extractAniZipImages,
  fetchWithRetry,
  formatAiringInfo,
  formatStatus,
  getSeason,
} from "../lib/helpers";

import { ANILIST_SPOTLIGHT_IDS } from "../../../../core/config";

import { remapManager } from "../../../../core/remapManager";

/**
 * Fetch home page data: spotlight carousel + trending/popular/seasonal/etc. lists.
 * Ported from anime-stream-link/server.js → GET /home
 */
export async function scrapeHome() {
  const currentSeason = getSeason();
  const currentYear = new Date().getFullYear();

  // Fetch spotlight entries in parallel
  const spotlightPromise = Promise.allSettled(
    ANILIST_SPOTLIGHT_IDS.map(async (anilistId) => {
      const [anilistRes, aniZipRes] = await Promise.all([
        fetchWithRetry(ANILIST_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ query: SPOTLIGHT_QUERY, variables: { id: anilistId } }),
        }).then((r) => r.json()),

        fetchWithRetry(`https://api.ani.zip/mappings?anilist_id=${anilistId}`)
          .then((r) => r.json())
          .catch(() => null),
      ]);

      const media = anilistRes?.data?.Media;
      if (!media) return null;

      const remap = remapManager.getRemap(anilistId);
      const { banner, logo } = extractAniZipImages(aniZipRes, remap);
      const { timeLeft, episodeCount } = formatAiringInfo(media);

      return {
        id: media.id,
        title: remap?.name || media.title.english || media.title.romaji || "",
        logo: remap?.logo || logo || media.coverImage?.extraLarge || "",
        banner: remap?.banner || banner || media.bannerImage || media.coverImage?.extraLarge || "",
        description: remap?.description || media.description?.replace(/<[^>]*>?/gm, "") || "",
        season:
          media.season && media.seasonYear
            ? `${media.season.charAt(0) + media.season.slice(1).toLowerCase()} ${media.seasonYear}`
            : "Unknown",
        episode: episodeCount,
        timeLeft,
        status: formatStatus(media.status),
        type: media.format || "TV",
      };
    }),
  );

  // Fetch section lists in one GraphQL call
  const homeDataPromise = fetchWithRetry(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      query: HOME_DATA_QUERY,
      variables: { season: currentSeason, seasonYear: currentYear },
    }),
  }).then((r) => r.json());

  const [spotlightResults, homeDataResponse] = await Promise.all([
    spotlightPromise,
    homeDataPromise,
  ]);

  const spotlight = spotlightResults
    .filter((r) => r.status === "fulfilled" && r.value !== null)
    .map((r: any) => r.value);

  const lists = homeDataResponse?.data || {};

  const formatMediaList = (mediaList: any[]) =>
    (mediaList || []).map((m: any) => ({
      id: m.id,
      title: m.title.english || m.title.romaji || "",
      poster: m.coverImage?.extraLarge || "",
      type: m.format || "TV",
      episodes: m.episodes,
      status: formatStatus(m.status),
    }));

  return {
    spotlight,
    "recently-added": formatMediaList(lists.trending?.media),
    "popular-anime": formatMediaList(lists.popular?.media),
    "popular-movies": formatMediaList(lists.movies?.media),
    "seasonal-anime": formatMediaList(lists.seasonal?.media),
    "anime-of-all-time": formatMediaList(lists.allTime?.media),
    "coming-soon": formatMediaList(lists.comingSoon?.media),
  };
}
