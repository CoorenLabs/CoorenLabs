export interface AnimeSaturnSearchItem {
  id: string;
  title: string;
  url: string;
  image: string;
  type?: string;
}

export interface AnimeSaturnEpisode {
  id: string;
  number: number;
  url: string;
}

export interface AnimeSaturnInfo {
  id: string;
  title: string;
  url: string;
  image?: string;
  description?: string;
  genres?: string[];
  status?: string;
  totalEpisodes: number;
  episodes: AnimeSaturnEpisode[];
}

export interface AnimeSaturnSource {
  url: string;
  quality: string;
  isM3U8: boolean;
}

export interface AnimeSaturnServer {
  name: string;
  url: string;
}
