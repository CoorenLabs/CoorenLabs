import { formatStatus, presentMedia, queryAniList } from "../lib/helpers";
import { SEARCH_QUERY } from "../lib/queries";

export async function scrapeSearch(query: string, page = 1, perPage = 20) {
  const { Page } = await queryAniList(SEARCH_QUERY, { search: query, page, perPage });
  return {
    pageInfo: Page?.pageInfo,
    results: (Page?.media ?? []).map((media: any) => ({
      id: media.id,
      ...presentMedia(media),
      format: media.format || "TV",
      status: formatStatus(media.status),
      episodes: media.episodes,
      averageScore: media.averageScore,
      season: media.season,
      seasonYear: media.seasonYear,
      color: media.coverImage?.color || "",
    })),
  };
}
