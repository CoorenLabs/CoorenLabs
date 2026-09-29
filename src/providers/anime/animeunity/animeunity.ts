import * as cheerio from "cheerio";
import { fetcher } from "../../../core/lib/fetcher";
import { animeunity as BASE_URL } from "../../origins";
import type {
  AnimeUnityEpisode,
  AnimeUnityInfo,
  AnimeUnityRecord,
  AnimeUnitySearchItem,
  AnimeUnityStreams,
} from "./types";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const HEADERS = { Referer: `${BASE_URL}/`, "User-Agent": USER_AGENT };
const API_HEADERS = { ...HEADERS, "X-Requested-With": "XMLHttpRequest" };
const EPISODE_RANGE = 120;

const titleOf = (item: AnimeUnityRecord) => item.title || item.title_eng || item.title_it || "";

const animeUrl = (id: number | string, slug?: string) =>
  `${BASE_URL}/anime/${id}${slug ? `-${slug}` : ""}`;

export class AnimeUnityUnavailable extends Error {}

export class AnimeUnity {
  private static async load(
    url: string,
    headers: Record<string, string> = HEADERS,
    label = "animeunity",
  ): Promise<string | null> {
    const res = await fetcher(url, true, label, { headers });
    if (res?.success) return res.text;
    if (res?.status === 404) return null;
    throw new AnimeUnityUnavailable(
      `${new URL(url).host} responded ${res?.status ?? "with no response"}`,
    );
  }

  private static async api<T>(path: string): Promise<T | null> {
    const text = await this.load(`${BASE_URL}${path}`, API_HEADERS);
    if (text === null) return null;
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new AnimeUnityUnavailable("AnimeUnity returned an invalid response");
    }
  }

  static async search(query: string): Promise<AnimeUnitySearchItem[]> {
    const html = await this.load(`${BASE_URL}/archivio?title=${encodeURIComponent(query)}`);
    const records = html && cheerio.load(html)("archivio").attr("records");
    if (!records) return [];
    return (JSON.parse(records) as AnimeUnityRecord[]).map((item) => ({
      id: item.id,
      title: titleOf(item),
      url: animeUrl(item.id, item.slug),
      image: item.imageurl ?? "",
      type: item.type,
      score: item.score,
    }));
  }

  static async info(id: string): Promise<AnimeUnityInfo | null> {
    const data = await this.api<AnimeUnityRecord>(`/info_api/${id}`);
    if (!data || typeof data.episodes_count !== "number") return null;

    const url = animeUrl(id, data.slug);
    const starts = Array.from(
      { length: Math.floor(data.episodes_count / EPISODE_RANGE) + 1 },
      (_, i) => i * EPISODE_RANGE,
    );
    const pages = await Promise.all(
      starts.map((start) =>
        this.api<{ episodes?: { id: number; number: string }[] }>(
          `/info_api/${id}/1?start_range=${start}&end_range=${start + EPISODE_RANGE - 1}`,
        ),
      ),
    );

    const seen = new Set<number>();
    const episodes: AnimeUnityEpisode[] = pages
      .flatMap((page) => page?.episodes ?? [])
      .filter((ep) => !seen.has(ep.id) && seen.add(ep.id))
      .map((ep) => ({
        id: `${id}/${ep.id}`,
        number: parseFloat(ep.number),
        url: `${url}/${ep.id}`,
      }));

    return {
      id: Number(id),
      title: titleOf(data),
      url,
      image: data.imageurl,
      description: data.plot,
      genres: data.genres?.map((genre) => (typeof genre === "string" ? genre : genre.name)),
      status: data.status,
      totalEpisodes: data.episodes_count,
      episodes,
    };
  }

  static async streams(episodeId: string): Promise<AnimeUnityStreams | null> {
    const embed = (await this.load(`${BASE_URL}/embed-url/${episodeId}`))?.trim();
    if (!embed) return null;
    const embedUrl = new URL(embed, BASE_URL).href;

    const player = await this.load(embedUrl, HEADERS, "vixcloud");
    if (!player) return null;

    const playlist = player.match(/url:\s*'([^']+)'/)?.[1];
    const token = player.match(/'token':\s*'([^']+)'/)?.[1];
    const expires = player.match(/'expires':\s*'([^']+)'/)?.[1];
    const download = player.match(/window\.downloadUrl\s*=\s*'([^']+)'/)?.[1];
    const fhd = /window\.canPlayFHD\s*=\s*true/.test(player);

    const streams =
      playlist && token && expires
        ? [
            {
              url: `${playlist}${playlist.includes("?") ? "&" : "?"}token=${token}&expires=${expires}${fhd ? "&h=1" : ""}`,
              quality: "auto",
              isM3U8: true,
            },
          ]
        : [];
    if (!download) return { streams };
    return {
      streams,
      downloads: [{ url: download, quality: download.match(/(\d{3,4}p)\.mp4/)?.[1] ?? "unknown" }],
    };
  }
}
