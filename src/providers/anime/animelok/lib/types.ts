type Episode = {
  number: number;
  name: string;
  title: string | null;
  airdate: string | null;
  thumbnail?: string;
  image?: string;
  img?: string;
};

export type EpisodeList = {
  episodes: Episode[];
  total: number;
};

export type EmbedStream = {
  url: string;
  server: string;
};

type ServerGroup = {
  server: string;
  streams: { url: string; quality: string }[];
};

export type LangTrack = {
  hash: string | null;
  servers: ServerGroup[];
  embeds: EmbedStream[];
  best: string | null;
};

export type StreamTracks = {
  sub: LangTrack;
  dub: LangTrack;
};
