import { Logger } from "../../../core/logger";
import { tidal as TIDAL_API } from "../../origins";

type Params = Record<string, string | number | undefined>;
type Kind = "tracks" | "videos";

const COUNTRY_CODE = "US";
const TIMEOUT_MS = 15_000;
const SEARCH_TYPES = "TRACKS,ALBUMS,ARTISTS,PLAYLISTS,VIDEOS";
const HEADERS = {
  "x-tidal-token": "49YxDN9a2aFV6RTG",
  "User-Agent": "TIDAL_ANDROID/1018.0 (SM-G975F; Android 11)",
  origin: "https://listen.tidal.com",
  referer: "https://listen.tidal.com/",
};
const ARTWORK: [field: string, size: string][] = [
  ["cover", "640x640"],
  ["squareImage", "640x640"],
  ["picture", "750x750"],
  ["image", "1080x720"],
  ["imageId", "640x640"],
];

class TidalError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request(path: string, params: Params = {}, sessionId?: string): Promise<any> {
  const url = new URL(`${TIDAL_API}${path}`);
  url.searchParams.set("countryCode", COUNTRY_CODE);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  let res: Response;
  try {
    res = await fetch(url, {
      headers: sessionId ? { ...HEADERS, "x-tidal-sessionid": sessionId } : HEADERS,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut = (err as Error).name === "TimeoutError";
    Logger.warn(`[tidal] ${path}: ${(err as Error).message}`);
    throw new TidalError(
      timedOut ? "Tidal did not respond in time" : "Failed to reach Tidal",
      timedOut ? 504 : 502,
    );
  }

  const body = await res.json().catch(() => null);
  if (res.ok && body !== null) return body;
  if (res.status >= 500) Logger.warn(`[tidal] ${path}: HTTP ${res.status}`);
  throw new TidalError(
    body?.userMessage || `Tidal responded with HTTP ${res.status}`,
    res.ok || res.status >= 500 ? 502 : res.status,
  );
}

const settle = (promise: Promise<any>) =>
  promise.catch((err: TidalError) => ({ error: err.message, status: err.status }));

const ensureFound = (promise: Promise<any>, lookup: () => Promise<unknown>) =>
  promise.catch(async (err: TidalError) => {
    if (err.status >= 500)
      await lookup().catch((missing: TidalError) => {
        if (missing?.status === 404) throw missing;
      });
    throw err;
  });

function decodeManifest(info: any) {
  if (typeof info?.manifest === "string") {
    info.manifestDecoded = Buffer.from(info.manifest, "base64").toString("utf-8");
  }
  return info;
}

function playbackInfo(kind: Kind, id: string, quality: string, sessionId?: string) {
  return request(
    `/${kind}/${id}/${sessionId ? "playbackinfopostpaywall" : "playbackinfo"}`,
    {
      [kind === "tracks" ? "audioquality" : "videoquality"]: quality,
      playbackmode: "STREAM",
      assetpresentation: "FULL",
    },
    sessionId,
  );
}

async function streaming(kind: Kind, id: string, quality: string, sessionId?: string) {
  const [metadata, preview, audio] = await Promise.all([
    request(`/${kind}/${id}`),
    settle(playbackInfo(kind, id, "LOW")),
    sessionId
      ? settle(playbackInfo(kind, id, quality, sessionId))
      : {
          error: `Session ID required for full ${kind === "tracks" ? "audio" : "video"}`,
          status: 401,
        },
  ]);
  return {
    ...cleanMetadata(metadata),
    preview: decodeManifest(preview),
    audio: decodeManifest(audio),
  };
}

const page = (id: string, deviceType = "PHONE", params: Params = {}) =>
  request(`/pages/${id}`, { deviceType, ...params });

async function getMix(id: string) {
  const data = await page("mix", "PHONE", { mixId: id });
  const header = data.rows
    ?.flatMap((row: any) => row.modules ?? [])
    .find((module: any) => module?.mix);
  if (!header) throw new TidalError("Mix not found", 404);
  return header.mix;
}

function imageUrl(uuid: string, size: string): string {
  if (uuid.startsWith("http")) return uuid;
  return `https://resources.tidal.com/images/${uuid.replace(/-/g, "/")}/${size}.jpg`;
}

function artworkOf(item: any): string | undefined {
  for (const [field, size] of ARTWORK) {
    if (typeof item[field] === "string" && item[field]) return imageUrl(item[field], size);
  }
  const images = item.images;
  return images?.LARGE?.url ?? images?.MEDIUM?.url ?? images?.SMALL?.url;
}

function cleanMetadata(item: any): any {
  if (!item || typeof item !== "object") return item || {};

  if (item.item && typeof item.item === "object" && item.type) {
    const inner = cleanMetadata(item.item);
    return { ...item, ...inner, item: inner };
  }

  if (item.uuid && !item.id) item.id = item.uuid;
  if (!item.id && item.id !== 0) item.id = 0;
  if (!item.artwork) item.artwork = artworkOf(item);

  if (item.album && typeof item.album === "object") {
    item.album = cleanMetadata(item.album);
    if (!item.artwork && item.album.artwork) item.artwork = item.album.artwork;
  }

  if (Array.isArray(item.artists)) {
    item.artists = item.artists.map(cleanMetadata);
  } else if (item.artist && typeof item.artist === "object") {
    item.artist = cleanMetadata(item.artist);
    item.artists = [item.artist];
  }

  item.title = item.title || item.name || "Unknown";
  item.name = item.name || item.title || "Unknown";
  item.duration = item.duration || 0;
  item.isrc = item.isrc || "";
  item.explicit = !!item.explicit;
  if (!item.artists?.length) item.artists = [{ id: 0, name: "Unknown Artist", artwork: null }];
  if (!item.album) item.album = { id: 0, title: "Unknown Album", artwork: null };

  return item;
}

function cleanItems(data: any) {
  if (Array.isArray(data?.items)) data.items = data.items.map(cleanMetadata);
  return data;
}

function cleanPageData(data: any) {
  for (const row of Array.isArray(data?.rows) ? data.rows : []) {
    for (const module of Array.isArray(row?.modules) ? row.modules : []) {
      cleanItems(module);
      cleanItems(module?.pagedList);
    }
  }
  return data;
}

export const tidal = {
  search: (query: string, limit = 20, types = SEARCH_TYPES) =>
    request("/search", { query, limit, types }),
  getTrack: (id: string) => request(`/tracks/${id}`),
  getTrackStreaming: (id: string, quality = "HI_RES", sessionId?: string) =>
    streaming("tracks", id, quality, sessionId),
  getTrackPlaybackInfo: (id: string, quality = "HI_RES") =>
    ensureFound(playbackInfo("tracks", id, quality), () => request(`/tracks/${id}`)),
  getTrackRadio: (id: string) => request(`/tracks/${id}/radio`),
  getRecommendations: (trackId: string, limit = 50, offset?: number) =>
    request(`/tracks/${trackId}/radio`, { limit, offset }),
  getAlbum: (id: string) => request(`/albums/${id}`),
  getAlbumTracks: (id: string, limit = 50, offset?: number) =>
    request(`/albums/${id}/tracks`, { limit, offset }),
  getArtist: (id: string) => request(`/artists/${id}`),
  getArtistAlbums: (id: string, limit = 50, offset?: number) =>
    request(`/artists/${id}/albums`, { limit, offset }),
  getArtistTopTracks: (id: string, limit = 10, offset?: number) =>
    request(`/artists/${id}/toptracks`, { limit, offset }),
  getArtistRadio: (id: string) => request(`/artists/${id}/radio`),
  getPlaylist: (id: string) => request(`/playlists/${id}`),
  getPlaylistTracks: (id: string, limit = 50, offset?: number) =>
    request(`/playlists/${id}/items`, { limit, offset }),
  getMix,
  getMixItems: (id: string, limit = 50, offset?: number) =>
    ensureFound(request(`/mixes/${id}/items`, { limit, offset }), () => getMix(id)),
  getVideo: (id: string) => request(`/videos/${id}`),
  getVideoStreaming: (id: string, quality = "HIGH", sessionId?: string) =>
    streaming("videos", id, quality, sessionId),
  getGenres: () => request("/genres"),
  getGenre: (path: string) => request(`/genres/${path}`),
  getMoods: () => request("/moods"),
  getMood: (path: string) => request(`/moods/${path}`),
  getFeatured: (deviceType?: string) => page("home", deviceType),
  getCharts: (deviceType?: string) => page("explore_top_music", deviceType),
  getNewReleases: (deviceType?: string) => page("explore_new_music", deviceType),
  cleanMetadata,
  cleanItems,
  cleanPageData,
};
