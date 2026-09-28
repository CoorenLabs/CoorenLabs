import { absolute, type AnimeCard, load, parseCards, slugOf } from "../lib/parse";

type Section = { label: string; viewMore?: string; data: AnimeCard[] };

export async function ScrapeHomePage() {
  const $ = await load("/home");

  const sections = (selector: string) =>
    $(selector)
      .filter((_, el) => $(el).children("header").length > 0)
      .map((_, el): Section | null => {
        const section = $(el);
        const cards = section.find("article.post");
        if (!cards.length || cards.find('a.lnk-blk[href*="/episode/"]').length) return null;
        const viewMore = section.children("header").find("a.more").attr("href");
        return {
          label: section.children("header").find(".section-title").text().trim(),
          viewMore: viewMore && absolute(viewMore),
          data: parseCards($, cards),
        };
      })
      .get();

  const lastEpisodes = $('main article.post:has(a.lnk-blk[href*="/episode/"])')
    .map((_, el) => {
      const card = $(el);
      const url = absolute(card.find("a.lnk-blk").attr("href") ?? "");
      const slug = slugOf(url);
      return {
        title: card.find(".entry-title").text().trim(),
        slug,
        url,
        epXseason: slug.match(/(\d+x\d+)$/)?.[1] ?? "",
        ago: "",
        thumbnail: card.find("img").attr("src") ?? "",
      };
    })
    .get();

  const main = sections("main section");
  const sidebar = sections("aside section");
  return main.length || sidebar.length || lastEpisodes.length
    ? { main, sidebar, lastEpisodes }
    : null;
}
