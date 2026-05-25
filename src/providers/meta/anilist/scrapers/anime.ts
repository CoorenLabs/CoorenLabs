import { ANILIST_URL, ANIME_DETAIL_QUERY } from "../lib/queries";
import {
  extractAniZipImages,
  fetchWithRetry,
  formatAiringInfo,
  formatStatus,
} from "../lib/helpers";

import { remapManager } from "../../../../core/remapManager";

/**
 * Fetch full anime metadata for a given AniList ID.
 * Ported from anime-stream-link/server.js → GET /anime/:id
 */
export async function scrapeAnimeDetail(id: string | number) {
  const [anilistResponse, aniZipResponse] = await Promise.all([
    fetchWithRetry(ANILIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        query: ANIME_DETAIL_QUERY,
        variables: { id: parseInt(String(id)), type: "ANIME", isAdult: false },
      }),
    }).then((r) => r.json()),

    fetchWithRetry(`https://api.ani.zip/mappings?anilist_id=${id}`)
      .then((r) => r.json())
      .catch(() => null),
  ]);

  if (anilistResponse?.errors?.length) {
    throw new Error(anilistResponse.errors[0].message);
  }

  const media = anilistResponse?.data?.Media;
  if (!media) throw new Error("Anime not found");

  const remap = remapManager.getRemap(id);
  const { banner, logo } = extractAniZipImages(aniZipResponse, remap);
  const { timeLeft, episodeCount } = formatAiringInfo(media);

  const recommendations = (media.recommendations?.nodes || [])
    .filter((n: any) => n.mediaRecommendation)
    .map((n: any) => {
      const rec = n.mediaRecommendation;
      return {
        id: rec.id,
        title: rec.title.english || rec.title.romaji || "",
        poster: rec.coverImage?.extraLarge || "",
        format: rec.format || "TV",
        status: formatStatus(rec.status),
        episodes: rec.episodes,
        averageScore: rec.averageScore,
        season: rec.season,
        seasonYear: rec.seasonYear,
      };
    });

  const relations = (media.relations?.edges || []).map((edge: any) => ({
    relationType: edge.relationType,
    id: edge.node.id,
    title: edge.node.title.english || edge.node.title.romaji || "",
    poster: edge.node.coverImage?.extraLarge || "",
    format: edge.node.format,
    status: formatStatus(edge.node.status),
    episodes: edge.node.episodes,
    type: edge.node.type,
  }));

  const studios = (media.studios?.nodes || []).map((s: any) => ({
    name: s.name,
    isAnimationStudio: s.isAnimationStudio,
  }));

  const characters = (media.characters?.edges || []).map((edge: any) => ({
    role: edge.role,
    id: edge.node?.id,
    name: edge.node?.name?.userPreferred || "",
    image: edge.node?.image?.large || "",
    voiceActors: (edge.voiceActors || []).map((va: any) => ({
      id: va.id,
      name: va.name?.userPreferred || "",
      image: va.image?.large || "",
    })),
  }));

  return {
    id: media.id,
    title: remap?.name || media.title.english || media.title.romaji || "",
    titleRomaji: media.title.romaji || "",
    titleNative: media.title.native || "",
    poster: media.coverImage?.extraLarge || "",
    logo: remap?.logo || logo || "",
    color: media.coverImage?.color || "",
    banner: remap?.banner || banner || media.bannerImage || media.coverImage?.extraLarge || "",
    description: remap?.description || media.description?.replace(/<[^>]*>?/gm, "") || "",
    season:
      media.season && media.seasonYear
        ? `${media.season.charAt(0) + media.season.slice(1).toLowerCase()} ${media.seasonYear}`
        : "Unknown",
    episode: episodeCount,
    totalEpisodes: media.episodes,
    duration: media.duration,
    timeLeft,
    status: formatStatus(media.status),
    type: media.format || "TV",
    genres: media.genres || [],
    averageScore: media.averageScore,
    meanScore: media.meanScore,
    popularity: media.popularity,
    favourites: media.favourites,
    source: media.source,
    countryOfOrigin: media.countryOfOrigin,
    startDate: media.startDate,
    endDate: media.endDate,
    studios,
    trailer: media.trailer,
    synonyms: media.synonyms || [],
    tags: (media.tags || []).slice(0, 10).map((t: any) => ({ name: t.name, rank: t.rank })),
    relations,
    characters,
    recommendations,
    // Raw streaming episodes thumbnails for consumer use
    streamingEpisodes: media.streamingEpisodes || [],
  };
}
