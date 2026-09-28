import { neon } from "@neondatabase/serverless";
import { DATABASE_URL, REMAP_REFRESH_INTERVAL } from "./config";
import { Logger } from "./logger";

type RemapRow = {
  anilist_id: number;
  name?: string;
  logo?: string;
  banner?: string;
  description?: string;
  poster?: string;
  banner_image?: string;
  clear_logo?: string;
  [key: string]: any;
};

class RemapManager {
  private remaps = new Map<number, RemapRow>();
  private readonly sql = DATABASE_URL ? neon(DATABASE_URL) : null;

  async init() {
    if (!this.sql) {
      Logger.warn("[RemapManager] DATABASE_URL is not set; remapping is disabled");
      return;
    }
    await this.load();
    setInterval(() => void this.load(), REMAP_REFRESH_INTERVAL);
    Logger.info(`[RemapManager] Refreshing every ${REMAP_REFRESH_INTERVAL}ms`);
  }

  private async load() {
    try {
      const rows = (await this.sql!`SELECT * FROM remaps`) as RemapRow[];
      this.remaps = new Map(rows.map((row) => [Number(row.anilist_id), row]));
      Logger.info(`[RemapManager] Loaded ${this.remaps.size} remaps`);
    } catch (err) {
      Logger.error(`[RemapManager] Failed to load remaps: ${String(err)}`);
    }
  }

  getRemap(anilistId: number | string): RemapRow | undefined {
    return this.remaps.get(Number(anilistId));
  }
}

export const remapManager = new RemapManager();
