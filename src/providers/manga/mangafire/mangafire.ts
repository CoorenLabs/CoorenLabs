import axios, { type AxiosInstance } from "axios";
import * as cheerio from "cheerio";
import { generateVrf } from "./vrf";

const BASE_URL = "https://mangafire.to";

export class MangaFireParser {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: BASE_URL,
      timeout: 15_000,
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
        Referer: `${BASE_URL}/`,
      },
    });
  }

  async search(keyword: string, page: number = 1): Promise<any> {
    try {
      const vrf = generateVrf(keyword);
      const url = `/filter?keyword=${encodeURIComponent(keyword)}&page=${page}&vrf=${encodeURIComponent(vrf)}`;
      const { data } = await this.http.get(url);
      const $ = cheerio.load(data);

      const results: any[] = [];
      let totalPages = 0;

      const pageLinks = $("ul.pagination > li.page-item > a");
      if (pageLinks.length > 0) {
        pageLinks.each((_, el) => {
          const pageNum = parseInt($(el).text());
          if (!isNaN(pageNum) && pageNum > totalPages) {
            totalPages = pageNum;
          }
        });
      }

      if (totalPages === 0) {
        const totalMangasText = $("section.mt-5 > .head > span").text();
        const totalMangas = parseInt(totalMangasText.replace(/mangas?/i, "").trim());
        const resultsOnPage = $("div.original.card-lg > div.unit").length;
        if (!isNaN(totalMangas) && resultsOnPage > 0) {
          totalPages = Math.ceil(totalMangas / resultsOnPage);
        } else if (!isNaN(totalMangas) && totalMangas === 0) {
          totalPages = 0;
        } else {
          totalPages = 1;
        }
      }

      $("div.original.card-lg > div.unit").each((_, el) => {
        const id = $(el).find("a.poster").attr("href")?.replace("/manga/", "") || null;
        if (!id) return;

        const chapters: any[] = [];
        $(el)
          .find('ul.content[data-name="chap"] > li')
          .each((_, chapEl) => {
            chapters.push({
              url: $(chapEl).find("a").attr("href") || null,
              title: $(chapEl).find("a").attr("title") || null,
              chapter: $(chapEl).find("a > span:first-child").text().trim() || null,
              releaseDate: $(chapEl).find("a > span:last-child").text().trim() || null,
            });
          });

        results.push({
          id,
          title: $(el).find("div.info > a").text().trim() || null,
          poster: $(el).find("a.poster > div > img").attr("src")?.trim() || null,
          type: $(el).find("div.info > div > span.type").text().trim() || null,
          chapters,
        });
      });

      return {
        currentPage: page,
        totalPages,
        results,
      };
    } catch (err: any) {
      return { error: err.message };
    }
  }

  async scrapeMangaInfo(id: string): Promise<any> {
    try {
      const { data } = await this.http.get(`/manga/${id}`);
      const $ = cheerio.load(data);

      const genres = $(".meta div:contains('Genres:') a")
        .map((_, el) => $(el).text().trim())
        .get();

      const mangaInfo = {
        id,
        title: $('h1[itemprop="name"]').text().trim(),
        altTitles: $('h1[itemprop="name"]').siblings("h6").text().trim(),
        poster: $(".poster img")?.attr("src")?.trim() || null,
        status: $(".info > p").first().text().trim(),
        type: $(".min-info a").first().text().trim(),
        description: $(".description").text().replace("Read more +", "").trim(),
        author: $(".meta div:contains('Author:') a").text().trim(),
        published: $(".meta div:contains('Published:')").text().replace("Published:", "").trim(),
        genres,
        rating: $(".rating-box .live-score").text().trim(),
      };

      const similarManga: any[] = [];
      $("section.side-manga.default-style div.original.card-sm.body a.unit").each((_, el) => {
        similarManga.push({
          id: $(el).attr("href")?.split("/").pop() || null,
          name: $(el).find(".info h6").text().trim() || null,
          poster: $(el).find(".poster img").attr("src")?.trim() || null,
        });
      });

      return {
        ...mangaInfo,
        similarManga,
      };
    } catch (err: any) {
      return { error: err.message };
    }
  }

  async getLanguages(mangaId: string): Promise<any> {
    try {
      const { data } = await this.http.get(`/manga/${mangaId}`);
      const $ = cheerio.load(data);
      const languages: any[] = [];

      $('div[data-name="chapter"] .dropdown-menu a').each((_, el) => {
        const item = $(el);
        const text = item.text().trim();
        const chaptersMatch = text.match(/\((\d+)\s*Chapters?\)/i);

        languages.push({
          id: item.attr("data-code") || null,
          title: item.attr("data-title") || null,
          chapters: chaptersMatch ? `${chaptersMatch[1]} Chapters` : null,
        });
      });

      return languages;
    } catch (err: any) {
      return { error: err.message };
    }
  }

  async getChapters(mangaId: string, language?: string): Promise<any> {
    if (!language) {
      return this.getLanguages(mangaId);
    }

    try {
      let idPart = mangaId;
      if (mangaId.includes(".")) {
        const parts = mangaId.split(".");
        idPart = parts[parts.length - 1] as string;
      }

      const vrf = generateVrf(`${idPart}@chapter@${language.toLowerCase()}`);
      const { data } = await this.http.get(
        `/ajax/read/${idPart}/chapter/${language.toLowerCase()}?vrf=${encodeURIComponent(vrf)}`,
        {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            Referer: `${BASE_URL}/manga/${mangaId}`,
          },
        },
      );

      if (!data.result || !data.result.html) {
        return { error: "Failed to get chapters list from MangaFire" };
      }

      const $ = cheerio.load(data.result.html);
      const chapters: any[] = [];

      $("li").each((_, li) => {
        const a = $(li).find("a");
        const title = a.find("span:first-child").text().trim();
        const releaseDate = a.find("span:last-child").text().trim();

        chapters.push({
          number: $(a).attr("data-number") ?? "",
          title: title,
          chapterId: $(a).attr("data-id") ?? "",
          language: language,
          releaseDate: releaseDate || null,
        });
      });

      return chapters;
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async getChapterImages(chapterId: string): Promise<any> {
    try {
      const vrf = generateVrf(`chapter@${chapterId}`);
      const { data } = await this.http.get(
        `/ajax/read/chapter/${chapterId}?vrf=${encodeURIComponent(vrf)}`,
        {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            Referer: `${BASE_URL}/read/${chapterId}`,
          },
        },
      );

      if (!data.result || !data.result.images) {
        return { error: "Failed to get chapter images from MangaFire" };
      }
      return data.result.images.map((image: any[]) => image[0]);
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async scrapeHomePage(): Promise<any> {
    try {
      const { data } = await this.http.get(`/home`);
      const $ = cheerio.load(data);

      const res: Record<string, any> = {
        releasingManga: [],
        mostViewedManga: {
          day: [],
          week: [],
          month: [],
        },
        recentlyUpdatedManga: [],
        newReleaseManga: [],
      };

      $("#top-trending .container .swiper .swiper-wrapper .swiper-slide").each((_, el) => {
        res.releasingManga.push({
          id: $(el).find(".info .above a")?.attr("href")?.replace("/manga/", "") || null,
          status: $(el).find(".info .above span")?.text()?.trim() || null,
          name: $(el).find(".info .above a")?.text()?.trim() || null,
          description: $(el).find(".info .below span")?.text()?.trim() || null,
          currentChapter: $(el).find(".info .below p")?.text()?.trim() || null,
          genres:
            $(el)
              .find(".info .below div a")
              ?.map((_, g) => $(g).text().trim())
              .get() || [],
          poster: $(el).find(".swiper-inner a div img")?.attr("src")?.trim() || null,
        });
      });

      $("#most-viewed .tab-content[data-name='day'] .swiper-slide.unit").each((_, el) => {
        res.mostViewedManga.day.push({
          id: $(el).find("a")?.attr("href")?.replace("/manga/", "") || null,
          name: $(el).find("a span")?.text()?.trim() || null,
          rank: $(el).find("a b")?.text()?.trim() || null,
          poster: $(el).find("a .poster img")?.attr("src")?.trim() || null,
        });
      });

      $("#most-viewed .tab-content[data-name='week'] .swiper-slide.unit").each((_, el) => {
        res.mostViewedManga.week.push({
          id: $(el).find("a")?.attr("href")?.replace("/manga/", "") || null,
          name: $(el).find("a span")?.text()?.trim() || null,
          rank: $(el).find("a b")?.text()?.trim() || null,
          poster: $(el).find("a .poster img")?.attr("src")?.trim() || null,
        });
      });

      $("#most-viewed .tab-content[data-name='month'] .swiper-slide.unit").each((_, el) => {
        res.mostViewedManga.month.push({
          id: $(el).find("a")?.attr("href")?.replace("/manga/", "") || null,
          name: $(el).find("a span")?.text()?.trim() || null,
          rank: $(el).find("a b")?.text()?.trim() || null,
          poster: $(el).find("a .poster img")?.attr("src")?.trim() || null,
        });
      });

      $(".tab-content[data-name='all'] .unit").each((_, el) => {
        const chapters: any[] = [];
        $(el)
          .find(".info .content[data-name='chap'] li")
          .each((_, cEl) => {
            chapters.push({
              id: $(cEl).find("a")?.attr("href")?.replace("/read/", "") || null,
              chapterName: $(cEl).find("a span").first().text().trim(),
              releaseTime: $(cEl).find("a span").last().text().trim(),
            });
          });

        res.recentlyUpdatedManga.push({
          id: $(el).find(".inner > a")?.attr("href")?.replace("/manga/", "") || null,
          name: $(el).find(".info > a")?.text()?.trim() || null,
          poster: $(el).find(".inner > a img")?.attr("src")?.trim() || null,
          type: $(el).find(".inner .info div .type")?.text()?.trim() || null,
          latestChapters: chapters,
        });
      });

      $(".swiper-container .swiper.completed .card-md .swiper-slide.unit").each((_, el) => {
        res.newReleaseManga.push({
          id: $(el).find("a")?.attr("href")?.replace("/manga/", "") || null,
          name: $(el).find("a span")?.text()?.trim() || null,
          poster: $(el).find("a .poster img")?.attr("src")?.trim() || null,
        });
      });

      return res;
    } catch (err: any) {
      return { error: err.message };
    }
  }

  async scrapeLatestPage(pageType: string, page: number = 1): Promise<any> {
    try {
      const { data } = await this.http.get(`/${pageType}?page=${page}`);
      const $ = cheerio.load(data);

      const results: any[] = [];
      const totalMangaText = $("section.mt-5 > .head > span").text().trim();
      const totalMangaMatch = totalMangaText.match(/(\d{1,3}(,\d{3})*)/);
      const totalManga = totalMangaMatch ? parseInt(totalMangaMatch[0].replace(/,/g, "")) : 0;

      const mangaOnPage = $("div.original.card-lg > div.unit").length;

      let totalPages = 1;
      if (totalManga > 0 && mangaOnPage > 0) {
        totalPages = Math.ceil(totalManga / mangaOnPage);
      }

      $("div.original.card-lg > div.unit").each((_, el) => {
        const chapters: any[] = [];
        $(el)
          .find('ul.content[data-name="chap"] > li')
          .each((_, chapEl) => {
            chapters.push({
              url: $(chapEl).find("a").attr("href") || null,
              title: $(chapEl).find("a").attr("title") || null,
              chapter: $(chapEl).find("a > span:first-child").text().trim() || null,
              releaseDate: $(chapEl).find("a > span:last-child").text().trim() || null,
            });
          });

        results.push({
          id: $(el).find("a.poster").attr("href")?.replace("/manga/", "") || null,
          title: $(el).find("div.info > a").text().trim() || null,
          poster: $(el).find("a.poster > div > img").attr("src")?.trim() || null,
          type: $(el).find("div.info > div > span.type").text().trim() || null,
          chapters,
        });
      });

      return {
        results,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
      };
    } catch (err: any) {
      return { error: err.message };
    }
  }

  async scrapeCategory(category: string, page: number = 1): Promise<any> {
    try {
      const { data } = await this.http.get(`/type/${category}?page=${page}`);
      const $ = cheerio.load(data);

      const results: any[] = [];
      const totalMangaText = $("section.mt-5 > .head > span").text().trim();
      const totalMangaMatch = totalMangaText.match(/(\d{1,3}(,\d{3})*)/);
      const totalManga = totalMangaMatch ? parseInt(totalMangaMatch[0].replace(/,/g, "")) : 0;

      const mangaOnPage = $("div.original.card-lg > div.unit").length;

      let totalPages = 1;
      if (totalManga > 0 && mangaOnPage > 0) {
        totalPages = Math.ceil(totalManga / mangaOnPage);
      }

      $("div.original.card-lg > div.unit").each((_, el) => {
        const chapters: any[] = [];
        $(el)
          .find('ul.content[data-name="chap"] > li')
          .each((_, chapEl) => {
            chapters.push({
              url: $(chapEl).find("a").attr("href") || null,
              title: $(chapEl).find("a").attr("title") || null,
              chapter: $(chapEl).find("a > span:first-child").text().trim() || null,
              releaseDate: $(chapEl).find("a > span:last-child").text().trim() || null,
            });
          });

        results.push({
          id: $(el).find("a.poster").attr("href")?.replace("/manga/", "") || null,
          title: $(el).find("div.info > a").text().trim() || null,
          poster: $(el).find("a.poster > div > img").attr("src")?.trim() || null,
          type: $(el).find("div.info > div > span.type").text().trim() || null,
          chapters,
        });
      });

      return {
        results,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        category,
      };
    } catch (err: any) {
      return { error: err.message };
    }
  }

  async scrapeGenre(genre: string, page: number = 1): Promise<any> {
    try {
      const { data } = await this.http.get(`/genre/${genre}?page=${page}`);
      const $ = cheerio.load(data);

      const results: any[] = [];
      const totalMangaText = $("section.mt-5 > .head > span").text().trim();
      const totalMangaMatch = totalMangaText.match(/(\d{1,3}(,\d{3})*)/);
      const totalManga = totalMangaMatch ? parseInt(totalMangaMatch[0].replace(/,/g, "")) : 0;

      const mangaOnPage = $("div.original.card-lg > div.unit").length;

      let totalPages = 1;
      if (totalManga > 0 && mangaOnPage > 0) {
        totalPages = Math.ceil(totalManga / mangaOnPage);
      }

      $("div.original.card-lg > div.unit").each((_, el) => {
        const chapters: any[] = [];
        $(el)
          .find('ul.content[data-name="chap"] > li')
          .each((_, chapEl) => {
            chapters.push({
              url: $(chapEl).find("a").attr("href") || null,
              title: $(chapEl).find("a").attr("title") || null,
              chapter: $(chapEl).find("a > span:first-child").text().trim() || null,
              releaseDate: $(chapEl).find("a > span:last-child").text().trim() || null,
            });
          });

        results.push({
          id: $(el).find("a.poster").attr("href")?.replace("/manga/", "") || null,
          title: $(el).find("div.info > a").text().trim() || null,
          poster: $(el).find("a.poster > div > img").attr("src")?.trim() || null,
          type: $(el).find("div.info > div > span.type").text().trim() || null,
          chapters,
        });
      });

      return {
        results,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        genre,
      };
    } catch (err: any) {
      return { error: err.message };
    }
  }

  async getVolumes(mangaId: string, language: string = "en"): Promise<any> {
    try {
      let idPart = mangaId;
      if (mangaId.includes(".")) {
        const parts = mangaId.split(".");
        idPart = parts[parts.length - 1] as string;
      }

      const { data } = await this.http.get(
        `/ajax/manga/${idPart}/volume/${language.toLowerCase()}`,
        {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            Referer: `${BASE_URL}/manga/${mangaId}`,
          },
        },
      );

      if (!data.result) {
        return { error: "Failed to fetch volumes" };
      }

      const $ = cheerio.load(data.result);
      const volumes: any[] = [];

      $(".unit").each((_, element) => {
        const url = $(element).find("a").attr("href") || null;
        let volumeNumber = null;
        if (url) {
          const match = url.match(/volume-(\d+)/);
          if (match) volumeNumber = match[1];
        }

        const image = $(element).find("img").attr("src");
        volumes.push({
          volume: volumeNumber,
          url,
          image: image?.startsWith("http") ? image : `${BASE_URL}${image}`,
        });
      });

      return {
        mangaId,
        volumes,
      };
    } catch (error: any) {
      return { error: error.message };
    }
  }
}

export const mangafire = new MangaFireParser();
