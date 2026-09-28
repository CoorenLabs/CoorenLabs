import {
  descriptionOf,
  fetchAniZip,
  formatAiringInfo,
  formatSeason,
  formatStatus,
  getSeason,
  presentMedia,
  queryAniList,
} from "../lib/helpers";
import { HOME_QUERY } from "../lib/queries";

const SPOTLIGHT_SIZE = 10;

const listItems = (page: any) =>
  (page?.media ?? []).map((media: any) => ({
    id: media.id,
    ...presentMedia(media),
    type: media.format || "TV",
    episodes: media.episodes,
    status: formatStatus(media.status),
  }));

export async function scrapeHome() {
  const data = await queryAniList(HOME_QUERY, {
    season: getSeason(),
    seasonYear: new Date().getFullYear(),
  });

  const candidates: any[] = data.spotlight?.media ?? [];
  const featured = [
    ...candidates.filter((media) => media.bannerImage),
    ...candidates.filter((media) => !media.bannerImage),
  ].slice(0, SPOTLIGHT_SIZE);
  const aniZip = await Promise.all(featured.map((media) => fetchAniZip(media.id)));

  const spotlight = featured.map((media, index) => {
    const { timeLeft, episodeCount } = formatAiringInfo(media);
    return {
      id: media.id,
      ...presentMedia(media, aniZip[index]),
      description: descriptionOf(media),
      season: formatSeason(media),
      episode: episodeCount,
      timeLeft,
      status: formatStatus(media.status),
      type: media.format || "TV",
    };
  });

  return {
    spotlight,
    "recently-added": listItems(data.trending),
    "popular-anime": listItems(data.popular),
    "popular-movies": listItems(data.movies),
    "seasonal-anime": listItems(data.seasonal),
    "anime-of-all-time": listItems(data.allTime),
    "coming-soon": listItems(data.comingSoon),
  };
}
