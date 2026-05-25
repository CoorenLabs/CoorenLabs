import { lookerFetch } from "../lib/fetch";
import { buildFullSlug } from "../lib/slug";
import type { Episode } from "../lib/types";

/**
 * Fetch a paginated episode list for an anime from animelok.xyz.
 *
 * Maps to: GET /anime/animelok/episodes/:anilistId?title=&page=&lang=&pageSize=
 * Source: animelok-worker → handleEpisodes()
 */
export async function scrapeEpisodes(
  anilistId: string,
  title: string,
  page: number = 0,
  lang: string = "ALL",
  pageSize: number = 30,
): Promise<{ episodes: Episode[]; total?: number; page: number }> {
  const slug = buildFullSlug(title, anilistId);
  console.log("url", `${slug}/episodes-range?page=${page}&lang=${lang}&pageSize=${pageSize}`);
  const apiPath = `/api/anime/${slug}/episodes-range?page=${page}&lang=${lang}&pageSize=${pageSize}`;

  const data = await lookerFetch(apiPath, slug);

  // Fill in missing episode names and format thumbnails
  const episodes: Episode[] = (data.episodes ?? []).map((ep: any) => {
    let thumbnail = ep.thumbnail || ep.image || ep.img;
    if (thumbnail && typeof thumbnail === "string") {
      thumbnail = thumbnail.replace("https://img.animetsu.cc/", "");
      thumbnail = thumbnail.replace("i.animepahe.si", "i.animepahe.pw");
    }

    return {
      ...ep,
      thumbnail,
      image: thumbnail,
      img: thumbnail,
      name: ep.name && ep.name.trim() !== "" ? ep.name : `Episode ${ep.number}`,
    };
  });

  return { episodes, total: data.total, page };
}
