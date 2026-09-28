export type DirectSource = {
  label: string;
  type: "hls" | "mp4";
  url: string;
  cover?: string;
  thumbnail?: string;
  subtitles?: { label: string; url: string };
  headers?: Record<string, string>;
  proxiedUrl?: string;
};

export type Extractor = {
  pattern: RegExp;
  ttl: number;
  extract(url: string, referer: string): Promise<DirectSource | null>;
};
