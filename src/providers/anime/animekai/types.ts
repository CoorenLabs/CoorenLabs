import { z } from "zod";

// ─── Paged Result Wrapper ────────────────────────────────────────────────────

export interface AnimeKaiPagedResult<T> {
  currentPage: number;
  hasNextPage: boolean;
  totalPages: number;
  results: T[];
}

// ─── Search Item ─────────────────────────────────────────────────────────────

export const animekaiSearchItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  image: z.string().optional(),
  japaneseTitle: z.string().optional().nullable(),
  type: z.string().optional(),
  sub: z.number().optional(),
  dub: z.number().optional(),
  episodes: z.number().optional(),
});

export type AnimeKaiSearchItem = z.infer<typeof animekaiSearchItemSchema>;

// ─── Related / Recommendation Item ───────────────────────────────────────────

export const animekaiRelatedItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().optional(),
  image: z.string().optional(),
  japaneseTitle: z.string().optional().nullable(),
  type: z.string().optional(),
  sub: z.number().optional(),
  dub: z.number().optional(),
  episodes: z.number().optional(),
  relationType: z.string().optional(),
});

export type AnimeKaiRelatedItem = z.infer<typeof animekaiRelatedItemSchema>;

// ─── Anime Info ───────────────────────────────────────────────────────────────

export const animekaiInfoSchema = z.object({
  id: z.string(),
  title: z.string(),
  japaneseTitle: z.string().optional().nullable(),
  image: z.string().optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  url: z.string().optional(),
  totalEpisodes: z.number().optional(),
  status: z.string().optional(),
  season: z.string().optional(),
  duration: z.string().optional(),
  malId: z.string().optional(),
  anilistId: z.string().optional(),
  hasSub: z.boolean().optional(),
  hasDub: z.boolean().optional(),
  subOrDub: z.enum(["sub", "dub", "both", "hardsub"]).optional(),
  genres: z.array(z.string()).optional(),
  recommendations: z.array(animekaiRelatedItemSchema).optional(),
  relations: z.array(animekaiRelatedItemSchema).optional(),
  episodes: z.array(
    z.object({
      id: z.string(),
      number: z.number(),
      title: z.string(),
      isFiller: z.boolean(),
      isSubbed: z.boolean(),
      isDubbed: z.boolean(),
      url: z.string(),
    }),
  ),
});

export type AnimeKaiInfo = z.infer<typeof animekaiInfoSchema>;
export type AnimeKaiEpisode = AnimeKaiInfo["episodes"][number];

// ─── Episode Server ───────────────────────────────────────────────────────────

export interface AnimeKaiServer {
  name: string;
  url: string;
  intro: { start: number; end: number };
  outro: { start: number; end: number };
}
