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
  type?: string;
  status?: string;
  totalEpisodes: number;
  episodes: AnimeSaturnEpisode[];
}

export interface AnimeSaturnSource {
  server: string;
  url: string;
  embed: boolean;
  isM3U8?: boolean;
  embedUrl?: string;
  proxiedUrl?: string;
}

export interface AnimeSaturnDownload {
  server: string;
  url: string;
}

export interface AnimeSaturnStreams {
  streams: AnimeSaturnSource[];
  downloads?: AnimeSaturnDownload[];
}

export interface AnimeSaturnServer {
  name: string;
  link: string | null;
  embed: boolean;
  download: boolean;
  downloadUrl: string | null;
}
