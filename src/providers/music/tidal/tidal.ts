import axios from "axios";
import { tidal as tidalOrigin } from "../../origins";

export class TidalAPI {
    private readonly baseUrl = tidalOrigin;
    private readonly countryCode = "US";
    private readonly token = "49YxDN9a2aFV6RTG";

    private get headers() {
        return {
            "x-tidal-token": this.token,
            "Content-Type": "application/json",
            "User-Agent": "TIDAL_ANDROID/1018.0 (SM-G975F; Android 11)",
            "origin": "https://listen.tidal.com",
            "referer": "https://listen.tidal.com/",
        };
    }

    private async fetch<T>(path: string, params: Record<string, any> = {}, sessionId?: string): Promise<T | { error: string, status?: number }> {
        try {
            const url = new URL(`${this.baseUrl}${path}`);
            url.searchParams.append("countryCode", this.countryCode);
            for (const [key, value] of Object.entries(params)) {
                if (value !== undefined && value !== null) {
                    url.searchParams.append(key, String(value));
                }
            }

            const headers: Record<string, string> = { ...this.headers };
            if (sessionId) {
                headers["x-tidal-sessionid"] = sessionId;
            }

            const response = await axios.get(url.toString(), { headers });
            return response.data;
        } catch (error: any) {
            console.error(`Tidal API Error on ${path}:`, error.response?.data || error.message);
            return {
                error: error.response?.data?.userMessage || error.message || "Failed to fetch from Tidal API",
                status: error.response?.status
            };
        }
    }

    // Implementation of specific endpoints will go here...
    public async search(query: string, limit: number = 20, types: string = "TRACKS,ALBUMS,ARTISTS,PLAYLISTS,VIDEOS"): Promise<any> {
        return this.fetch("/search", { query, limit, types });
    }

    // --- Tracks --- //
    public async getTrack(id: string): Promise<any> {
        return this.fetch(`/tracks/${id}`);
    }

    public async getTrackStreaming(id: string, audioQuality: string = "HI_RES", sessionId?: string): Promise<any> {
        const metadataPromise = this.getTrack(id);
        const previewPromise = this.fetch(`/tracks/${id}/playbackinfo`, {
            audioquality: "LOW",
            playbackmode: "STREAM",
            assetpresentation: "FULL",
        });

        if (sessionId) {
            const [preview, audio, metadata] = await Promise.all([
                previewPromise,
                this.fetch(`/tracks/${id}/playbackinfopostpaywall`, {
                    audioquality: audioQuality,
                    playbackmode: "STREAM",
                    assetpresentation: "FULL",
                }, sessionId),
                metadataPromise
            ]);
            return { ...this.cleanMetadata(metadata), preview, audio };
        }

        const [preview, metadata] = await Promise.all([previewPromise, metadataPromise]);
        return {
            ...this.cleanMetadata(metadata),
            preview,
            audio: { error: "Session ID required for full audio", status: 401 }
        };
    }

    // --- Albums --- //
    public async getAlbum(id: string): Promise<any> {
        return this.fetch(`/albums/${id}`);
    }

    public async getAlbumTracks(id: string, limit: number = 50): Promise<any> {
        return this.fetch(`/albums/${id}/tracks`, { limit });
    }

    // --- Artists --- //
    public async getArtist(id: string): Promise<any> {
        return this.fetch(`/artists/${id}`);
    }

    public async getArtistAlbums(id: string, limit: number = 50): Promise<any> {
        return this.fetch(`/artists/${id}/albums`, { limit });
    }

    public async getArtistTopTracks(id: string, limit: number = 10): Promise<any> {
        return this.fetch(`/artists/${id}/toptracks`, { limit });
    }

    // --- Playlists --- //
    public async getPlaylist(id: string): Promise<any> {
        return this.fetch(`/playlists/${id}`);
    }

    public async getPlaylistTracks(id: string, limit: number = 50): Promise<any> {
        return this.fetch(`/playlists/${id}/items`, { limit });
    }

    // --- Mixes --- //
    public async getMix(id: string): Promise<any> {
        return this.fetch(`/mixes/${id}`);
    }

    public async getMixItems(id: string, limit: number = 50): Promise<any> {
        return this.fetch(`/mixes/${id}/items`, { limit });
    }

    // --- Recommendations --- //
    public async getRecommendations(trackId: string, limit: number = 50): Promise<any> {
        return this.fetch(`/tracks/${trackId}/similar`, { limit });
    }
    // --- Discovery & Pages --- //
    public async getGenres(): Promise<any> {
        return this.fetch("/genres");
    }

    public async getGenre(path: string): Promise<any> {
        return this.fetch(`/genres/${path}`);
    }

    public async getMoods(): Promise<any> {
        return this.fetch("/moods");
    }

    public async getMood(path: string): Promise<any> {
        return this.fetch(`/moods/${path}`);
    }

    public async getPage(id: string, deviceType: string = "PHONE"): Promise<any> {
        return this.fetch(`/pages/${id}`, { deviceType });
    }

    public async getFeatured(deviceType: string = "PHONE"): Promise<any> {
        return this.getPage("home", deviceType);
    }

    public async getCharts(deviceType: string = "PHONE"): Promise<any> {
        return this.getPage("charts", deviceType);
    }

    public async getNewReleases(deviceType: string = "PHONE"): Promise<any> {
        return this.getPage("new", deviceType);
    }

    // --- Radio --- //
    public async getTrackRadio(id: string): Promise<any> {
        return this.fetch(`/tracks/${id}/radio`);
    }

    public async getArtistRadio(id: string): Promise<any> {
        return this.fetch(`/artists/${id}/radio`);
    }

    // --- Videos --- //
    public async getVideo(id: string): Promise<any> {
        return this.fetch(`/videos/${id}`);
    }

    public async getVideoStreaming(id: string, videoQuality: string = "HIGH", sessionId?: string): Promise<any> {
        const metadataPromise = this.getVideo(id);
        const previewPromise = this.fetch(`/videos/${id}/playbackinfo`, {
            videoquality: "LOW",
            playbackmode: "STREAM",
            assetpresentation: "FULL",
        });

        if (sessionId) {
            const [preview, audio, metadata] = await Promise.all([
                previewPromise,
                this.fetch(`/videos/${id}/playbackinfopostpaywall`, {
                    videoquality: videoQuality,
                    playbackmode: "STREAM",
                    assetpresentation: "FULL",
                }, sessionId),
                metadataPromise
            ]);
            return { ...this.cleanMetadata(metadata), preview, audio };
        }

        const [preview, metadata] = await Promise.all([previewPromise, metadataPromise]);
        return {
            ...this.cleanMetadata(metadata),
            preview,
            audio: { error: "Session ID required for full video", status: 401 }
        };
    }
    public async getTrackPlaybackInfo(id: string, audioQuality: string = "HI_RES"): Promise<any> {
        return this.fetch(`/tracks/${id}/playbackinfo`, {
            audioquality: audioQuality,
            playbackmode: "STREAM",
            assetpresentation: "FULL",
        });
    }

    public async getTrackPlaybackInfoPostPaywall(id: string, audioQuality: string = "HI_RES", sessionId?: string): Promise<any> {
        return this.fetch(`/tracks/${id}/playbackinfopostpaywall`, {
            audioquality: audioQuality,
            playbackmode: "STREAM",
            assetpresentation: "FULL",
        }, sessionId);
    }

    public async getVideoPlaybackInfo(id: string, videoQuality: string = "HIGH"): Promise<any> {
        return this.fetch(`/videos/${id}/playbackinfo`, {
            videoquality: videoQuality,
            playbackmode: "STREAM",
            assetpresentation: "FULL",
        });
    }

    public async getVideoPlaybackInfoPostPaywall(id: string, videoQuality: string = "HIGH", sessionId?: string): Promise<any> {
        return this.fetch(`/videos/${id}/playbackinfopostpaywall`, {
            videoquality: videoQuality,
            playbackmode: "STREAM",
            assetpresentation: "FULL",
        }, sessionId);
    }

    public getImageUrl(uuid: string, width: number = 640, height: number = 640): string | null {
        if (!uuid) return null;
        if (uuid.startsWith("http")) return uuid;
        const path = uuid.replace(/-/g, "/");
        return `https://resources.tidal.com/images/${path}/${width}x${height}.jpg`;
    }

    public cleanMetadata(item: any): any {
        if (!item || typeof item !== 'object') return item || {};

        // Handle Tidal's wrapped items (e.g. in playlists)
        if (item.item && typeof item.item === 'object' && item.type) {
            const cleanedInner = this.cleanMetadata(item.item);
            return { ...item, ...cleanedInner, item: cleanedInner };
        }

        // Ensure IDs are consistent
        if (item.uuid && !item.id) item.id = item.uuid;
        if (!item.id && item.id !== 0) item.id = 0;

        // Resolve Artwork
        if (item.cover && !item.artwork) item.artwork = this.getImageUrl(item.cover);
        if (item.picture && !item.artwork) item.artwork = this.getImageUrl(item.picture);
        if (item.image && !item.artwork) item.artwork = this.getImageUrl(item.image);
        if (item.imageId && !item.artwork) item.artwork = this.getImageUrl(item.imageId);

        // Clean Nested Album
        if (item.album && typeof item.album === 'object') {
            item.album = this.cleanMetadata(item.album);
            if (!item.artwork && item.album.artwork) item.artwork = item.album.artwork;
        }

        // Clean Artists
        if (Array.isArray(item.artists)) {
            item.artists = item.artists.map((a: any) => this.cleanMetadata(a));
        } else if (item.artist && typeof item.artist === 'object') {
            const cleanedArtist = this.cleanMetadata(item.artist);
            item.artists = [cleanedArtist];
            item.artist = cleanedArtist;
        } else {
            item.artists = item.artists || [];
        }

        // Default critical fields to avoid nulls
        item.title = item.title || item.name || "Unknown";
        item.name = item.name || item.title || "Unknown";
        item.duration = item.duration || 0;
        item.isrc = item.isrc || "";
        item.explicit = !!item.explicit;

        // Ensure artists is at least an empty array with one "Unknown" entry if missing
        if (!item.artists || item.artists.length === 0) {
            item.artists = [{ id: 0, name: "Unknown Artist", artwork: null }];
        }

        if (!item.album) {
            item.album = { id: 0, title: "Unknown Album", artwork: null };
        }

        return item;
    }

    public cleanModule(module: any): any {
        if (!module || typeof module !== 'object') return module;
        if (module.items && Array.isArray(module.items)) {
            module.items = module.items.map((i: any) => this.cleanMetadata(i));
        }
        if (module.pagedList && module.pagedList.items) {
            module.pagedList.items = module.pagedList.items.map((i: any) => this.cleanMetadata(i));
        }
        return module;
    }

    public cleanPageData(data: any): any {
        if (!data || typeof data !== 'object') return data;
        if (data.rows && Array.isArray(data.rows)) {
            data.rows = data.rows.map((row: any) => {
                if (row.modules && Array.isArray(row.modules)) {
                    row.modules = row.modules.map((m: any) => this.cleanModule(m));
                }
                return row;
            });
        }
        return data;
    }
}

export const tidal = new TidalAPI();
