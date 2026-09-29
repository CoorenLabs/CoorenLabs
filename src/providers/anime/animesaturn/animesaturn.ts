import * as cheerio from "cheerio";
import { Logger } from "../../../core/logger";
import { animesaturn as animesaturnOrigin } from "../../origins";
import type { AnimeSaturnEpisode, AnimeSaturnInfo, AnimeSaturnSearchItem } from "./types";

export class AnimeSaturn {
  private static baseUrl = animesaturnOrigin;

  private static headers(): Record<string, string> {
    return {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      Connection: "keep-alive",
      Referer: `${this.baseUrl}/`,
    };
  }

  static async search(
    query: string,
    page: number = 1,
  ): Promise<{ results: AnimeSaturnSearchItem[] }> {
    try {
      const url = `${this.baseUrl}/animelist?search=${encodeURIComponent(query)}&page=${page}`;
      const res = await fetch(url, { headers: this.headers() });
      const html = await res.text();
      const $ = cheerio.load(html);
      const results: AnimeSaturnSearchItem[] = [];

      $(".item-archivio").each((_, element) => {
        const card = $(element);
        const aTag = card.find("a.badge-archivio");
        if (aTag.length === 0) return;

        const href = aTag.attr("href") || "";
        const id = href.split("/").pop() || "";
        const title = aTag.text().trim();
        const image = card.find("img").attr("src") || "";

        results.push({
          id,
          title,
          url: href,
          image,
        });
      });

      return { results };
    } catch (err) {
      Logger.error(`AnimeSaturn search error: ${String(err)}`);
      return { results: [] };
    }
  }

  static async info(id: string): Promise<AnimeSaturnInfo | null> {
    try {
      const url = `${this.baseUrl}/anime/${id}`;
      const res = await fetch(url, { headers: this.headers() });
      const html = await res.text();
      const $ = cheerio.load(html);

      const title = $("title").text().split("Streaming")[0].replace("AnimeSaturn - ", "").trim();
      const image =
        $("img.img-fluid").attr("src") || $('meta[property="og:image"]').attr("content") || "";
      const description =
        $("#full-trama").text().trim() ||
        $("#shown-trama").text().trim() ||
        $(".card-body").first().text().trim();

      const genres: string[] = [];
      $(".generi-as").each((_, el) => {
        const text = $(el).text().trim();
        if (text) genres.push(text);
      });

      const status =
        $("b")
          .filter((_, el) => $(el).text().includes("Stato:"))
          .parent()
          .text()
          .split("Stato:")[1]
          ?.split("\n")[0]
          ?.trim() || "";

      const episodes: AnimeSaturnEpisode[] = [];
      $(".bottone-ep").each((_, element) => {
        const a = $(element);
        const href = a.attr("href") || "";
        const epId = href.split("/").pop() || "";
        const number = parseFloat(a.text().replace("Episodio", "").trim()) || 0;

        episodes.push({
          id: `${id}/${epId}`,
          number,
          url: href,
        });
      });

      return {
        id,
        title,
        url,
        image,
        description,
        genres,
        status,
        totalEpisodes: episodes.length,
        episodes,
      };
    } catch (err) {
      Logger.error(`AnimeSaturn info error: ${String(err)}`);
      return null;
    }
  }

  static async streams(
    episodeId: string,
  ): Promise<{ results: { streams: any[]; downloads?: any[] } }> {
    try {
      const actualEpId = episodeId.split("/").pop() || episodeId;
      const url = `${this.baseUrl}/ep/${actualEpId}`;
      const res = await fetch(url, { headers: this.headers() });
      const html = await res.text();
      const $ = cheerio.load(html);

      const watchUrl = $('a:contains("Guarda lo streaming")').attr("href");
      if (!watchUrl) return { results: { streams: [] } };

      const watchRes = await fetch(watchUrl, { headers: this.headers() });
      const watchHtml = await watchRes.text();
      const $watch = cheerio.load(watchHtml);

      const streams: any[] = [];
      const downloads: any[] = [];

      // Look for sources in scripts or video tags
      const scripts = $watch("script").toArray();
      for (const script of scripts) {
        const content = $(script).html() || "";

        const m3u8Match = content.match(/file:\s*["'](https?:\/\/.+?\.m3u8.*?)["']/);
        if (m3u8Match) {
          streams.push({
            url: m3u8Match[1],
            quality: "auto",
            isM3U8: true,
          });
        }

        const mp4Match = content.match(/file:\s*["'](https?:\/\/.+?\.mp4.*?)["']/);
        if (mp4Match) {
          streams.push({
            url: mp4Match[1],
            quality: "auto",
            isM3U8: false,
          });
        }
      }

      // Check for external servers too
      $watch(".btn-server").each((_, el) => {
        streams.push({
          name: $(el).text().trim(),
          url: $(el).attr("href"),
        });
      });

      const response: any = {
        streams,
      };

      if (downloads.length > 0) {
        response.downloads = downloads;
      }

      return {
        results: response,
      };
    } catch (err) {
      Logger.error(`AnimeSaturn streams error: ${String(err)}`);
      return { results: { streams: [] } };
    }
  }
}
