import * as cheerio from "cheerio";
import { Logger } from "../../../core/logger";
import { animeunity as animeunityOrigin } from "../../origins";
import type { AnimeUnityEpisode, AnimeUnityInfo, AnimeUnitySearchItem } from "./types";

export class AnimeUnity {
  private static baseUrl = animeunityOrigin;

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

  static async search(query: string): Promise<{ results: AnimeUnitySearchItem[] }> {
    try {
      const url = `${this.baseUrl}/archivio?title=${encodeURIComponent(query)}`;
      const res = await fetch(url, { headers: this.headers() });
      const html = await res.text();
      const $ = cheerio.load(html);

      const recordsAttr = $("archivio").attr("records");
      if (!recordsAttr) return { results: [] };

      const records = JSON.parse(recordsAttr);
      const results: AnimeUnitySearchItem[] = records.map((item: any) => ({
        id: item.id,
        title: item.title,
        url: `${this.baseUrl}/anime/${item.id}-${item.slug}`,
        image: item.imageurl,
        type: item.type,
        score: item.score,
      }));

      return { results };
    } catch (err) {
      Logger.error(`AnimeUnity search error: ${String(err)}`);
      return { results: [] };
    }
  }

  static async info(id: string): Promise<AnimeUnityInfo | null> {
    try {
      const infoUrl = `${this.baseUrl}/info_api/${id}`;
      const res = await fetch(infoUrl, { headers: this.headers() });
      const data = await res.json();

      if (!data || !data.id) return null;

      const epUrl = `${this.baseUrl}/info_api/${id}/1?start_range=0&end_range=119`;
      const epRes = await fetch(epUrl, { headers: this.headers() });
      const epData = await epRes.json();

      const episodes: AnimeUnityEpisode[] = (epData.episodes || []).map((ep: any) => ({
        id: `${id}/${ep.id}`,
        number: parseFloat(ep.number),
        url: `${this.baseUrl}/anime/${id}-${data.slug}/${ep.id}`,
      }));

      return {
        id: data.id,
        title: data.title,
        url: `${this.baseUrl}/anime/${id}-${data.slug}`,
        image: data.imageurl,
        description: data.plot,
        genres: data.genres,
        status: data.status,
        totalEpisodes: data.episodes_count,
        episodes,
      };
    } catch (err) {
      Logger.error(`AnimeUnity info error: ${String(err)}`);
      return null;
    }
  }

  static async streams(episodeId: string): Promise<any> {
    try {
      // episodeId format: "animeId/epId"
      const [animeId, epId] = episodeId.split("/");

      const infoUrl = `${this.baseUrl}/info_api/${animeId}`;
      const infoRes = await fetch(infoUrl, { headers: this.headers() });
      const infoData = await infoRes.json();

      const url = `${this.baseUrl}/anime/${animeId}-${infoData.slug}/${epId}`;

      const res = await fetch(url, { headers: this.headers() });
      const html = await res.text();
      const $ = cheerio.load(html);

      let embedUrl = $("video-player").attr("embed_url");
      if (!embedUrl) return [];

      if (embedUrl.startsWith("//")) embedUrl = "https:" + embedUrl;
      embedUrl = embedUrl.replace(/&amp;/g, "&");

      const playerRes = await fetch(embedUrl, { headers: { ...this.headers(), Referer: url } });
      const playerHtml = await playerRes.text();

      const streams: any[] = [];
      const downloads: any[] = [];
      const domainMatch = playerHtml.match(/url: '(.*)'/);
      const tokenMatch = playerHtml.match(/token': '(.*)'/);
      const expiresMatch = playerHtml.match(/expires': '(.*)'/);
      const downloadMatch = playerHtml.match(/window\.downloadUrl\s*=\s*['"](.*?)['"]/);

      if (domainMatch && tokenMatch && expiresMatch) {
        const domain = domainMatch[1];
        const token = tokenMatch[1];
        const expires = expiresMatch[1];
        const streamUrl = `${domain}${domain.includes("?") ? "&" : "?"}token=${token}&referer=&expires=${expires}&h=1`;

        streams.push({
          url: streamUrl,
          quality: "auto",
          isM3U8: true,
        });
      }

      if (downloadMatch) {
        downloads.push({
          url: downloadMatch[1],
          quality: "1080p",
        });
      }

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
      Logger.error(`AnimeUnity streams error: ${String(err)}`);
      return { results: { streams: [] } };
    }
  }
}
