import {
  AniListError,
  descriptionOf,
  fetchAniZip,
  formatAiringInfo,
  formatSeason,
  formatStatus,
  presentMedia,
  queryAniList,
} from "../lib/helpers";
import { ANIME_DETAIL_QUERY } from "../lib/queries";

export async function scrapeAnimeDetail(id: number) {
  const [data, aniZip] = await Promise.all([
    queryAniList(ANIME_DETAIL_QUERY, { id }),
    fetchAniZip(id),
  ]);

  const media = data.Media;
  if (!media) throw new AniListError("Anime not found", 404);

  const { title, poster, banner, logo } = presentMedia(media, aniZip);
  const { timeLeft, episodeCount } = formatAiringInfo(media);

  return {
    id: media.id,
    title,
    titleRomaji: media.title.romaji || "",
    titleNative: media.title.native || "",
    poster,
    logo,
    color: media.coverImage?.color || "",
    banner,
    description: descriptionOf(media),
    season: formatSeason(media),
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
    studios: (media.studios?.nodes || []).map((studio: any) => ({
      name: studio.name,
      isAnimationStudio: studio.isAnimationStudio,
    })),
    trailer: media.trailer,
    synonyms: media.synonyms || [],
    tags: (media.tags || []).slice(0, 10).map((tag: any) => ({ name: tag.name, rank: tag.rank })),
    relations: (media.relations?.edges || []).map((edge: any) => ({
      relationType: edge.relationType,
      id: edge.node.id,
      title: edge.node.title.english || edge.node.title.romaji || "",
      poster: edge.node.coverImage?.extraLarge || "",
      format: edge.node.format,
      status: formatStatus(edge.node.status),
      episodes: edge.node.episodes,
      type: edge.node.type,
    })),
    characters: (media.characters?.edges || []).map((edge: any) => ({
      role: edge.role,
      id: edge.node?.id,
      name: edge.node?.name?.userPreferred || "",
      image: edge.node?.image?.large || "",
      voiceActors: (edge.voiceActors || []).map((actor: any) => ({
        id: actor.id,
        name: actor.name?.userPreferred || "",
        image: actor.image?.large || "",
      })),
    })),
    recommendations: (media.recommendations?.nodes || [])
      .map((node: any) => node.mediaRecommendation)
      .filter(Boolean)
      .map((rec: any) => ({
        id: rec.id,
        title: rec.title.english || rec.title.romaji || "",
        poster: rec.coverImage?.extraLarge || "",
        format: rec.format || "TV",
        status: formatStatus(rec.status),
        episodes: rec.episodes,
        averageScore: rec.averageScore,
        season: rec.season,
        seasonYear: rec.seasonYear,
      })),
    streamingEpisodes: media.streamingEpisodes || [],
  };
}
