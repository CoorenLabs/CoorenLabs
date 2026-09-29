export interface AnimeUnitySearchItem {
  id: number;
  title: string;
  url: string;
  image: string;
  type?: string;
  score?: string;
}

export interface AnimeUnityEpisode {
  id: string;
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

export interface AnimeUnityStreams {
  streams: { url: string; quality: string; isM3U8: boolean }[];
  downloads?: { url: string; quality: string }[];
}

export interface AnimeUnityRecord {
  id: number;
  slug?: string;
  title?: string | null;
  title_eng?: string | null;
  title_it?: string | null;
  imageurl?: string;
  type?: string;
  score?: string;
  plot?: string;
  status?: string;
  episodes_count?: number;
  genres?: (string | { name: string })[];
}
