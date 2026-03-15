import axios from "axios";
import * as cheerio from "cheerio";
import { VidCloud } from "./extractor";
import * as parser from "./parser";
import { flixhq } from "../../origins";
import { HIMovieGenres, HIMovieCountryCode, HIMoviesGenreID, HIMoviesCountryID } from "../himovies/mappings";

export class FlixHQ {
  private static baseUrl = flixhq;
  private static extractor = new VidCloud();

  private static createSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private static getMappedValue(key: string, mapping: Record<string, string>): string {
    const normalizedKey = key.toLowerCase().replace(/[^a-z]/g, "");
    return mapping[normalizedKey] || key;
  }

  private static buildAjaxUrl(id: string, kind: string): string {
    switch (kind) {
      case "movie-server":
        return `${this.baseUrl}/ajax/episode/list/${id}`;
      case "tv-server":
        return `${this.baseUrl}/ajax/episode/servers/${id}`;
      case "tv":
        return `${this.baseUrl}/ajax/season/episodes/${id}`;
      case "season":
        return `${this.baseUrl}/ajax/season/list/${id}`;
      default:
        return "";
    }
  }

  static async fetchHome() {
    try {
      const response = await axios.get(`${this.baseUrl}/home`);
      return parser.parseHome(cheerio.load(response.data));
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async search(query: string, page: number = 1) {
    if (!query) return { error: "Query is required" };
    try {
      const response = await axios.get(`${this.baseUrl}/search/${this.createSlug(query)}`, {
        params: { page },
      });
      return parser.parsePaginatedResults(cheerio.load(response.data), "div.block_area-content.block_area-list.film_list.film_list-grid div.flw-item");
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async advancedSearch(type = "all", quality = "all", genre = "all", country = "all", year = "all", page = 1) {
    const genreId = this.getMappedValue(genre, HIMoviesGenreID);
    const countryId = this.getMappedValue(country, HIMoviesCountryID);
    const url = `${this.baseUrl}/filter?type=${type}&quality=${quality}&release_year=${year}&genre=${genreId}&country=${countryId}&page=${page}`;
    try {
      const response = await axios.get(url);
      return parser.parsePaginatedResults(cheerio.load(response.data), "div.block_area-content.block_area-list.film_list.film_list-grid div.flw-item");
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async searchSuggestions(query: string) {
    if (!query) return { error: "Query is required" };
    const params = new URLSearchParams();
    params.append("keyword", query);
    try {
      const response = await axios.post(`${this.baseUrl}/ajax/search`, params.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          Referer: `${this.baseUrl}/home`,
          Origin: this.baseUrl,
        },
      });
      return parser.parseSearchSuggestions(cheerio.load(response.data));
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async fetchPopularMovies(page = 1) {
    try {
      const response = await axios.get(`${this.baseUrl}/movie?page=${page}`);
      return parser.parsePaginatedResults(cheerio.load(response.data), "div.block_area-content.block_area-list.film_list.film_list-grid div.flw-item");
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async fetchPopularTv(page = 1) {
    try {
      const response = await axios.get(`${this.baseUrl}/tv-show?page=${page}`);
      return parser.parsePaginatedResults(cheerio.load(response.data), "div.block_area-content.block_area-list.film_list.film_list-grid div.flw-item");
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async fetchTopMovies(page = 1) {
    try {
      const response = await axios.get(`${this.baseUrl}/top-imdb?type=movie&page=${page}`);
      return parser.parsePaginatedResults(cheerio.load(response.data), "div.block_area-content.block_area-list.film_list.film_list-grid div.flw-item");
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async fetchTopTv(page = 1) {
    try {
      const response = await axios.get(`${this.baseUrl}/top-imdb?type=tv&page=${page}`);
      return parser.parsePaginatedResults(cheerio.load(response.data), "div.block_area-content.block_area-list.film_list.film_list-grid div.flw-item");
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async fetchUpcoming(page = 1) {
    try {
      const response = await axios.get(`${this.baseUrl}/coming-soon?page=${page}`);
      return parser.parsePaginatedResults(cheerio.load(response.data), "div.block_area-content.block_area-list.film_list.film_list-grid div.flw-item");
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async fetchGenre(genre: string, page = 1) {
    const value = this.getMappedValue(genre, HIMovieGenres);
    try {
      const response = await axios.get(`${this.baseUrl}/genre/${value}?page=${page}`);
      return parser.parsePaginatedResults(cheerio.load(response.data), "div.block_area-content.block_area-list.film_list.film_list-grid div.flw-item");
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async fetchByCountry(country: string, page = 1) {
    const value = this.getMappedValue(country, HIMovieCountryCode);
    try {
      const response = await axios.get(`${this.baseUrl}/country/${value}?page=${page}`);
      return parser.parsePaginatedResults(cheerio.load(response.data), "div.block_area-content.block_area-list.film_list.film_list-grid div.flw-item");
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async fetchMediaInfo(mediaId: string) {
    if (!mediaId) return { error: "mediaId is required" };
    try {
      const mediaPath = mediaId.replace("-", "/");
      const response = await axios.get(`${this.baseUrl}/${mediaPath}`);
      const { data, recommended } = parser.parseInfo(cheerio.load(response.data));
      
      let episodes: any[] = [];
      const internalId = mediaPath.split("-").at(-1);

      if (data.type === "TV") {
        const seasonsRes = await axios.get(this.buildAjaxUrl(internalId!, "season"), {
          headers: { "X-Requested-With": "XMLHttpRequest", Referer: `${this.baseUrl}/${mediaPath}` },
        });
        const seasons = parser.parseSeasons(cheerio.load(seasonsRes.data));
        for (const { seasonId, seasonNumber } of seasons) {
          const epRes = await axios.get(this.buildAjaxUrl(seasonId!, "tv"), {
            headers: { "X-Requested-With": "XMLHttpRequest", Referer: `${this.baseUrl}/${mediaPath}` },
          });
          const epList = parser.parseEpisodes(cheerio.load(epRes.data), seasonNumber, mediaId);
          episodes.push(...epList);
        }
      } else {
        episodes = [{
          episodeId: data.id?.replace("watch-", "") || mediaId.replace("watch-", ""),
          title: data.name,
          episodeNumber: 1,
          seasonNumber: 0,
        }];
      }
      return { data, providerEpisodes: episodes, recommended };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async fetchServers(episodeId: string) {
    if (!episodeId) return { error: "episodeId is required" };
    try {
      let servers: any[] = [];
      if (episodeId.includes("movie")) {
        const id = episodeId.split("-").at(-1);
        const res = await axios.get(this.buildAjaxUrl(id!, "movie-server"), {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            Referer: `${this.baseUrl}/watch-${episodeId.replace("-", "/")}`,
          },
        });
        servers = parser.parseServers(cheerio.load(res.data));
      } else {
        const parts = episodeId.split("-episode-");
        const id = parts.at(1);
        const res = await axios.get(this.buildAjaxUrl(id!, "tv-server"), {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            Referer: `${this.baseUrl}/watch-${parts.at(0)?.replace("-", "/")}`,
          },
        });
        servers = parser.parseServers(cheerio.load(res.data));
      }
      return { data: servers.filter((s) => ["upcloud", "megacloud"].includes(s.serverName)) };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async fetchSources(episodeId: string, server = "megacloud") {
    if (episodeId.startsWith("http")) {
      const serverUrl = new URL(episodeId);
      return {
        headers: { Referer: `${serverUrl.origin}/` },
        data: await this.extractor.extract(serverUrl, `${this.baseUrl}/`),
      };
    }
    try {
      const serversRes = await this.fetchServers(episodeId);
      if (serversRes.error) throw new Error(serversRes.error);

      const servers = serversRes.data as any[];
      const priorityOrder = [server, "megacloud", "upcloud"];
      let selectedServer = null;
      for (const name of priorityOrder) {
        selectedServer = servers.find((s) => s.serverName === name);
        if (selectedServer) break;
      }
      if (!selectedServer) throw new Error("No supported server found");

      let refererPath = "";
      if (episodeId.includes("movie")) {
        refererPath = `${this.baseUrl}/${episodeId.replace("-", "/")}`;
      } else {
        refererPath = `${this.baseUrl}/${episodeId.split("-episode-").at(0)?.replace("-", "/")}`;
      }

      const embedRes = await axios.get(`${this.baseUrl}/ajax/episode/sources/${selectedServer.serverId}`, {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          Referer: `${refererPath}.${selectedServer.serverId}`,
        },
      });
      if (!embedRes.data?.link) throw new Error("Failed to get embed link");

      return await this.fetchSources(embedRes.data.link, server);
    } catch (error: any) {
      return { error: error.message };
    }
  }
}
