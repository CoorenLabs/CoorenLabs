export type DirectStream = {
  url: string;
  quality: string;
  server: string;
};

export type EmbedStream = {
  url: string;
  server: string;
};

/** Streams grouped by server name, each sorted by quality. */
export type ServerGroup = {
  server: string;
  streams: Omit<DirectStream, "server">[];
};

export type StreamResult = {
  episodeNumber: number;
  lang: string;
  hash: string | null;
  /** Direct HLS/MP4 streams grouped by server (e.g. "pahe", "bato"). */
  servers: ServerGroup[];
  embeds: EmbedStream[];
  best: string | null;
};

/** Streams for a single language track. */
export type LangTrack = {
  hash: string | null;
  servers: ServerGroup[];
  embeds: EmbedStream[];
  best: string | null;
};

/** Combined sub + dub result returned by scrapeStreamBilingual(). */
export type BilingualStreamResult = {
  episodeNumber: number;
  preferQuality: string;
  sub: LangTrack;
  dub: LangTrack;
};

export type Episode = {
  number: number;
  name: string;
  id?: string;
  thumbnail?: string;
};

export type EpisodesResult = {
  episodes: Episode[];
  total?: number;
  page?: number;
};
