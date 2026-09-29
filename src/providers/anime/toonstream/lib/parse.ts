import type { CheerioAPI } from "cheerio";
import { Cache } from "../../../../core/cache";
import { toonstream as BASE } from "../../../origins";
import { extractSources } from "../embeds";
import { loadHtml } from "../embeds/http";

const EMBEDS_TTL = 86_400;

export type AnimeCard = {
  type: "movie" | "series";
  slug: string;
  title: string;
  url: string;
  poster: string;
  tmdbRating: number;
};

export type Episode = {
  episode_no: number;
  slug: string;
  title: string;
  epXseason: string;
  url: string;
  thumbnail: string;
};

const REFERER = `${BASE}/`;

export const absolute = (href: string) => new URL(href, BASE).href;

export const load = (path: string) => loadHtml(absolute(path));

export const slugOf = (url: string) =>
  new URL(url, BASE).pathname.split("/").filter(Boolean).pop() ?? "";

export function parseCards($: CheerioAPI, cards: Parameters<CheerioAPI>[0]): AnimeCard[] {
  return $(cards)
    .map((_, el): AnimeCard | null => {
      const card = $(el);
      const href = card.find("a.lnk-blk").attr("href");
      const poster = card.find("img").attr("src");
      if (!href || !poster) return null;
      const url = absolute(href);
      return {
        type: url.includes("/series/") ? "series" : "movie",
        title: card.find(".entry-title").text().trim(),
        slug: slugOf(url),
        poster,
        url,
        tmdbRating: Number(card.find(".vote").text().replace("TMDB", "").trim()),
      };
    })
    .get();
}

export async function scrapeListing(path: string, page: number) {
  const $ = await load(path);
  return {
    pagination: {
      current: page,
      start: 1,
      end: Number($("nav.pagination a.page-link").last().text().trim()) || 1,
    },
    data: parseCards($, "main section.movies article.post"),
  };
}

export function parseEpisodes($: CheerioAPI, selector: string): Episode[] {
  return $(selector)
    .map((index, el): Episode | null => {
      const item = $(el);
      const href = item.find("a.lnk-blk").attr("href");
      if (!href) return null;
      const url = absolute(href);
      const epXseason = item.find(".num-epi").text().trim();
      return {
        episode_no: Number(epXseason.split("x")[1]) || index + 1,
        slug: slugOf(url),
        title: item.find(".entry-title1, .entry-title").first().text().trim(),
        epXseason,
        url,
        thumbnail: item.find("img").attr("src") ?? "",
      };
    })
    .get();
}

export function parseDetails($: CheerioAPI) {
  const article = $("article.post.single").first();
  const title = article.find(".entry-title").first().text().trim();
  if (!title) return null;

  const meta = article.find(".entry-meta");
  const description = article.find(".description");
  const paragraphs = description.find("p");
  const field = (label: string) =>
    paragraphs
      .filter((_, p) => $(p).children("span").first().text().trim() === label)
      .first()
      .text()
      .replace(label, "")
      .trim();
  const split = (value: string, separator: string) =>
    value
      .split(separator)
      .map((part) => part.trim())
      .filter(Boolean);
  const links = (selector: string) =>
    article
      .find(selector)
      .map((_, a) => {
        const href = $(a).attr("href");
        return href ? { name: $(a).text().trim(), url: absolute(href) } : null;
      })
      .get();

  return {
    title,
    year: meta.find(".year").text().trim(),
    tmdbRating: Number(article.find(".vote-cn .num").text().trim()),
    description:
      paragraphs.not(":has(span)").first().text().trim() ||
      description
        .contents()
        .filter((_, node) => node.type === "text")
        .text()
        .trim(),
    languages: split(field("Language:"), "–"),
    qualities: split(field("Quality:"), "|"),
    duration: meta.find(".duration").text().trim(),
    runtime: field("Running time:"),
    genres: links(".genres a").map((genre) => ({ ...genre, slug: slugOf(genre.url) })),
    tags: links(".tag a"),
    casts: links(".cast-lst a"),
  };
}

async function scrapeEmbeds(path: string) {
  const $ = await load(path);
  return $("#aa-options iframe")
    .map((_, el) => $(el).attr("data-src") || $(el).attr("src"))
    .get()
    .map(absolute);
}

export async function scrapePlayers(path: string) {
  const { data: embeds } = await Cache.remember(`toonstream:embeds:${path}`, EMBEDS_TTL, () =>
    scrapeEmbeds(path),
  );
  return { embeds, sources: await extractSources(embeds, REFERER) };
}
