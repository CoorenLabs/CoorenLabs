import * as cheerio from "cheerio";
import { fetcher } from "../../../core/lib/fetcher";
import { Logger } from "../../../core/logger";
import { proxyUrl } from "../../../core/proxy";
import { animesaturn as BASE_URL } from "../../origins";
import type {
  AnimeSaturnEpisode,
  AnimeSaturnInfo,
  AnimeSaturnSearchItem,
  AnimeSaturnServer,
  AnimeSaturnSource,
  AnimeSaturnStreams,
} from "./types";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const HEADERS = { Referer: `${BASE_URL}/`, "User-Agent": USER_AGENT };

const absolute = (href: string) => new URL(href, BASE_URL).href;

function decode(data: string, key: string) {
  const raw = atob(data);
  let out = "";
  for (let i = 0; i < raw.length; i++) {
    out += String.fromCharCode(raw.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return out;
}

export class AnimeSaturnUnavailable extends Error {}

export class AnimeSaturn {
  private static async load(url: string): Promise<string | null> {
    const res = await fetcher(url, true, "animesaturn", { headers: HEADERS });
    if (res?.success) return res.text;
    if (res?.status === 404) return null;
    throw new AnimeSaturnUnavailable(`AnimeSaturn responded ${res?.status ?? "with no response"}`);
  }

  static async search(query: string, page = 1): Promise<AnimeSaturnSearchItem[]> {
    const path = page > 1 ? `/filter/${page}` : "/filter";
    const html = await this.load(`${BASE_URL}${path}?key=${encodeURIComponent(query)}`);
    if (!html) return [];
    const $ = cheerio.load(html);
    return $("a.ac")
      .toArray()
      .map((el) => {
        const card = $(el);
        const href = card.attr("href") ?? "";
        return {
          id: href.replace(/^\/anime\//, ""),
          title: card.find(".ac__title").text().trim() || (card.find("img").attr("alt") ?? ""),
          url: absolute(href),
          image: card.find("img").attr("src") ?? "",
          type: card.find(".ac__type-badge").text().trim() || undefined,
        };
      })
      .filter((item) => item.id && item.title);
  }

  static async info(id: string): Promise<AnimeSaturnInfo | null> {
    const url = `${BASE_URL}/anime/${id}`;
    const html = await this.load(url);
    if (!html) return null;
    const $ = cheerio.load(html);
    const title = $(".ag-head h1").first().text().trim();
    if (!title) return null;

    const meta = (label: string) =>
      $(".ag-meta span")
        .filter((_, el) => $(el).text().trim() === label)
        .first()
        .next()
        .text()
        .trim();

    const episodes: AnimeSaturnEpisode[] = $("a.ep-tile")
      .toArray()
      .map((el) => {
        const href = $(el).attr("href") ?? "";
        return {
          id: href.replace(/^\/episode\//, ""),
          number: parseFloat($(el).text().trim()) || 0,
          url: absolute(href),
        };
      })
      .filter((ep) => ep.id);

    return {
      id,
      title,
      url,
      image: $(".ag-poster img").attr("src") ?? $('meta[property="og:image"]').attr("content"),
      description:
        $(".ag-story div").first().text().trim() ||
        $('meta[name="description"]').attr("content")?.trim(),
      genres: $(".ag-genres .chip")
        .toArray()
        .map((el) => $(el).text().trim()),
      type: meta("Tipo") || undefined,
      status: meta("Stato") || undefined,
      totalEpisodes: episodes.length,
      episodes,
    };
  }

  static async streams(episodeId: string): Promise<AnimeSaturnStreams | null> {
    const html = await this.load(`${BASE_URL}/anime/${episodeId}`);
    if (!html) return null;
    const data = cheerio.load(html)("[x-data^='watchPage(']").attr("x-data");
    if (!data) return null;

    const { servers = [] } = JSON.parse(data.slice("watchPage(".length, -1)) as {
      servers?: AnimeSaturnServer[];
    };
    const streams = await Promise.all(
      servers.filter((server) => server.link).map((server) => this.source(server)),
    );
    const downloads = servers
      .filter((server) => server.download && server.downloadUrl)
      .map((server) => ({ server: server.name, url: server.downloadUrl as string }));
    return downloads.length ? { streams, downloads } : { streams };
  }

  private static async source(server: AnimeSaturnServer): Promise<AnimeSaturnSource> {
    const link = server.link as string;
    const fallback = { server: server.name, url: link, embed: server.embed };
    const embed = new URL(link, BASE_URL);
    const id = embed.pathname.match(/^\/embed\/(\d+)$/)?.[1];
    const token = embed.searchParams.get("token");
    if (!server.embed || !id || !token) return fallback;

    const playlist = `${embed.origin}/embed/${id}/playlist?token=${encodeURIComponent(token)}&expires=${embed.searchParams.get("expires") ?? ""}`;
    try {
      const res = await fetcher(playlist, false, "animesaturn", {
        headers: { Referer: embed.href, "User-Agent": USER_AGENT },
      });
      const src = res?.success ? decode(JSON.parse(res.text).d ?? "", token) : "";
      if (!/^https?:\/\//.test(src)) return fallback;
      return {
        server: server.name,
        url: src,
        embed: false,
        isM3U8: /\.m3u8(?:[?#]|$)/i.test(src),
        embedUrl: embed.href,
        proxiedUrl: proxyUrl(src, { Referer: `${embed.origin}/` }),
      };
    } catch (err) {
      Logger.warn(`[animesaturn] playlist failed for ${embed.href}: ${String(err)}`);
      return fallback;
    }
  }
}
