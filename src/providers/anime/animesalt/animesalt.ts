import * as cheerio from "cheerio";
import { Cache } from "../../../core/cache";
import { Logger } from "../../../core/logger";
import {
  ANIME_SALT_BASE,
  embedPlayerOrigins,
  UserAgent,
  ASCDN_SOURCE_TTL,
  RUBYSTREAM_SOURCE_TTL,
} from "./constants";
import { getAsCdnSource } from "./scraper/as-cdn";
import { getRubystmSource } from "./scraper/rubystm";

import type { AnimeCard, LastEpisode, Season, Episode, DirectSource } from "./types";

export class AnimeSalt {
  private static async fetchHtml(url: string) {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UserAgent,
      },
    });

    if (!res.ok) throw new Error("Fetch failed: " + url);

    return cheerio.load(await res.text());
  }

  private static async resolveSource(url: string): Promise<DirectSource | null> {
    try {
      if (url.includes("as-cdn")) return await getAsCdnSource(url);
      if (url.includes("rubystream")) return await getRubystmSource(url);

      return null;
    } catch (err) {
      Logger.error("resolveSource error:", err);
      return null;
    }
  }

  static async home() {
    const key = "home";

    try {
      const cached = await Cache.get(key);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (err) {
          Logger.warn("Ignored error:", err);
        }
      }

      const $ = await this.fetchHtml(ANIME_SALT_BASE + "/");

      const main: any[] = [];
      const sidebar: any[] = [];
      const lastEpisodes: LastEpisode[] = [];
      const networks: any[] = [];

      $("#gs_logo_area_3 a").each((_, el) => {
        const link = $(el);
        const url = link.attr("href") || "";
        if (!url.includes("/category/network/")) return;

        const slug = url.split("/").filter(Boolean).pop() || "";
        const img = link.find("img");

        const name = img.attr("title")?.trim() || img.attr("alt")?.trim() || slug;

        let logo = img.attr("data-src") || img.attr("src") || "";
        if (logo.startsWith("//")) logo = "https:" + logo;

        networks.push({ name, slug, url, logo });
      });

      $(".widget_list_episodes li").each((_, ep) => {
        const link = $(ep).find("a.lnk-blk");
        const url = link.attr("href") || "";

        const img = $(ep).find("img");

        let thumbnail = img.attr("data-src") || img.attr("data-lazy-src") || img.attr("src") || "";

        if (thumbnail.startsWith("//")) thumbnail = "https:" + thumbnail;

        if (!url || !thumbnail) return;

        const slug = url.split("/").filter(Boolean).pop() || "";

        const title =
          $(ep).find("header h2.entry-title").text().trim() ||
          img
            .attr("alt")
            ?.replace(/^Image\s+/i, "")
            .trim() ||
          "";

        const season = $(ep).find(".post-ql").text().trim();
        const epNum = $(ep).find(".year").text().trim();

        lastEpisodes.push({
          title,
          slug,
          url,
          epXseason: `${season} ${epNum}`.trim(),
          ago: "",
          thumbnail,
        });
      });

      $("section.widget_list_movies_series").each((_, sect) => {
        const titleElem = $(sect).find("h3.section-title a");

        let label = titleElem.clone().children().remove().end().text().trim();

        if (!label) {
          label = $(sect).find("h3.section-title").text().trim();
        }

        const viewMore = titleElem.attr("href");

        const data: AnimeCard[] = [];

        $(sect)
          .find(".latest-movies-series-swiper-slide li")
          .each((_, item) => {
            const img = $(item).find("img");
            const url = $(item).find("a.lnk-blk").attr("href") || "";

            let poster = img.attr("data-src") || img.attr("data-lazy-src") || img.attr("src") || "";

            if (poster.startsWith("//")) poster = "https:" + poster;

            if (!url || !poster) return;

            const slug = url.split("/").filter(Boolean).pop() || "";

            const title =
              img
                .attr("alt")
                ?.replace(/^Image\s+/i, "")
                .trim() || "";

            data.push({
              title,
              slug,
              poster,
              url,
              type: url.includes("/series/") ? "series" : "movie",
            });
          });

        if (data.length) {
          main.push({ label, viewMore, data });
        }
      });

      $(".section-title").each((_, header) => {
        const label = $(header).text().trim();

        if ($(header).closest("section.widget_list_movies_series").length) return;

        const chart = $(header).nextAll(".aa-cn").first();
        if (!chart.length) return;

        const data: AnimeCard[] = [];

        chart.find(".chart-item").each((_, item) => {
          const url = $(item).find("a").attr("href") || "";
          const img = $(item).find("img");

          let poster = img.attr("data-src") || img.attr("data-lazy-src") || img.attr("src") || "";

          if (poster.startsWith("//")) poster = "https:" + poster;

          if (!url || !poster) return;

          const slug = url.split("/").filter(Boolean).pop() || "";

          data.push({
            title: $(item).find(".chart-title").text().trim(),
            slug,
            poster,
            url,
            type: url.includes("/series/") ? "series" : "movie",
          });
        });

        if (data.length) {
          sidebar.push({ label, data });
        }
      });

      const result = { networks, main, sidebar, lastEpisodes };

      await Cache.set(key, JSON.stringify(result), 43200);

      return result;
    } catch (err) {
      Logger.error("AnimeSalt.home error:", err);

      return {
        networks: [],
        main: [],
        sidebar: [],
        lastEpisodes: [],
      };
    }
  }

  static async search(query: string, page = 1) {
    const key = `search:${query}:${page}`;

    const cached = await Cache.get(key);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (err) {
        Logger.warn("Ignored error:", err);
      }
    }

    try {
      const encoded = encodeURIComponent(query).replace(/%20/g, "+");

      const url =
        page === 1
          ? `${ANIME_SALT_BASE}/?s=${encoded}`
          : `${ANIME_SALT_BASE}/page/${page}/?s=${encoded}`;

      const $ = await this.fetchHtml(url);

      const data: AnimeCard[] = [];

      $(".aa-cn ul li").each((_, el) => {
        const element = $(el);

        const url =
          element.find("a.lnk-blk").attr("href") || element.find("article a").attr("href") || "";

        const img = element.find(".post-thumbnail img");

        let poster = img.attr("data-src") || img.attr("data-lazy-src") || img.attr("src") || "";

        if (poster.startsWith("//")) poster = "https:" + poster;

        if (!url || !poster) return;

        const type = url.includes("/series/") ? "series" : "movie";

        let title = element.find(".entry-title").text().trim();

        if (!title) {
          title =
            img
              .attr("alt")
              ?.replace(/^Image\s+/i, "")
              .trim() || "";
        }

        const slug = url.split("/").filter(Boolean).pop() || "";

        data.push({ type, title, slug, poster, url });
      });

      let end = 1;
      $("nav.pagination a.page-link").each((_, el) => {
        const num = Number($(el).text());
        if (!isNaN(num)) end = Math.max(end, num);
      });

      const result = {
        query,
        pagination: { current: page, start: 1, end },
        data,
      };

      await Cache.set(key, JSON.stringify(result), 43200);

      return result;
    } catch (err) {
      Logger.error("AnimeSalt.search error:", err);

      return {
        query,
        pagination: { current: page, start: 1, end: 1 },
        data: [],
      };
    }
  }

  static async category(type: string, page = 1, filter?: string) {
    const key = `category:${type}:${filter || "all"}:page:${page}`;

    const cached = await Cache.get(key);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (err) {
        Logger.warn("Ignored error:", err);
      }
    }

    try {
      const url =
        ANIME_SALT_BASE +
        "/category/" +
        type +
        "/" +
        (page === 1 ? "" : `page/${page}/`) +
        (filter ? `?type=${filter}` : "");

      const $ = await this.fetchHtml(url);

      const data: AnimeCard[] = [];

      $(".aa-cn ul li").each((_, el) => {
        const element = $(el);

        const img = element.find(".post-thumbnail img");

        let title = element.find(".entry-title").text().trim();

        if (!title) {
          title =
            img
              .attr("alt")
              ?.replace(/^Image\s+/i, "")
              .trim() || "";
        }

        const url = element.find("a.lnk-blk").attr("href") || "";

        let poster = img.attr("data-src") || img.attr("data-lazy-src") || img.attr("src") || "";

        if (poster.startsWith("//")) poster = "https:" + poster;

        if (!url || !poster) return;

        const slug = url.split("/").filter(Boolean).pop() || "";

        data.push({
          type: url.includes("/series/") ? "series" : "movie",
          title,
          slug,
          poster,
          url,
        });
      });

      let end = 1;
      $("nav.pagination a.page-link").each((_, el) => {
        const num = Number($(el).text());
        if (!isNaN(num)) end = Math.max(end, num);
      });

      const result = {
        cgType: type.split("/").pop(),
        pagination: { current: page, start: 1, end },
        data,
      };

      await Cache.set(key, JSON.stringify(result), 604800);

      return result;
    } catch (err) {
      Logger.error("AnimeSalt.category error:", err);

      return {
        cgType: type.split("/").pop(),
        pagination: { current: page, start: 1, end: 1 },
        data: [],
      };
    }
  }

  static async movies(page = 1) {
    const key = `movies:${page}`;

    const cached = await Cache.get(key);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (err) {
        Logger.warn("Ignored error:", err);
      }
    }

    try {
      const url = ANIME_SALT_BASE + "/movies/" + (page === 1 ? "" : `page/${page}/`);

      const $ = await this.fetchHtml(url);

      const data: AnimeCard[] = [];

      $(".aa-cn ul li").each((_, el) => {
        const element = $(el);

        const img = element.find(".post-thumbnail img");

        let title = element.find(".entry-title").text().trim();

        if (!title) {
          title =
            img
              .attr("alt")
              ?.replace(/^Image\s+/i, "")
              .trim() || "";
        }

        const url = element.find("a.lnk-blk").attr("href") || "";

        let poster = img.attr("data-src") || img.attr("data-lazy-src") || img.attr("src") || "";

        if (poster.startsWith("//")) poster = "https:" + poster;

        if (!url || !poster) return;

        const slug = url.split("/").filter(Boolean).pop() || "";

        data.push({
          type: "movie",
          title,
          slug,
          poster,
          url,
        });
      });

      let end = 1;
      $("nav.pagination a.page-link").each((_, el) => {
        const num = Number($(el).text());
        if (!isNaN(num)) end = Math.max(end, num);
      });

      const result = {
        pagination: { current: page, start: 1, end },
        data,
      };

      await Cache.set(key, JSON.stringify(result), 2592000);

      return result;
    } catch (err) {
      Logger.error("AnimeSalt.movies error:", err);

      return {
        pagination: { current: page, start: 1, end: 1 },
        data: [],
      };
    }
  }

  static async movieInfo(slug: string) {
    try {
      const $ = await this.fetchHtml(`${ANIME_SALT_BASE}/movies/${slug}/`);

      const title = $("h1").first().text().trim();
      if (!title) {
        return {
          title: "",
          year: "",
          duration: "",
          poster: "",
          description: "",
          languages: [],
          genres: [],
          downloadLinks: [],
          embeds: [],
          sources: [],
          recommendations: [],
        };
      }

      const posterImg = $(".bd img").first();
      let poster =
        posterImg.attr("data-src") ||
        posterImg.attr("data-lazy-src") ||
        posterImg.attr("src") ||
        "";

      if (poster.startsWith("//")) poster = "https:" + poster;

      let year = "";
      let duration = "";

      $("div[style*='display: flex']").each((_, div) => {
        const text = $(div).text().trim();

        if (/\d+h\s*\d+m/.test(text)) duration = text;
        if (/^\d{4}$/.test(text)) year = text;
      });

      if (!year) year = $(".entry-meta .year").text().trim();
      if (!duration) duration = $(".entry-meta .duration").text().trim();

      const description =
        $("#overview-text p").first().text().trim() || $(".description p").first().text().trim();

      const genres: any[] = [];
      const languages: string[] = [];

      $("h4:contains('Genres')")
        .next("div")
        .find("a")
        .each((_, el) => {
          const name = $(el).text().trim();
          const url = $(el).attr("href");
          if (!url) return;

          genres.push({
            name,
            slug: url.split("/").pop(),
            url,
          });
        });

      $("h4:contains('Languages')")
        .next("div")
        .find("a")
        .each((_, el) => {
          const lang = $(el).text().trim();
          if (lang) languages.push(lang);
        });

      if (genres.length === 0) {
        $("span.genres a").each((_, el) => {
          const name = $(el).text().trim();
          const url = $(el).attr("href");
          if (!url) return;

          genres.push({
            name,
            slug: url.split("/").pop(),
            url,
          });
        });
      }

      const downloadLinks: any[] = [];

      $(".mdl-cn.anm-b table tbody tr").each((_, el) => {
        const row = $(el);

        const server = row.find("td").eq(0).text().trim();
        const language = row.find("td").eq(1).text().trim();
        const quality = row.find("td").eq(2).text().trim();

        let url = row.find("td a").attr("href") || "";
        url = url.split(/[\s"]/)[0];

        if (!url) return;

        downloadLinks.push({ server, language, quality, url });
      });

      let sources = { embeds: [], sources: [] };

      try {
        sources = await this.getSourcesFromPage($);
      } catch (err) {
        Logger.error("Source extraction failed:", err);
      }

      const recommendations: AnimeCard[] = [];
      const seen = new Set();

      $("section.section.episodes article").each((_, el) => {
        const url = $(el).find("a.lnk-blk").attr("href") || "";
        if (!url) return;

        const slug = url.split("/").pop() || "";
        if (seen.has(slug)) return;
        seen.add(slug);

        const img = $(el).find("img");

        let poster = img.attr("data-src") || img.attr("data-lazy-src") || img.attr("src") || "";

        if (poster.startsWith("//")) poster = "https:" + poster;

        const title =
          img
            .attr("alt")
            ?.replace(/^Image\s+/i, "")
            .trim() || slug;

        recommendations.push({
          type: url.includes("/series/") ? "series" : "movie",
          title,
          slug,
          poster,
          url,
        });
      });

      return {
        title,
        year,
        duration,
        poster,
        description,
        languages,
        genres,
        downloadLinks,
        ...sources,
        recommendations,
      };
    } catch (err) {
      Logger.error("AnimeSalt.movieInfo error:", err);

      return {
        title: "",
        year: "",
        duration: "",
        poster: "",
        description: "",
        languages: [],
        genres: [],
        downloadLinks: [],
        embeds: [],
        sources: [],
        recommendations: [],
      };
    }
  }

  static async seriesInfo(slug: string) {
    try {
      const $ = await this.fetchHtml(`${ANIME_SALT_BASE}/series/${slug}/`);

      const title = $("h1").first().text().trim();
      if (!title) throw new Error("No title");

      const posterImg = $(".bd img").first();
      let poster =
        posterImg.attr("data-src") ||
        posterImg.attr("data-lazy-src") ||
        posterImg.attr("src") ||
        "";

      if (poster.startsWith("//")) poster = "https:" + poster;

      let year = "";
      let runtime = "";
      let totalSeasons = 0;
      let totalEpisodes = 0;

      $("div[style*='display: flex']").each((_, div) => {
        const text = $(div).text().trim();

        if (/\d+h\s*\d+m|\d+m|\d+ min/i.test(text)) runtime = text;
        if (/^\d{4}$/.test(text)) year = text;
        if (text.includes("Seasons"))
          totalSeasons = Number(text.replace("Seasons", "").trim()) || 0;
        if (text.includes("Episodes"))
          totalEpisodes = Number(text.replace("Episodes", "").trim()) || 0;
      });

      if (!year) year = $(".entry-meta .year").text().trim();

      const description =
        $("#overview-text p").first().text().trim() || $(".description p").first().text().trim();
      const genres: any[] = [];
      const tags: any[] = [];
      const casts: any[] = [];
      const languages: string[] = [];

      $("h4:contains('Genres')")
        .next("div")
        .find("a")
        .each((_, el) => {
          const name = $(el).text().trim();
          const url = $(el).attr("href");
          if (!url) return;

          genres.push({
            name,
            slug: url.split("/").pop(),
            url,
          });
        });

      $("h4:contains('Languages')")
        .next("div")
        .find("a")
        .each((_, el) => {
          const lang = $(el).text().trim();
          if (lang) languages.push(lang);
        });

      $("span.tag a").each((_, el) => {
        const name = $(el).text().trim();
        const url = $(el).attr("href");
        if (url) tags.push({ name, url });
      });

      $(".cast-lst a").each((_, el) => {
        const name = $(el).text().trim();
        const url = $(el).attr("href");
        if (url) casts.push({ name, url });
      });

      const bodyClass = $("body").attr("class") || "";
      const postId = bodyClass.match(/postid-(\d+)/)?.[1];

      let seasons: Season[] = [];

      if (postId) {
        try {
          seasons = await this.getSeasons(postId, totalSeasons || 1);
        } catch (err) {
          Logger.error("Season fetch failed:", err);
        }
      }

      const recommendations: AnimeCard[] = [];
      const seen = new Set();

      $("section.section.episodes article").each((_, el) => {
        const url = $(el).find("a.lnk-blk").attr("href") || "";
        if (!url) return;

        const slug = url.split("/").pop() || "";
        if (seen.has(slug)) return;
        seen.add(slug);

        const img = $(el).find("img");

        let poster = img.attr("data-src") || img.attr("data-lazy-src") || img.attr("src") || "";

        if (poster.startsWith("//")) poster = "https:" + poster;

        const title =
          img
            .attr("alt")
            ?.replace(/^Image\s+/i, "")
            .trim() || slug;

        recommendations.push({
          type: url.includes("/series/") ? "series" : "movie",
          title,
          slug,
          poster,
          url,
        });
      });

      return {
        title,
        year,
        runtime,
        totalSeasons,
        totalEpisodes,
        description,
        languages,
        genres,
        tags,
        casts,
        poster,
        seasons,
        recommendations,
      };
    } catch (err) {
      Logger.error("AnimeSalt.seriesInfo error:", err);

      return {
        title: "",
        year: "",
        runtime: "",
        totalSeasons: 0,
        totalEpisodes: 0,
        description: "",
        languages: [],
        genres: [],
        tags: [],
        casts: [],
        poster: "",
        seasons: [],
        recommendations: [],
      };
    }
  }

  static async *streams(slug: string) {
    try {
      const $ = await this.fetchHtml(`${ANIME_SALT_BASE}/episode/${slug}/`);

      const iframeUrls = $("aside#aa-options iframe")
        .map((_, el) => $(el).attr("data-src") || $(el).attr("src"))
        .get()
        .filter(Boolean);

      const players = await this.extractPlayers(iframeUrls);

      for (const player of players) {
        try {
          const key = `source:${player}`;
          let source: DirectSource | null = null;

          const cached = await Cache.get(key);

          if (cached) {
            try {
              source = JSON.parse(cached);
            } catch (err) {
              Logger.warn("Cache parse failed:", err);
              source = null;
            }
          } else {
            source = await this.resolveSource(player);

            if (source) {
              let ttl = 3600;

              if (player.startsWith(embedPlayerOrigins.asCdnOrigin)) {
                ttl = ASCDN_SOURCE_TTL;
              } else if (player.startsWith(embedPlayerOrigins.rubyStreamOrigin)) {
                ttl = RUBYSTREAM_SOURCE_TTL;
              }

              await Cache.set(key, JSON.stringify(source), ttl);
            }
          }

          if (!source) continue;

          yield {
            id: player,
            title: "Auto",
            url: player,
            directUrl: source.url,
            quality: source.label || "auto",
            type: source.type || "hls",
          };
        } catch (err) {
          Logger.error("Stream extraction error:", err);
        }
      }
    } catch (err) {
      Logger.error("Streams error:", err);
    }
  }

  private static async getSeasons(postId: string, total: number) {
    const seasons: Season[] = [];

    for (let i = 1; i <= total; i++) {
      const episodes: Episode[] = [];

      const res = await fetch(`${ANIME_SALT_BASE}/wp-admin/admin-ajax.php`, {
        method: "POST",
        headers: {
          accept: "*/*",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          "x-requested-with": "XMLHttpRequest",
        },
        body: `action=action_select_season&season=${i}&post=${postId}`,
      });

      const html = await res.text();
      const $ = cheerio.load(html);

      $("li").each((j, el) => {
        const url = $(el).find("a").attr("href");
        const img = $(el).find("img");

        const thumbnail = img.attr("data-src") || img.attr("src") || "";

        if (!url || !thumbnail) return;

        const slug = url.split("/").pop() || "";

        let title = $(el).find(".entry-title").text().trim();

        if (!title) {
          title = img.attr("alt")?.replace(/^Image\s+/i, "") || "";
        }

        const epXseason = $(el).find(".num-epi").text().trim();

        episodes.push({
          episode_no: j + 1,
          slug,
          title,
          url,
          epXseason,
          thumbnail,
        });
      });

      if (!episodes.length) break;

      seasons.push({
        label: `Season ${i}`,
        season_no: i,
        episodes,
      });
    }

    return seasons;
  }

  private static async extractPlayers(urls: string[]) {
    const results: string[] = [];

    const directOrigins = Object.values(embedPlayerOrigins);

    for (let url of urls) {
      if (!url) continue;

      if (url.startsWith("//")) url = "https:" + url;

      if (directOrigins.some((origin) => url.startsWith(origin))) {
        results.push(url);
        continue;
      }

      try {
        const $ = await this.fetchHtml(url);

        let iframe = $(".Video iframe").attr("src") || $("iframe").first().attr("src");
        if (!iframe) continue;
        if (iframe.startsWith("//")) iframe = "https:" + iframe;
        results.push(iframe);
      } catch (err) {
        Logger.warn("Ignored error:", err);
      }
    }

    return results;
  }

  private static async getSourcesFromPage($: cheerio.CheerioAPI) {
    const iframeUrls = $("aside#aa-options iframe")
      .map((_, el) => $(el).attr("data-src") || $(el).attr("src"))
      .get()
      .filter(Boolean);

    const players = await this.extractPlayers(iframeUrls);

    const sources: DirectSource[] = [];

    for (const url of players) {
      try {
        const key = `source:${url}`;
        const cached = await Cache.get(key);

        if (cached) {
          try {
            sources.push(JSON.parse(cached));
            continue;
          } catch (err) {
            Logger.warn("Ignored error:", err);
          }
        }

        const src = await this.resolveSource(url);
        if (!src) continue;

        let ttl = 3600;

        if (url.startsWith(embedPlayerOrigins.asCdnOrigin)) {
          ttl = ASCDN_SOURCE_TTL;
        } else if (url.startsWith(embedPlayerOrigins.rubyStreamOrigin)) {
          ttl = RUBYSTREAM_SOURCE_TTL;
        }

        await Cache.set(key, JSON.stringify(src), ttl);

        sources.push(src);
      } catch (err) {
        Logger.error("Source extraction error:", err);
      }
    }

    return {
      embeds: players,
      sources,
    };
  }
}
