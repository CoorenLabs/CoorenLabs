import { z } from "zod";

// ─── Search API ─────────────────────────────────────────────────────────────
export const searchSchema = z.object({
  data: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      type: z.string(),
      episodes: z.number(),
      status: z.string(),
      year: z.number(),
      score: z.number(),
      poster: z.string(),
      session: z.string(),
    }),
  ),
});

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

// ─── Airing / Latest API ───────────────────────────────────────────────────

export const airingSchema = z.object({
  data: z.array(
    z.object({
      id: z.number(),
      anime_id: z.number(),
      anime_title: z.string(),
      anime_session: z.string(),
      episode: z.number(),
      episode2: z.number(),
      edition: z.string(),
      fansub: z.string(),
      snapshot: z.string(),
      disc: z.string(),
      session: z.string(),
      filler: z.number(),
      created_at: z.string(),
      completed: z.number(),
    }),
  ),
});

export interface AiringItem {
  id: string;
  title: string;
  episode: number;
  snapshot: string;
  session: string;
  fansub: string;
  created_at: string;
}

// ─── Release / Episodes API ────────────────────────────────────────────────

export const releaseSchema = z.object({
  last_page: z.number(),
  data: z.array(
    z.object({
      id: z.number(),
      anime_id: z.number(),
      episode: z.number(),
      episode2: z.number(),
      edition: z.string(),
      title: z.string(),
      snapshot: z.string(),
      disc: z.string(),
      audio: z.string(),
      duration: z.string(),
      session: z.string(),
      filler: z.number(),
      created_at: z.string(),
    }),
  ),
});

export interface Episode {
  title: string;
  episode: number;
  released: string;
  snapshot: string;
  duration: string;
  filler: boolean;
  session: string;
}

// ─── Anime Info / Meta ─────────────────────────────────────────────────────

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

// ─── Stream Results ────────────────────────────────────────────────────────

export interface StreamResult {
  id: string;
  title: string;
  url: string;
  directUrl?: string | null;
  quality: string;
  audio: string;
  type?: string;
  downloadUrl?: string | null;
  corsHeaders?: Record<string, string>;
  animeName?: string;
}
