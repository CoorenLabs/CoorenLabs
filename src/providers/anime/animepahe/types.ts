export interface SearchResponse {
  data?: {
    title: string;
    type: string;
    episodes: number;
    status: string;
    year: number;
    score: number;
    poster: string;
    session: string;
  }[];
}

export interface AiringResponse {
  data?: {
    anime_title: string;
    anime_session: string;
    episode: number;
    fansub: string;
    snapshot: string;
    session: string;
    created_at: string;
  }[];
}

export interface ReleaseResponse {
  last_page?: number;
  data?: {
    episode: number;
    title: string;
    snapshot: string;
    duration: string;
    session: string;
    filler: number;
    created_at: string;
  }[];
}

export interface AnimeSearchItem {
  id: string;
  title: string;
  type: string;
  episodes: number;
  status: string;
  year: number;
  score: number;
  poster: string;
  session: string;
}

export interface AiringItem {
  id: string;
  title: string;
  episode: number;
  snapshot: string;
  session: string;
  fansub: string;
  created_at: string;
}

export interface Episode {
  title: string;
  episode: number;
  released: string;
  snapshot: string;
  duration: string;
  filler: boolean;
  session: string;
}

export interface AnimeMeta {
  id: string;
  name: string;
  description: string;
  poster: string | null;
  background: string | null;
  aired: string;
  duration: string;
  genres: string[];
  externalLinks: string[];
}

export interface StreamResult {
  id: string;
  title: string;
  url: string;
  directUrl: string;
  proxiedUrl: string;
  quality: string;
  audio: string;
  downloadUrl: string | null;
  corsHeaders: Record<string, string>;
}
