import * as cheerio from "cheerio";
import { compareTwoStrings } from "string-similarity";
import { Logger } from "../../../core/logger";
import { USER_AGENT } from "../animepahe/scraper";
import { MegaUp } from "./scraper/megaup";
import type {
  AnimeKaiEpisode,
  AnimeKaiInfo,
  AnimeKaiPagedResult,
  AnimeKaiSearchItem,
  AnimeKaiServer,
} from "./types";

export class AnimeKai {
  private static baseUrl = "https://anikai.to";

  private static headers(): Record<string, string> {
    return {
      "User-Agent": USER_AGENT,
      Connection: "keep-alive",
      Accept: "text/html, */*; q=0.01",
      "Accept-Language": "en-US,en;q=0.5",
      "Sec-GPC": "1",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      Priority: "u=0",
      Pragma: "no-cache",
      "Cache-Control": "no-cache",
      Referer: `${this.baseUrl}/`,
      Cookie: "__p_mov=1; usertype=guest; session=vLrU4aKItp0QltI2asH83yugyWDsSSQtyl9sxWKO",
    };
  }

  // ─── Paginated Card Scraper ──────────────────────────────────────────────────

  private static async scrapeCardPage(url: string): Promise<AnimeKaiPagedResult<AnimeKaiSearchItem>> {
    try {
      const res = await fetch(url, { headers: this.headers() });
      const html = await res.text();
      const $ = cheerio.load(html);

      const pagination = $("ul.pagination");
      const currentPage =
        parseInt(pagination.find(".page-item.active span.page-link").text().trim()) || 0;

      const nextPageHref = pagination
        .find(".page-item.active")
        .next()
        .find("a.page-link")
        .attr("href");
      const nextPageVal = nextPageHref?.split("page=")[1];
      const hasNextPage = !!nextPageVal && nextPageVal !== "";

      const lastPageHref = pagination.find(".page-item:last-child a.page-link").attr("href");
      const lastPageVal = lastPageHref?.split("page=")[1];
      const totalPages =
        lastPageVal && lastPageVal !== "" ? parseInt(lastPageVal) || 0 : currentPage;

      const results: AnimeKaiSearchItem[] = [];
      $(".aitem").each((_, ele) => {
        const card = $(ele);
        const atag = card.find("div.inner > a");
        const id = atag.attr("href")?.replace("/watch/", "") || "";
        const type = card.find(".info").children().last().text().trim();

        results.push({
          id,
          title: atag.text().trim(),
          url: `${this.baseUrl}${atag.attr("href")}`,
          image: card.find("img").attr("data-src") || card.find("img").attr("src"),
          japaneseTitle: card.find("a.title").attr("data-jp")?.trim(),
          type,
          sub: parseInt(card.find(".info span.sub").text()) || 0,
          dub: parseInt(card.find(".info span.dub").text()) || 0,
          episodes:
            parseInt(card.find(".info").children().eq(-2).text().trim()) ||
            parseInt(card.find(".info span.sub").text()) ||
            0,
        });
      });

      return {
        currentPage: results.length === 0 ? 0 : currentPage,
        hasNextPage: results.length === 0 ? false : hasNextPage,
        totalPages: results.length === 0 ? 0 : totalPages,
        results,
      };
    } catch (err) {
      Logger.error(`AnimeKai scrapeCardPage error for ${url}: ${String(err)}`);
      return { currentPage: 0, hasNextPage: false, totalPages: 0, results: [] };
    }
  }

  // ─── Browsing Endpoints ──────────────────────────────────────────────────────

  static async search(query: string, page: number = 1): Promise<AnimeKaiPagedResult<AnimeKaiSearchItem>> {
    if (page <= 0) page = 1;
    return this.scrapeCardPage(
      `${this.baseUrl}/browser?keyword=${encodeURIComponent(query.replace(/[\W_]+/g, "+"))}&page=${page}`
    );
  }

  static async latest(page: number = 1): Promise<AnimeKaiPagedResult<AnimeKaiSearchItem>> {
    return this.recentlyUpdated(page);
  }

  static async recentlyUpdated(page: number = 1): Promise<AnimeKaiPagedResult<AnimeKaiSearchItem>> {
    if (page <= 0) page = 1;
    return this.scrapeCardPage(`${this.baseUrl}/updates?page=${page}`);
  }

  static async latestCompleted(page: number = 1): Promise<AnimeKaiPagedResult<AnimeKaiSearchItem>> {
    if (page <= 0) page = 1;
    return this.scrapeCardPage(`${this.baseUrl}/completed?page=${page}`);
  }

  static async newReleases(page: number = 1): Promise<AnimeKaiPagedResult<AnimeKaiSearchItem>> {
    if (page <= 0) page = 1;
    return this.scrapeCardPage(`${this.baseUrl}/new-releases?page=${page}`);
  }

  static async recentlyAdded(page: number = 1): Promise<AnimeKaiPagedResult<AnimeKaiSearchItem>> {
    if (page <= 0) page = 1;
    return this.scrapeCardPage(`${this.baseUrl}/recent?page=${page}`);
  }

  static async movies(page: number = 1): Promise<AnimeKaiPagedResult<AnimeKaiSearchItem>> {
    if (page <= 0) page = 1;
    return this.scrapeCardPage(`${this.baseUrl}/movie?page=${page}`);
  }

  static async tv(page: number = 1): Promise<AnimeKaiPagedResult<AnimeKaiSearchItem>> {
    if (page <= 0) page = 1;
    return this.scrapeCardPage(`${this.baseUrl}/tv?page=${page}`);
  }

  static async ova(page: number = 1): Promise<AnimeKaiPagedResult<AnimeKaiSearchItem>> {
    if (page <= 0) page = 1;
    return this.scrapeCardPage(`${this.baseUrl}/ova?page=${page}`);
  }

  static async ona(page: number = 1): Promise<AnimeKaiPagedResult<AnimeKaiSearchItem>> {
    if (page <= 0) page = 1;
    return this.scrapeCardPage(`${this.baseUrl}/ona?page=${page}`);
  }

  static async specials(page: number = 1): Promise<AnimeKaiPagedResult<AnimeKaiSearchItem>> {
    if (page <= 0) page = 1;
    return this.scrapeCardPage(`${this.baseUrl}/special?page=${page}`);
  }

  static async genreSearch(genre: string, page: number = 1): Promise<AnimeKaiPagedResult<AnimeKaiSearchItem>> {
    if (!genre) throw new Error("genre is required");
    if (page <= 0) page = 1;
    return this.scrapeCardPage(`${this.baseUrl}/genres/${genre}?page=${page}`);
  }

  // ─── Genres ─────────────────────────────────────────────────────────────────

  static async genres(): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/home`, { headers: this.headers() });
      const html = await res.text();
      const $ = cheerio.load(html);
      const results: string[] = [];
      $("#menu").find("ul.c4 li a").each((_, ele) => {
        results.push($(ele).text().trim().toLowerCase());
      });
      return results;
    } catch (err) {
      Logger.error(`AnimeKai genres error: ${String(err)}`);
      return [];
    }
  }

  // ─── Schedule ────────────────────────────────────────────────────────────────

  static async schedule(date: string = new Date().toISOString().split("T")[0]!): Promise<any[]> {
    try {
      const tz = 5.5;
      const timestamp = Math.floor(new Date(`${date}T00:00:00Z`).getTime() / 1000);
      const url = `${this.baseUrl}/ajax/schedule/items?tz=${tz}&time=${timestamp}`;
      const res = await fetch(url, { headers: this.headers() });
      const data = await res.json();
      let html = data.result;
      if (typeof html === "object" && html.html) html = html.html;

      const $ = cheerio.load(typeof html === "string" ? html : "");
      const results: any[] = [];
      $("ul li").each((_, ele) => {
        const card = $(ele);
        const titleElement = card.find("span.title");
        results.push({
          id: card.find("a").attr("href")?.split("/")[2],
          title: titleElement.text().trim(),
          japaneseTitle: titleElement.attr("data-jp"),
          airingTime: card.find("span.time").text().trim(),
          airingEpisode: card.find("span").last().text().trim().replace("EP ", ""),
        });
      });
      return results;
    } catch (err) {
      Logger.error(`AnimeKai schedule error: ${String(err)}`);
      return [];
    }
  }

  // ─── Spotlight ───────────────────────────────────────────────────────────────

  static async spotlight(): Promise<any[]> {
    try {
      const res = await fetch(`${this.baseUrl}/home`, { headers: this.headers() });
      const html = await res.text();
      const $ = cheerio.load(html);
      const results: any[] = [];
      $("div.swiper-wrapper > div.swiper-slide").each((_, el) => {
        const card = $(el);
        const titleElement = card.find("div.detail > p.title");
        const id = card.find("div.swiper-ctrl > a.btn").attr("href")?.replace("/watch/", "");
        const style = card.attr("style") || "";
        const banner = style.match(/background-image:\s*url\(["']?(.+?)["']?\)/)?.[1] || null;

        results.push({
          id,
          title: titleElement.text().trim(),
          japaneseTitle: titleElement.attr("data-jp"),
          banner,
          url: `${this.baseUrl}/watch/${id}`,
          type: card.find("div.detail > div.info").children().eq(-2).text().trim(),
          genres: card
            .find("div.detail > div.info")
            .children()
            .last()
            .text()
            .trim()
            .split(",")
            .map((g) => g.trim()),
          releaseDate: card
            .find('div.detail > div.mics > div:contains("Release")')
            .children("span")
            .text()
            .trim(),
          quality: card
            .find('div.detail > div.mics > div:contains("Quality")')
            .children("span")
            .text()
            .trim(),
          sub: parseInt(card.find("div.detail > div.info > span.sub").text().trim()) || 0,
          dub: parseInt(card.find("div.detail > div.info > span.dub").text().trim()) || 0,
          description: card.find("div.detail > p.desc").text().trim(),
        });
      });
      return results;
    } catch (err) {
      Logger.error(`AnimeKai spotlight error: ${String(err)}`);
      return [];
    }
  }

  // ─── Search Suggestions ──────────────────────────────────────────────────────

  static async suggestions(query: string): Promise<any[]> {
    try {
      const url = `${this.baseUrl}/ajax/anime/search?keyword=${encodeURIComponent(query.replace(/[\W_]+/g, "+"))}`;
      const res = await fetch(url, { headers: this.headers() });
      const data = await res.json();
      // Consumet accesses result.html; handle both shapes
      const htmlContent = data.result?.html ?? data.result ?? "";
      const $ = cheerio.load(typeof htmlContent === "string" ? htmlContent : "");
      const results: any[] = [];
      $("a.aitem").each((_, el) => {
        const card = $(el);
        const titleElement = card.find(".title");
        const id = card.attr("href")?.split("/")[2];
        results.push({
          id,
          title: titleElement.text().trim(),
          url: `${this.baseUrl}/watch/${id}`,
          japaneseTitle: titleElement.attr("data-jp") || null,
          image: card.find(".poster img").attr("src"),
          type: card.find(".info").children().eq(-3).text().trim(),
          year: card.find(".info").children().eq(-2).text().trim(),
          sub: parseInt(card.find(".info span.sub").text()) || 0,
          dub: parseInt(card.find(".info span.dub").text()) || 0,
          episodes: parseInt(card.find(".info").children().eq(-4).text().trim()) || 0,
        });
      });
      return results;
    } catch (err) {
      Logger.error(`AnimeKai suggestions error: ${String(err)}`);
      return [];
    }
  }

  // ─── Anime Info ──────────────────────────────────────────────────────────────

  static async info(id: string): Promise<AnimeKaiInfo | null> {
    try {
      const animeSlug = id.split("$")[0]!;
      const res = await fetch(`${this.baseUrl}/watch/${animeSlug}`, {
        headers: this.headers(),
      });
      const html = await res.text();
      const $ = cheerio.load(html);

      const info: any = {
        id: animeSlug,
        title: $(".entity-scroll > .title").text().trim(),
        japaneseTitle: $(".entity-scroll > .title").attr("data-jp")?.trim(),
        image: $("div.poster > div > img").attr("src"),
        description: $(".entity-scroll > .desc").text().trim(),
        type: $(".entity-scroll > .info")
          .children()
          .last()
          .text()
          .toUpperCase(),
        url: `${this.baseUrl}/watch/${animeSlug}`,
      };

      // Sub / dub availability
      const hasSub = $(".entity-scroll > .info > span.sub").length > 0;
      const hasDub = $(".entity-scroll > .info > span.dub").length > 0;
      info.hasSub = hasSub;
      info.hasDub = hasDub;
      info.subOrDub = hasSub && hasDub ? "both" : hasDub ? "dub" : "sub";

      // Genres
      $(".entity-scroll > .detail div").each(function () {
        const text = $(this).text().trim();
        if (text.startsWith("Genres:")) {
          info.genres = text
            .replace("Genres:", "")
            .split(",")
            .map((g: string) => g.trim());
        }
      });

      // Status
      const statusText = $(".entity-scroll > .detail")
        .find("div:contains('Status') > span")
        .text()
        .trim();
      info.status = statusText;

      info.season = $(".entity-scroll > .detail")
        .find("div:contains('Premiered') > span")
        .text()
        .trim();
      info.duration = $(".entity-scroll > .detail")
        .find("div:contains('Duration') > span")
        .text()
        .trim();

      // External links (MAL / AniList)
      $(".entity-scroll > .detail div")
        .filter((_, el) => $(el).text().includes("Links:"))
        .find("a")
        .each((_, el) => {
          const href = $(el).attr("href") ?? "";
          if (href.includes("myanimelist")) {
            info.malId = href.match(/anime\/(\d+)/)?.[1];
          }
          if (href.includes("anilist")) {
            info.anilistId = href.match(/anime\/(\d+)/)?.[1];
          }
        });

      // Recommendations
      info.recommendations = [];
      $("section.sidebar-section:not(#related-anime) .aitem-col .aitem").each((_, ele) => {
        const aTag = $(ele);
        const recId = aTag.attr("href")?.replace("/watch/", "");
        info.recommendations!.push({
          id: recId,
          title: aTag.find(".title").text().trim(),
          url: `${this.baseUrl}${aTag.attr("href")}`,
          image:
            aTag.attr("style")?.match(/background-image:\s*url\('(.+?)'\)/)?.[1] ??
            aTag.find("img").attr("src"),
          japaneseTitle: aTag.find(".title").attr("data-jp")?.trim(),
          type: aTag.find(".info").children().last().text().trim(),
          sub: parseInt(aTag.find(".info span.sub").text()) || 0,
          dub: parseInt(aTag.find(".info span.dub").text()) || 0,
          episodes:
            parseInt(aTag.find(".info").children().eq(-2).text().trim()) ||
            parseInt(aTag.find(".info span.sub").text()) ||
            0,
        });
      });

      // Relations
      info.relations = [];
      $("section#related-anime .aitem-col a.aitem").each((_, el) => {
        const aTag = $(el);
        const infoBox = aTag.find(".info");
        const relId = aTag.attr("href")?.replace("/watch/", "") ?? "";
        const bolds = infoBox.find("span > b");
        let episodes = 0;
        let type = "";
        let relationType = "";
        bolds.each((_, b) => {
          const text = $(b).text().trim();
          if ($(b).hasClass("text-muted")) {
            relationType = text;
          } else if (/^\d+$/.test(text)) {
            episodes = parseInt(text);
          } else {
            type = text;
          }
        });
        info.relations!.push({
          id: relId,
          title: aTag.find(".title").text().trim(),
          url: `${this.baseUrl}${aTag.attr("href")}`,
          image: aTag.attr("style")?.match(/background-image:\s*url\('(.+?)'\)/)?.[1],
          japaneseTitle: aTag.find(".title").attr("data-jp")?.trim(),
          type: type.toUpperCase(),
          sub: parseInt(infoBox.find(".sub").text()) || 0,
          dub: parseInt(infoBox.find(".dub").text()) || 0,
          relationType,
          episodes,
        });
      });

      // Episodes
      const aniId = $(".rate-box#anime-rating").attr("data-id");
      if (!aniId) return info;

      const episodesToken = await MegaUp.generateToken(aniId);
      const episodesRes = await fetch(
        `${this.baseUrl}/ajax/episodes/list?ani_id=${aniId}&_=${episodesToken}`,
        {
          headers: {
            ...this.headers(),
            "X-Requested-With": "XMLHttpRequest",
            Referer: `${this.baseUrl}/watch/${animeSlug}`,
          },
        }
      );
      const epData = await episodesRes.json();
      const epHtml = epData.result;

      if (typeof epHtml === "string") {
        const $$ = cheerio.load(epHtml);
        info.totalEpisodes = $$("div.eplist > ul > li").length;
        info.episodes = [];

        const subCount = parseInt($(".entity-scroll > .info > span.sub").text()) || 0;
        const dubCount = parseInt($(".entity-scroll > .info > span.dub").text()) || 0;

        $$("div.eplist > ul > li > a").each((_, el) => {
          const numAttr = $$(el).attr("num")!;
          const tokenAttr = $$(el).attr("token")!;
          const number = parseInt(numAttr);

          info.episodes.push({
            id: `${animeSlug}$ep=${numAttr}$token=${tokenAttr}`,
            number,
            title: $$(el).children("span").text().trim(),
            isFiller: $$(el).hasClass("filler"),
            isSubbed: number <= subCount,
            isDubbed: number <= dubCount,
            url: `${this.baseUrl}/watch/${animeSlug}${$$(el).attr("href")}ep=${numAttr}`,
          });
        });
      }

      return info;
    } catch (err) {
      Logger.error(`AnimeKai info error: ${String(err)}`);
      return null;
    }
  }

  // ─── Episode Servers ─────────────────────────────────────────────────────────

  static async fetchEpisodeServers(
    episodeId: string,
    subOrDub: "softsub" | "dub" = "softsub"
  ): Promise<AnimeKaiServer[]> {
    try {
      const token = episodeId.split("$token=")[1];
      if (!token) return [];

      const ajaxToken = await MegaUp.generateToken(token);
      const url = `${this.baseUrl}/ajax/links/list?token=${token}&_=${ajaxToken}`;
      const res = await fetch(url, { headers: this.headers() });
      const data = await res.json();
      const serverHtml = data.result;

      if (typeof serverHtml !== "string") return [];

      const $ = cheerio.load(serverHtml);
      const servers: AnimeKaiServer[] = [];

      const serverItems = $(`.server-items.lang-group[data-id="${subOrDub}"] .server`);

      await Promise.all(
        serverItems.toArray().map(async (server) => {
          const lid = $(server).attr("data-lid");
          if (!lid) return;

          const viewToken = await MegaUp.generateToken(lid);
          const viewRes = await fetch(
            `${this.baseUrl}/ajax/links/view?id=${lid}&_=${viewToken}`,
            { headers: this.headers() }
          );
          const viewData = await viewRes.json();
          const decoded = await MegaUp.decodeIframeData(viewData.result);

          servers.push({
            name: `megaup ${$(server).text().trim()}`.toLowerCase(),
            url: decoded.url,
            intro: {
              start: decoded.skip.intro[0],
              end: decoded.skip.intro[1],
            },
            outro: {
              start: decoded.skip.outro[0],
              end: decoded.skip.outro[1],
            },
          });
        })
      );

      return servers;
    } catch (err) {
      Logger.error(`AnimeKai fetchEpisodeServers error: ${String(err)}`);
      return [];
    }
  }

  // ─── Streams ─────────────────────────────────────────────────────────────────

  static async streams(
    animeId: string,
    episodeId: string,
    subOrDub: "softsub" | "dub" = "softsub"
  ): Promise<any[]> {
    try {
      const token = episodeId.split("$token=")[1];
      if (!token) return [];

      const ajaxToken = await MegaUp.generateToken(token);
      const serversUrl = `${this.baseUrl}/ajax/links/list?token=${token}&_=${ajaxToken}`;
      const res = await fetch(serversUrl, { headers: this.headers() });
      const data = await res.json();
      const serverHtml = data.result;

      if (typeof serverHtml !== "string") return [];

      const $ = cheerio.load(serverHtml);
      const results: any[] = [];

      const langGroups =
        subOrDub === "dub"
          ? [".server-items.lang-group[data-id='dub']"]
          : [".server-items.lang-group[data-id='softsub']", ".lang-group[data-id='softsub']"];

      const seen = new Set<string>();
      for (const group of langGroups) {
        const isDub = group.includes("[data-id='dub']");
        const serverItems = $(`${group} .server`);

        for (const item of serverItems.toArray()) {
          const lid = $(item).attr("data-lid");
          if (!lid || seen.has(lid)) continue;
          seen.add(lid);

          const viewToken = await MegaUp.generateToken(lid);
          const viewUrl = `${this.baseUrl}/ajax/links/view?id=${lid}&_=${viewToken}`;
          const viewRes = await fetch(viewUrl, { headers: this.headers() });
          const viewData = await viewRes.json();

          const decoded = await MegaUp.decodeIframeData(viewData.result);
          const videoSources = await MegaUp.extract(decoded.url);

          results.push({
            name: `MegaUp ${$(item).text().trim()}${isDub ? " (Dub)" : ""}`,
            url: decoded.url,
            intro: decoded.skip.intro,
            outro: decoded.skip.outro,
            isDub,
            ...videoSources,
          });
        }
      }

      return results;
    } catch (err) {
      Logger.error(`AnimeKai streams error: ${String(err)}`);
      return [];
    }
  }

  // ─── Resolve / Mapping Helpers ───────────────────────────────────────────────

  static async resolveByExternalId(params: {
    mal_id?: number;
    anilist_id?: number;
  }): Promise<string | null> {
    return null; // Removing AniZip means we can't easily resolve by external ID without a search title
  }

  static async getEpisodeSession(
    animeId: string,
    episodeNumber: number
  ): Promise<string | null> {
    try {
      const info = await this.info(animeId);
      if (!info) return null;

      const episode = info.episodes.find((ep: AnimeKaiEpisode) => ep.number === episodeNumber);
      return episode ? episode.id : null;
    } catch (err) {
      Logger.error(`AnimeKai getEpisodeSession error: ${String(err)}`);
      return null;
    }
  }

  static async getMappingsAndName(id: string): Promise<{ mappings: any | null; name: string } | null> {
    try {
      const info = await this.info(id);
      if (!info) return null;

      const malId = info.malId ? parseInt(info.malId) : null;
      const anilistId = info.anilistId ? parseInt(info.anilistId) : null;

      const mappings = (malId || anilistId) ? {
          mal_id: malId,
          anilist_id: anilistId,
          themoviedb_id: null,
          imdb_id: null,
          thetvdb_id: null,
          kitsu_id: null,
          anidb_id: null,
          anisearch_id: null,
          livechart_id: null,
          animeplanet_id: null,
          notifymoe_id: null,
      } : null;

      return {
        mappings,
        name: info.title,
      };
    } catch (err) {
      Logger.error(`AnimeKai getMappingsAndName error: ${String(err)}`);
      return null;
    }
  }
}
