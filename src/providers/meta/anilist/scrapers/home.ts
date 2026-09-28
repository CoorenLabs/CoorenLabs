import { ANILIST_SPOTLIGHT_IDS } from "../../../../core/config";
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

const SPOTLIGHT_IDS = ANILIST_SPOTLIGHT_IDS.slice(0, 50);

const listItems = (page: any) =>
  (page?.media ?? []).map((media: any) => ({
    id: media.id,
    ...presentMedia(media),
    type: media.format || "TV",
    episodes: media.episodes,
    status: formatStatus(media.status),
  }));

export async function scrapeHome() {
  const [data, aniZip] = await Promise.all([
    queryAniList(HOME_QUERY, {
      season: getSeason(),
      seasonYear: new Date().getFullYear(),
      spotlight: SPOTLIGHT_IDS,
      withSpotlight: SPOTLIGHT_IDS.length > 0,
    }),
    Promise.all(SPOTLIGHT_IDS.map((id) => fetchAniZip(id))),
  ]);

  const byId = new Map<number, any>();
  for (const media of data.spotlight?.media ?? []) byId.set(media.id, media);

  const spotlight = SPOTLIGHT_IDS.flatMap((id, index) => {
    const media = byId.get(id);
    if (!media) return [];
    const { timeLeft, episodeCount } = formatAiringInfo(media);
    return [
      {
        id: media.id,
        ...presentMedia(media, aniZip[index]),
        description: descriptionOf(media),
        season: formatSeason(media),
        episode: episodeCount,
        timeLeft,
        status: formatStatus(media.status),
        type: media.format || "TV",
      },
    ];
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
