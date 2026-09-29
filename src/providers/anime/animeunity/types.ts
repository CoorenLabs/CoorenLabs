export interface AnimeUnitySearchItem {
  id: number;
  title: string;
  url: string;
  image: string;
  type?: string;
  score?: string;
}

export interface AnimeUnityEpisode {
  id: string; // "animeId/episodeId"
  number: number;
  url: string;
}

export interface AnimeUnityInfo {
  id: number;
  title: string;
  url: string;
  image?: string;
  description?: string;
  genres?: string[];
  status?: string;
  totalEpisodes: number;
  episodes: AnimeUnityEpisode[];
}
