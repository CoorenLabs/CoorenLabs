import { load, parseDetails, scrapeListing, scrapePlayers } from "../lib/parse";

export function ScrapeMovies(page = 1) {
  return scrapeListing(`/category/movies?type=movies&page=${page}`, page);
}

export async function ScrapeMovieInfo(slug: string) {
  const details = parseDetails(await load(`/movies/${slug}/`));
  if (!details) return null;
  const { runtime: _runtime, ...movie } = details;
  return movie;
}

export function ScrapeMovieSources(slug: string) {
  return scrapePlayers(`/movies/${slug}/`);
}
