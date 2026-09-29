import * as cheerio from "cheerio";
import { fetcher } from "../../../core/lib/fetcher";

const BASE_URL = "https://mangapill.com";

export class MangaPillParser {
  async search(query: string): Promise<any> {
    try {
      const response = await fetcher(
        `${BASE_URL}/quick-search?q=${encodeURIComponent(query)}`,
        false,
        "mangapill",
      );
      if (!response || !response.success) throw new Error("Failed to search");

      const $ = cheerio.load(response.text);
      const results: any[] = [];

      $("div.grid a").each((_, el) => {
        const id = $(el).attr("href")?.replace("/manga/", "");
        const title = $(el).find(".font-black").text().trim();
        const cover = $(el).find("img").attr("data-src") || $(el).find("img").attr("src");

        if (id && title) {
          results.push({ id, title, cover, url: `${BASE_URL}/manga/${id}` });
        }
      });

      return results;
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async getMangaDetail(id: string): Promise<any> {
    try {
      const response = await fetcher(`${BASE_URL}/manga/${id}`, false, "mangapill");
      if (!response || !response.success) throw new Error("Failed to get detail");

      const $ = cheerio.load(response.text);
      const chapters: any[] = [];

      $("#chapters a").each((_, el) => {
        chapters.push({
          id: $(el).attr("href")?.replace("/chapters/", ""),
          title: $(el).text().trim(),
        });
      });

      return {
        id,
        title: $("h1").text().trim(),
        description: $("p.text-sm").text().trim(),
        chapters,
      };
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async getChapterImages(chapterId: string): Promise<any> {
    try {
      const response = await fetcher(`${BASE_URL}/chapters/${chapterId}`, false, "mangapill");
      if (!response || !response.success) throw new Error("Failed to get chapter");

      const $ = cheerio.load(response.text);

      const chapterTitle = $(".container.mb-3 h1").text().trim();
      const prevUrl =
        $(".container .flex.items-center.gap-2 a[data-hotkey='ArrowLeft']").attr("href") || null;
      const nextUrl =
        $(".container .flex.items-center.gap-2 a[data-hotkey='ArrowRight']").attr("href") || null;

      const pages: string[] = [];
      $("chapter-page").each((_, el) => {
        const src = $(el).find("img").attr("data-src");
        if (src) pages.push(src);
      });

      // fallback: if no chapter-page elements, try img[data-src] directly
      if (pages.length === 0) {
        $(".lg\\:container img[data-src]").each((_, el) => {
          const src = $(el).attr("data-src");
          if (src) pages.push(src);
        });
      }

      const mangaId = chapterId.split("-")[0];

      return {
        id: chapterId,
        title: chapterTitle,
        mangaId,
        pages,
        url: `${BASE_URL}/chapters/${chapterId}`,
        prevChapter: prevUrl ? `${BASE_URL}${prevUrl}` : null,
        nextChapter: nextUrl ? `${BASE_URL}${nextUrl}` : null,
      };
    } catch (err) {
      console.error(err);
      return null;
    }
  }
}

export const mangapill = new MangaPillParser();
