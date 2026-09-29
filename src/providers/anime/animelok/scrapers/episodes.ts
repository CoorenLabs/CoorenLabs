import { animelokFetch } from "../lib/fetch";
import type { EpisodeList } from "../lib/types";

type WatchProps = {
  totalEpisodes?: number | null;
  episodes: {
    number: number;
    title: string | null;
    image: string | null;
    airdate: string | null;
  }[];
};

function findWatchProps(node: unknown): WatchProps | undefined {
  if (!node || typeof node !== "object") return;
  if (Array.isArray((node as WatchProps).episodes)) return node as WatchProps;
  for (const child of Object.values(node)) {
    const props = findWatchProps(child);
    if (props) return props;
  }
}

function parseWatchPayload(payload: string): WatchProps | undefined {
  for (const line of payload.split("\n")) {
    if (!line.includes('"episodes":[')) continue;
    try {
      const props = findWatchProps(JSON.parse(line.slice(line.indexOf(":") + 1)));
      if (props) return props;
    } catch {
      continue;
    }
  }
}

export async function scrapeEpisodes(anilistId: string): Promise<EpisodeList | null> {
  const payload = await animelokFetch(`/watch/${anilistId}`, { RSC: "1" });
  const props = payload ? parseWatchPayload(payload) : undefined;
  if (!props) return null;
  const episodes = props.episodes.map((ep) => {
    const image = ep.image || undefined;
    return {
      number: ep.number,
      name: ep.title?.trim() || `Episode ${ep.number}`,
      title: ep.title,
      airdate: ep.airdate,
      thumbnail: image,
      image,
      img: image,
    };
  });
  return { episodes, total: props.totalEpisodes ?? episodes.length };
}
