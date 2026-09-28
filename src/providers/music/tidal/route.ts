import { Elysia } from "elysia";
import { Logger } from "../../../core/logger";
import { tidal } from "./tidal";

type Query = Record<string, string | undefined>;
type Context = {
  params: Record<string, string>;
  query: Query;
  headers: Query;
  set: { status?: number | string };
};
type Endpoint = [paths: string[], load: (ctx: Context) => Promise<unknown>, notFound?: string];

class RouteError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const ok = (data: unknown) => ({ status: 200, success: true, data });

const aliases = (singular: string, plural: string, path = "") => [
  `/${singular}${path}`,
  `/${plural}${path}`,
];
const limit = (query: Query, fallback: number) => parseInt(query.limit ?? "", 10) || fallback;
const offset = (query: Query) => parseInt(query.offset ?? "", 10) || undefined;
const session = ({ headers, query }: Context) => headers["x-tidal-sessionid"] || query.sessionId;
const deviceType = (query: Query) => query.deviceType || "PHONE";

function cleanSearch(data: any) {
  for (const key of ["tracks", "albums", "artists", "playlists", "videos"]) {
    if (data?.[key]?.items) data[key].items = data[key].items.map(tidal.cleanMetadata);
  }
  if (data?.topHit?.value) data.topHit.value = tidal.cleanMetadata(data.topHit.value);
  return data;
}

const endpoints: Endpoint[] = [
  [
    ["/search"],
    async ({ query }) => {
      const q = query.q || query.query;
      if (!q) throw new RouteError(400, "Query parameter 'q' is required");
      return cleanSearch(await tidal.search(q, limit(query, 20), query.types || undefined));
    },
  ],
  [
    ["/featured"],
    async ({ query }) => tidal.cleanPageData(await tidal.getFeatured(deviceType(query))),
  ],
  [["/charts"], async ({ query }) => tidal.cleanPageData(await tidal.getCharts(deviceType(query)))],
  [
    ["/new"],
    async ({ query }) => tidal.cleanPageData(await tidal.getNewReleases(deviceType(query))),
  ],
  [["/genres"], () => tidal.getGenres()],
  [["/genres/:path"], ({ params }) => tidal.getGenre(params.path)],
  [["/moods"], () => tidal.getMoods()],
  [["/moods/:path"], ({ params }) => tidal.getMood(params.path)],
  [
    ["/recommendations"],
    async ({ query }) => {
      const trackId = query.trackId || query.id;
      if (!trackId) throw new RouteError(400, "Query parameter 'trackId' is required");
      return tidal.cleanItems(
        await tidal.getRecommendations(trackId, limit(query, 50), offset(query)),
      );
    },
  ],
  [
    aliases("track", "tracks", "/:id"),
    async ({ params }) => tidal.cleanMetadata(await tidal.getTrack(params.id)),
    "Track not found or invalid ID",
  ],
  [
    aliases("track", "tracks", "/:id/stream"),
    (ctx) =>
      tidal.getTrackStreaming(ctx.params.id, ctx.query.audioQuality || "HI_RES", session(ctx)),
    "Track not found or invalid ID",
  ],
  [
    aliases("track", "tracks", "/:id/playbackinfo"),
    ({ params, query }) => tidal.getTrackPlaybackInfo(params.id, query.audioQuality || "HI_RES"),
  ],
  [aliases("track", "tracks", "/:id/radio"), ({ params }) => tidal.getTrackRadio(params.id)],
  [
    aliases("album", "albums", "/:id"),
    async ({ params }) => tidal.cleanMetadata(await tidal.getAlbum(params.id)),
    "Album not found",
  ],
  [
    aliases("album", "albums", "/:id/tracks"),
    async ({ params, query }) =>
      tidal.cleanItems(await tidal.getAlbumTracks(params.id, limit(query, 50), offset(query))),
  ],
  [
    aliases("artist", "artists", "/:id"),
    async ({ params }) => tidal.cleanMetadata(await tidal.getArtist(params.id)),
    "Artist not found",
  ],
  [
    aliases("artist", "artists", "/:id/albums"),
    async ({ params, query }) =>
      tidal.cleanItems(await tidal.getArtistAlbums(params.id, limit(query, 50), offset(query))),
  ],
  [
    aliases("artist", "artists", "/:id/toptracks"),
    async ({ params, query }) =>
      tidal.cleanItems(await tidal.getArtistTopTracks(params.id, limit(query, 10), offset(query))),
  ],
  [aliases("artist", "artists", "/:id/radio"), ({ params }) => tidal.getArtistRadio(params.id)],
  [
    aliases("playlist", "playlists", "/:id"),
    async ({ params }) => tidal.cleanMetadata(await tidal.getPlaylist(params.id)),
    "Playlist not found",
  ],
  [
    aliases("playlist", "playlists", "/:id/tracks"),
    async ({ params, query }) =>
      tidal.cleanItems(await tidal.getPlaylistTracks(params.id, limit(query, 50), offset(query))),
  ],
  [
    aliases("mix", "mixes", "/:id"),
    async ({ params }) => tidal.cleanMetadata(await tidal.getMix(params.id)),
    "Mix not found",
  ],
  [
    aliases("mix", "mixes", "/:id/items"),
    async ({ params, query }) =>
      tidal.cleanItems(await tidal.getMixItems(params.id, limit(query, 50), offset(query))),
  ],
  [
    aliases("video", "videos", "/:id"),
    async ({ params }) => tidal.cleanMetadata(await tidal.getVideo(params.id)),
    "Video not found",
  ],
  [
    aliases("video", "videos", "/:id/stream"),
    (ctx) => tidal.getVideoStreaming(ctx.params.id, ctx.query.quality || "HIGH", session(ctx)),
    "Video not found",
  ],
];

export const tidalRoutes = new Elysia({ prefix: "/tidal" }).get("/", () => ({
  provider: "Tidal",
  status: "operational",
  description: "High-fidelity music streaming API with comprehensive metadata",
  endpoints: [
    "GET /tidal/search?q=...&limit=20   → Search everything",
    "GET /tidal/tracks/:id             → Track details & metadata",
    "GET /tidal/tracks/:id/stream      → DASH preview & full audio",
    "GET /tidal/tracks/:id/radio       → Track-based radio",
    "GET /tidal/albums/:id             → Album details",
    "GET /tidal/albums/:id/tracks      → Album tracks",
    "GET /tidal/artists/:id            → Artist details",
    "GET /tidal/artists/:id/toptracks  → Artist hits",
    "GET /tidal/playlists/:id          → Playlist details",
    "GET /tidal/playlists/:id/tracks   → Playlist items",
    "GET /tidal/featured               → Home spotlights",
    "GET /tidal/videos/:id/stream      → High-quality video",
  ],
  note: "All resource endpoints support both singular and plural (e.g., /track and /tracks)",
}));

for (const [paths, load, notFound] of endpoints) {
  for (const path of paths) {
    tidalRoutes.get(path, async (ctx: Context) => {
      try {
        return ok(await load(ctx));
      } catch (err) {
        const status =
          typeof (err as RouteError).status === "number" ? (err as RouteError).status : 500;
        if (status === 500) Logger.error(`[tidal] ${path}`, err);
        ctx.set.status = status;
        const message = status === 404 && notFound ? notFound : (err as Error).message;
        return { status, success: false, message, data: null };
      }
    });
  }
}
