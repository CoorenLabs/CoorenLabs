import { Elysia } from "elysia";
import { tidal } from "./tidal";

function ok(data: unknown) {
    return { status: 200, success: true, data };
}

function err(set: any, status: number, message: string) {
    set.status = status;
    return { status, success: false, message, data: null };
}

export const tidalRoutes = new Elysia({ prefix: "/tidal" })
    .get("/", () => {
        return {
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
                "GET /tidal/videos/:id/stream      → High-quality video"
            ],
            note: "All resource endpoints support both singular and plural (e.g., /track and /tracks)"
        };
    })

    // --- Search & Discovery ---
    .get("/search", async ({ query, set }) => {
        const q = (query.q as string) || (query.query as string) || "";
        if (!q) return err(set, 400, "Query parameter 'q' is required");
        const limit = parseInt(query.limit as string) || 20;
        const types = (query.types as string) || "TRACKS,ALBUMS,ARTISTS,PLAYLISTS,VIDEOS";
        const data = await tidal.search(q, limit, types);
        if (data && "error" in data) return err(set, 500, data.error as string);

        if (data.tracks?.items) data.tracks.items = data.tracks.items.map((i: any) => tidal.cleanMetadata(i));
        if (data.albums?.items) data.albums.items = data.albums.items.map((i: any) => tidal.cleanMetadata(i));
        if (data.artists?.items) data.artists.items = data.artists.items.map((i: any) => tidal.cleanMetadata(i));
        if (data.playlists?.items) data.playlists.items = data.playlists.items.map((i: any) => tidal.cleanMetadata(i));
        if (data.videos?.items) data.videos.items = data.videos.items.map((i: any) => tidal.cleanMetadata(i));
        if (data.topHit?.value) data.topHit.value = tidal.cleanMetadata(data.topHit.value);

        return ok(data);
    })
    .get("/featured", async ({ query, set }) => {
        const data = await tidal.getFeatured((query.deviceType as string) || "PHONE");
        if (data && "error" in data) return err(set, 500, data.error as string);
        return ok(tidal.cleanPageData(data));
    })
    .get("/charts", async ({ query, set }) => {
        const data = await tidal.getCharts((query.deviceType as string) || "PHONE");
        if (data && "error" in data) return err(set, 500, data.error as string);
        return ok(tidal.cleanPageData(data));
    })
    .get("/new", async ({ query, set }) => {
        const data = await tidal.getNewReleases((query.deviceType as string) || "PHONE");
        if (data && "error" in data) return err(set, 500, data.error as string);
        return ok(tidal.cleanPageData(data));
    })
    .get("/genres", async ({ set }) => {
        const data = await tidal.getGenres();
        if (data && "error" in data) return err(set, 500, data.error as string);
        return ok(data);
    })
    .get("/genres/:path", async ({ params, set }) => {
        const data = await tidal.getGenre(params.path);
        if (data && "error" in data) return err(set, 404, data.error as string);
        return ok(data);
    })
    .get("/moods", async ({ set }) => {
        const data = await tidal.getMoods();
        if (data && "error" in data) return err(set, 500, data.error as string);
        return ok(data);
    })
    .get("/moods/:path", async ({ params, set }) => {
        const data = await tidal.getMood(params.path);
        if (data && "error" in data) return err(set, 404, data.error as string);
        return ok(data);
    })
    .get("/recommendations", async ({ query, set }) => {
        const trackId = (query.trackId as string) || (query.id as string);
        if (!trackId) return err(set, 400, "Query parameter 'trackId' is required");
        const data = await tidal.getRecommendations(trackId, parseInt(query.limit as string) || 50);
        if (data && "error" in data) return err(set, 500, data.error as string);
        if (data.items) data.items = data.items.map((i: any) => tidal.cleanMetadata(i));
        return ok(data);
    })

    // --- Tracks (Dual Alias) ---
    .get("/track/:id", async ({ params, set }) => {
        const data = await tidal.getTrack(params.id);
        if (data && "error" in data) return err(set, 404, "Track not found or invalid ID");
        return ok(tidal.cleanMetadata(data));
    })
    .get("/tracks/:id", async ({ params, set }) => {
        const data = await tidal.getTrack(params.id);
        if (data && "error" in data) return err(set, 404, "Track not found or invalid ID");
        return ok(tidal.cleanMetadata(data));
    })
    .get("/track/:id/stream", async ({ params, query, headers }) => {
        const quality = (query.audioQuality as string) || "HI_RES";
        const sessionId = (headers["x-tidal-sessionid"] as string) || (query.sessionId as string);
        const data = await tidal.getTrackStreaming(params.id, quality, sessionId);
        if (data.preview?.manifest) try { data.preview.manifestDecoded = Buffer.from(data.preview.manifest, 'base64').toString('utf-8'); } catch { /* ignore */ }
        if (data.audio?.manifest) try { data.audio.manifestDecoded = Buffer.from(data.audio.manifest, 'base64').toString('utf-8'); } catch { /* ignore */ }
        return ok(data);
    })
    .get("/tracks/:id/stream", async ({ params, query, headers }) => {
        const quality = (query.audioQuality as string) || "HI_RES";
        const sessionId = (headers["x-tidal-sessionid"] as string) || (query.sessionId as string);
        const data = await tidal.getTrackStreaming(params.id, quality, sessionId);
        if (data.preview?.manifest) try { data.preview.manifestDecoded = Buffer.from(data.preview.manifest, 'base64').toString('utf-8'); } catch { /* ignore */ }
        if (data.audio?.manifest) try { data.audio.manifestDecoded = Buffer.from(data.audio.manifest, 'base64').toString('utf-8'); } catch { /* ignore */ }
        return ok(data);
    })
    .get("/track/:id/playbackinfo", async ({ params, query, set }) => {
        const data = await tidal.getTrackPlaybackInfo(params.id, (query.audioQuality as string) || "HI_RES");
        if (data && "error" in data) return err(set, 404, data.error as string);
        return ok(data);
    })
    .get("/tracks/:id/playbackinfo", async ({ params, query, set }) => {
        const data = await tidal.getTrackPlaybackInfo(params.id, (query.audioQuality as string) || "HI_RES");
        if (data && "error" in data) return err(set, 404, data.error as string);
        return ok(data);
    })
    .get("/track/:id/radio", async ({ params, set }) => {
        const data = await tidal.getTrackRadio(params.id);
        if (data && "error" in data) return err(set, 404, data.error as string);
        return ok(data);
    })
    .get("/tracks/:id/radio", async ({ params, set }) => {
        const data = await tidal.getTrackRadio(params.id);
        if (data && "error" in data) return err(set, 404, data.error as string);
        return ok(data);
    })

    // --- Albums (Dual Alias) ---
    .get("/album/:id", async ({ params, set }) => {
        const data = await tidal.getAlbum(params.id);
        if (data && "error" in data) return err(set, 404, "Album not found");
        return ok(tidal.cleanMetadata(data));
    })
    .get("/albums/:id", async ({ params, set }) => {
        const data = await tidal.getAlbum(params.id);
        if (data && "error" in data) return err(set, 404, "Album not found");
        return ok(tidal.cleanMetadata(data));
    })
    .get("/album/:id/tracks", async ({ params, query, set }) => {
        const data = await tidal.getAlbumTracks(params.id, parseInt(query.limit as string) || 50);
        if (data && "error" in data) return err(set, 404, data.error as string);
        if (data.items) data.items = data.items.map((i: any) => tidal.cleanMetadata(i));
        return ok(data);
    })
    .get("/albums/:id/tracks", async ({ params, query, set }) => {
        const data = await tidal.getAlbumTracks(params.id, parseInt(query.limit as string) || 50);
        if (data && "error" in data) return err(set, 404, data.error as string);
        if (data.items) data.items = data.items.map((i: any) => tidal.cleanMetadata(i));
        return ok(data);
    })

    // --- Artists (Dual Alias) ---
    .get("/artist/:id", async ({ params, set }) => {
        const data = await tidal.getArtist(params.id);
        if (data && "error" in data) return err(set, 404, "Artist not found");
        return ok(tidal.cleanMetadata(data));
    })
    .get("/artists/:id", async ({ params, set }) => {
        const data = await tidal.getArtist(params.id);
        if (data && "error" in data) return err(set, 404, "Artist not found");
        return ok(tidal.cleanMetadata(data));
    })
    .get("/artist/:id/albums", async ({ params, query, set }) => {
        const data = await tidal.getArtistAlbums(params.id, parseInt(query.limit as string) || 50);
        if (data && "error" in data) return err(set, 404, data.error as string);
        if (data.items) data.items = data.items.map((i: any) => tidal.cleanMetadata(i));
        return ok(data);
    })
    .get("/artists/:id/albums", async ({ params, query, set }) => {
        const data = await tidal.getArtistAlbums(params.id, parseInt(query.limit as string) || 50);
        if (data && "error" in data) return err(set, 404, data.error as string);
        if (data.items) data.items = data.items.map((i: any) => tidal.cleanMetadata(i));
        return ok(data);
    })
    .get("/artist/:id/toptracks", async ({ params, query, set }) => {
        const data = await tidal.getArtistTopTracks(params.id, parseInt(query.limit as string) || 10);
        if (data && "error" in data) return err(set, 404, data.error as string);
        if (data.items) data.items = data.items.map((i: any) => tidal.cleanMetadata(i));
        return ok(data);
    })
    .get("/artists/:id/toptracks", async ({ params, query, set }) => {
        const data = await tidal.getArtistTopTracks(params.id, parseInt(query.limit as string) || 10);
        if (data && "error" in data) return err(set, 404, data.error as string);
        if (data.items) data.items = data.items.map((i: any) => tidal.cleanMetadata(i));
        return ok(data);
    })
    .get("/artist/:id/radio", async ({ params, set }) => {
        const data = await tidal.getArtistRadio(params.id);
        if (data && "error" in data) return err(set, 404, data.error as string);
        return ok(data);
    })
    .get("/artists/:id/radio", async ({ params, set }) => {
        const data = await tidal.getArtistRadio(params.id);
        if (data && "error" in data) return err(set, 404, data.error as string);
        return ok(data);
    })

    // --- Playlists (Dual Alias) ---
    .get("/playlist/:id", async ({ params, set }) => {
        const data = await tidal.getPlaylist(params.id);
        if (data && "error" in data) return err(set, 404, "Playlist not found");
        return ok(tidal.cleanMetadata(data));
    })
    .get("/playlists/:id", async ({ params, set }) => {
        const data = await tidal.getPlaylist(params.id);
        if (data && "error" in data) return err(set, 404, "Playlist not found");
        return ok(tidal.cleanMetadata(data));
    })
    .get("/playlist/:id/tracks", async ({ params, query, set }) => {
        const data = await tidal.getPlaylistTracks(params.id, parseInt(query.limit as string) || 50);
        if (data && "error" in data) return err(set, 404, data.error as string);
        if (data.items) data.items = data.items.map((i: any) => tidal.cleanMetadata(i));
        return ok(data);
    })
    .get("/playlists/:id/tracks", async ({ params, query, set }) => {
        const data = await tidal.getPlaylistTracks(params.id, parseInt(query.limit as string) || 50);
        if (data && "error" in data) return err(set, 404, data.error as string);
        if (data.items) data.items = data.items.map((i: any) => tidal.cleanMetadata(i));
        return ok(data);
    })

    // --- Mixes ---
    .get("/mix/:id", async ({ params, set }) => {
        const data = await tidal.getMix(params.id);
        if (data && "error" in data) return err(set, 404, "Mix not found");
        return ok(tidal.cleanMetadata(data));
    })
    .get("/mixes/:id", async ({ params, set }) => {
        const data = await tidal.getMix(params.id);
        if (data && "error" in data) return err(set, 404, "Mix not found");
        return ok(tidal.cleanMetadata(data));
    })
    .get("/mixes/:id/items", async ({ params, query, set }) => {
        const data = await tidal.getMixItems(params.id, parseInt(query.limit as string) || 50);
        if (data && "error" in data) return err(set, 404, data.error as string);
        if (data.items) data.items = data.items.map((i: any) => tidal.cleanMetadata(i));
        return ok(data);
    })

    // --- Videos ---
    .get("/video/:id", async ({ params, set }) => {
        const data = await tidal.getVideo(params.id);
        if (data && "error" in data) return err(set, 404, "Video not found");
        return ok(tidal.cleanMetadata(data));
    })
    .get("/videos/:id", async ({ params, set }) => {
        const data = await tidal.getVideo(params.id);
        if (data && "error" in data) return err(set, 404, "Video not found");
        return ok(tidal.cleanMetadata(data));
    })
    .get("/video/:id/stream", async ({ params, query, headers }) => {
        const quality = (query.quality as string) || "HIGH";
        const sessionId = (headers["x-tidal-sessionid"] as string) || (query.sessionId as string);
        const data = await tidal.getVideoStreaming(params.id, quality, sessionId);
        if (data.preview?.manifest) try { data.preview.manifestDecoded = Buffer.from(data.preview.manifest, 'base64').toString('utf-8'); } catch { /* ignore */ }
        if (data.audio?.manifest) try { data.audio.manifestDecoded = Buffer.from(data.audio.manifest, 'base64').toString('utf-8'); } catch { /* ignore */ }
        return ok(data);
    })
    .get("/videos/:id/stream", async ({ params, query, headers }) => {
        const quality = (query.quality as string) || "HIGH";
        const sessionId = (headers["x-tidal-sessionid"] as string) || (query.sessionId as string);
        const data = await tidal.getVideoStreaming(params.id, quality, sessionId);
        if (data.preview?.manifest) try { data.preview.manifestDecoded = Buffer.from(data.preview.manifest, 'base64').toString('utf-8'); } catch { /* ignore */ }
        if (data.audio?.manifest) try { data.audio.manifestDecoded = Buffer.from(data.audio.manifest, 'base64').toString('utf-8'); } catch { /* ignore */ }
        return ok(data);
    });
