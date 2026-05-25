import { neon } from "@neondatabase/serverless";
import { DATABASE_URL, REMAP_REFRESH_INTERVAL } from "./config";
import { Logger } from "./logger";

export interface RemapRow {
  anilist_id: number;
  name?: string;
  logo?: string;
  banner?: string;
  description?: string;
  banner_image?: string; // fallback for ani.zip images
  clear_logo?: string; // fallback for ani.zip images
  [key: string]: any;
}

class RemapManager {
  private remaps: Record<number, RemapRow> = {};
  private sql = DATABASE_URL ? neon(DATABASE_URL) : null;
  private interval: Timer | null = null;

  /**
   * Start the remap loader. Fetches initially and then periodically.
   */
  public async init() {
    if (!this.sql) {
      Logger.warn("[RemapManager] No DATABASE_URL provided. Remapping disabled.");
      return;
    }

    await this.loadRemaps();

    // Refresh every X minutes
    this.interval = setInterval(() => {
      this.loadRemaps();
    }, REMAP_REFRESH_INTERVAL);

    Logger.info(`[RemapManager] Initialized with refresh interval of ${REMAP_REFRESH_INTERVAL}ms`);
  }

  /**
   * Fetch remaps from the database and update the cache.
   */
  private async loadRemaps() {
    if (!this.sql) return;

    try {
      const data = (await this.sql`SELECT * FROM remaps`) as RemapRow[];
      const newRemaps: Record<number, RemapRow> = {};

      data.forEach((row) => {
        newRemaps[row.anilist_id] = row;
      });

      this.remaps = newRemaps;
      Logger.info(`[RemapManager] Loaded ${Object.keys(this.remaps).length} remaps from DB`);
    } catch (err) {
      Logger.error(`[RemapManager] Error loading remaps: ${String(err)}`);
    }
  }

  /**
   * Get remap data for a specific AniList ID.
   */
  public getRemap(anilistId: number | string): RemapRow | undefined {
    const id = typeof anilistId === "string" ? parseInt(anilistId, 10) : anilistId;
    return this.remaps[id];
  }

  /**
   * Stop the refresh interval.
   */
  public stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

export const remapManager = new RemapManager();
