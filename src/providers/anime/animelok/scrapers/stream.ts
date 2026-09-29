import { animelokFetch } from "../lib/fetch";
import type { EmbedStream, LangTrack, StreamTracks } from "../lib/types";

type Track = "sub" | "dub";

type UpstreamServer = {
  source?: string;
  server?: string;
  type?: string;
  language?: string | null;
  url?: string;
};

const SHORT_LINK = "https://short.icu/";
const VIDEO_HASH = /\/video\/([a-f0-9]+)$/i;

function serverName({ server, language }: UpstreamServer) {
  if (server === "default") return "multi";
  if (server === "multi-lang") return language || "multi";
  return server || "Unknown";
}

function toEmbed(server: UpstreamServer & { url: string }, track: Track): EmbedStream {
  let url = server.url.startsWith(SHORT_LINK)
    ? `https://player.abyssplayer.com/${server.url.slice(SHORT_LINK.length)}`
    : server.url;
  if (server.source === "reanime" && track === "dub") url += `${url.includes("?") ? "&" : "?"}a=1`;
  return { url, server: serverName(server) };
}

function buildTrack(servers: UpstreamServer[], track: Track): LangTrack {
  const embeds = servers
    .filter((server): server is UpstreamServer & { url: string } => !!server.url)
    .filter(({ type }) => type === track || (type !== "sub" && type !== "dub"))
    .map((server) => toEmbed(server, track));
  const hash = embeds.map(({ url }) => url.match(VIDEO_HASH)?.[1]).find(Boolean) ?? null;
  return { hash, servers: [], embeds, best: embeds[0]?.url ?? null };
}

export async function scrapeStream(
  anilistId: string,
  episode: string,
): Promise<StreamTracks | null> {
  const payload = await animelokFetch(`/api/anilist/${anilistId}/${episode}`, undefined, [
    404, 502,
  ]);
  if (!payload) return null;
  const { servers } = JSON.parse(payload);
  const list: UpstreamServer[] = Array.isArray(servers) ? servers : [];
  return { sub: buildTrack(list, "sub"), dub: buildTrack(list, "dub") };
}
