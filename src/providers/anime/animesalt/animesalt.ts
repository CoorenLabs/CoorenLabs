import type { CheerioAPI } from "cheerio";
import { Cache } from "../../../core/cache";
import { Logger } from "../../../core/logger";
import { animesalt as BASE } from "../../origins";
import { extractSource, extractSources } from "../embeds";
import { loadHtml } from "../embeds/http";

type AnimeCard = {
  title: string;
  slug: string;
  poster: string;
  url: string;
  type: "movie" | "series";
};

type Episode = {
  episode_no: number;
  slug: string;
  title: string;
  epXseason: string;
  url: string;
  thumbnail: string;
};

const LIST_TTL = 43_200;
const EMBEDS_TTL = 86_400;
const SERIES_TTL = 3600 * 24 * 3;
const REFERER = `${BASE}/`;

const absolute = (href: string) => new URL(href, BASE).href;
const load = (path: string) => loadHtml(absolute(path));
const slugOf = (url: string) => new URL(url, BASE).pathname.split("/").filter(Boolean).pop() ?? "";
const image = (src: string | undefined) => (src && !src.startsWith("data:") ? absolute(src) : "");
const paged = (path: string, page: number) => (page > 1 ? `${path}page/${page}/` : path);
const season = (season_no: number, episodes: Episode[]) => ({
  label: `Season ${season_no}`,
  season_no,
  episodes,
});

async function cached<T>(key: string, ttl: number, producer: () => Promise<T | null>) {
  try {
    return (await Cache.remember(`animesalt:${key}`, ttl, producer)).data;
  } catch (err) {
    Logger.warn(`[animesalt] ${(err as Error).message}`);
    return null;
  }
}

function parseCards($: CheerioAPI): AnimeCard[] {
  return $("#movies-a li")
    .map((_, el): AnimeCard | null => {
      const card = $(el);
      const href = card.find("a.lnk-blk").attr("href");
      if (!href) return null;
      const img = card.find("img");
      const url = absolute(href);
      return {
        title: card.find(".entry-title").text().trim(),
        slug: slugOf(url),
        poster: image(img.attr("data-src") || img.attr("src")),
        url,
        type: url.includes("/series/") ? "series" : "movie",
      };
    })
    .get();
}

function parseEpisodes($: CheerioAPI, selector: string): Episode[] {
  return $(selector)
    .map((index, el): Episode | null => {
      const item = $(el);
      const href = item.find("a.lnk-blk").attr("href");
      if (!href) return null;
      const img = item.find("img");
      const url = absolute(href);
      const slug = slugOf(url);
      return {
        episode_no: Number(item.find(".num-epi").text().trim().split("x").pop()) || index + 1,
        slug,
        title: item.find(".entry-title").text().trim(),
        epXseason: slug.match(/(\d+x\d+)$/)?.[1] ?? "",
        url,
        thumbnail: image(img.attr("data-src") || img.attr("src")),
      };
    })
    .get();
}

function parseEmbeds($: CheerioAPI) {
  return $("#aa-options iframe")
    .map((_, el) => $(el).attr("data-src") || $(el).attr("src"))
    .get()
    .map(absolute);
}

async function scrapeHome() {
  const $ = await load("/");
  const lastEpisodes = $(".widget_list_episodes li")
    .map((_, el) => {
      const card = $(el);
      const href = card.find("a.lnk-blk").attr("href");
      if (!href) return null;
      const img = card.find("img");
      const url = absolute(href);
      const season = card.find(".post-ql").text().match(/\d+/)?.[0];
      const episode = card.find(".year").text().match(/\d+/)?.[0];
      return {
        title: card.find(".entry-title").text().trim(),
        slug: slugOf(url),
        url,
        thumbnail: image(img.attr("data-src") || img.attr("src")),
        epXseason: season && episode ? `${season}x${episode}` : "",
        ago: "",
      };
    })
    .get();
  return lastEpisodes.length ? { lastEpisodes } : null;
}

async function scrapeMovie(slug: string) {
  const $ = await load(`/movies/${slug}/`);
  const title = $("h1").first().text().trim();
  if (!title) return null;
  const poster = $(".bd img").first();
  return {
    title,
    poster: image(poster.attr("data-src") || poster.attr("src")),
    description: $("#overview-text p").text().trim(),
    downloadLinks: $("table tbody tr")
      .map((_, el) => {
        const cells = $(el).find("td");
        return {
          server: cells.eq(0).text().trim(),
          quality: cells.eq(2).text().trim(),
          url: $(el).find("a").attr("href")?.split(/\s/)[0],
        };
      })
      .get(),
    embeds: parseEmbeds($),
  };
}

async function scrapeSeries(slug: string) {
  const $ = await load(`/series/${slug}/`);
  const title = $("h1").first().text().trim();
  if (!title) return null;

  const current = parseEpisodes($, "#episode_by_temp li");
  const buttons = $(".season-btn[data-season][data-post]")
    .map((_, el) => ({
      number: Number($(el).attr("data-season")),
      post: $(el).attr("data-post") ?? "",
      active: $(el).hasClass("active"),
    }))
    .get()
    .filter(({ number }) => number > 0);

  const fetchSeason = async (number: number, post: string) => {
    const query = new URLSearchParams({
      action: "action_select_season",
      season: `${number}`,
      post,
    });
    return parseEpisodes(await load(`/wp-admin/admin-ajax.php?${query}`), "li");
  };

  if (!buttons.length) return { title, seasons: current.length ? [season(1, current)] : [] };
  const seasons = await Promise.all(
    buttons.map(async ({ number, post, active }) =>
      season(number, active ? current : await fetchSeason(number, post)),
    ),
  );
  return { title, seasons };
}

export const AnimeSalt = {
  home: () => cached("home", LIST_TTL, scrapeHome),

  search: (query: string, page = 1) =>
    cached(`search:${query}:${page}`, LIST_TTL, async () => {
      const $ = await load(`${paged("/", page)}?${new URLSearchParams({ s: query })}`);
      return { data: parseCards($) };
    }),

  category: (type: string, page = 1, filter?: string) =>
    cached(`category:${type}:${filter || "all"}:${page}`, LIST_TTL, async () => {
      const path = paged(`/category/${type.split("/").map(encodeURIComponent).join("/")}/`, page);
      const $ = await load(filter ? `${path}?${new URLSearchParams({ type: filter })}` : path);
      return {
        pagination: {
          current: page,
          start: 1,
          end: Number($("nav.pagination a.page-link").last().text().trim()) || 1,
        },
        data: parseCards($),
      };
    }),

  movies: (page = 1) =>
    cached(`movies:${page}`, LIST_TTL, async () => ({
      data: parseCards(await load(paged("/movies/", page))),
    })),

  async movieInfo(slug: string) {
    const movie = await cached(`movie:${slug}`, EMBEDS_TTL, () => scrapeMovie(slug));
    return movie && { ...movie, sources: await extractSources(movie.embeds, REFERER) };
  },

  seriesInfo: (slug: string) => cached(`series:${slug}`, SERIES_TTL, () => scrapeSeries(slug)),

  async streams(slug: string) {
    const embeds = await cached(`episode:${slug}`, EMBEDS_TTL, async () =>
      parseEmbeds(await load(`/episode/${slug}/`)),
    );
    return embeds?.map(async (url) => {
      const source = await extractSource(url, REFERER);
      return (
        source && {
          id: url,
          title: "Auto",
          url,
          directUrl: source.url,
          quality: source.label,
          type: source.type,
          headers: source.headers,
          proxiedUrl: source.proxiedUrl,
        }
      );
    });
  },
};
