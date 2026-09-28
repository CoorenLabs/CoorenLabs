import type { CheerioAPI } from "cheerio";
import { asCdn } from "../../embeds/as-cdn";
import {
  type Episode,
  load,
  parseDetails,
  parseEpisodes,
  scrapeListing,
  scrapePlayers,
} from "../lib/parse";

const season = (season_no: number, episodes: Episode[]) => ({
  label: `Season ${season_no}`,
  season_no,
  episodes,
});

async function scrapeSeasons($: CheerioAPI) {
  const current = parseEpisodes($, "#episode_by_temp li");
  const buttons = $(".season-btn[data-season][data-url]")
    .map((_, el) => ({
      number: Number($(el).attr("data-season")),
      path: $(el).attr("data-url") ?? "",
      active: $(el).hasClass("active"),
    }))
    .get()
    .filter(({ number }) => number > 0);

  if (!buttons.length) return current.length ? [season(1, current)] : [];
  return Promise.all(
    buttons.map(async ({ number, path, active }) =>
      season(number, active ? current : parseEpisodes(await load(path), "li")),
    ),
  );
}

export function ScrapeSeries(page = 1) {
  return scrapeListing(page === 1 ? "/series" : `/series/page/${page}`, page);
}

export async function ScrapeSeriesInfo(slug: string) {
  const $ = await load(`/series/${slug}`);
  const details = parseDetails($);
  if (!details) return null;
  const seasons = await scrapeSeasons($);
  const { duration: _duration, ...series } = details;
  return {
    ...series,
    totalSeasons: seasons.length,
    totalEpisodes: seasons.reduce((total, { episodes }) => total + episodes.length, 0),
    seasons,
  };
}

export async function ScrapeEpisodeSources(slug: string) {
  const { embeds, sources } = await scrapePlayers(`/episode/${slug}/`);
  const hash = embeds.map((url) => url.match(asCdn.pattern)?.[1]).find(Boolean) ?? null;
  return { hash, embeds, sources };
}
