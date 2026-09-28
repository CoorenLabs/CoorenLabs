import { env } from "./runtime";

const int = (value: string | undefined, fallback: number) => {
  const parsed = parseInt(value ?? "", 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const PORT = int(env.PORT, 3000);
export const NODE_ENV = env.NODE_ENV || "development";
export const LOG_LEVEL = (env.LOG_LEVEL || "info").toLowerCase();
export const SERVER_ORIGIN = (env.SERVER_ORIGIN || "").replace(/\/+$/, "");

export const CORS_ORIGIN = env.CORS_ORIGIN || "*";
export const CORS_CREDENTIALS = env.CORS_CREDENTIALS === "true";

export const OPENAPI_ENABLED = env.OPENAPI_ENABLED !== "false";
export const OPENAPI_VERSION = env.OPENAPI_VERSION || "3.0.0";

export const ANILIST_SPOTLIGHT_IDS = (env.ANILIST_SPOTLIGHT_IDS || "")
  .split(",")
  .map((id) => parseInt(id, 10))
  .filter((id) => !Number.isNaN(id));

export const DATABASE_URL = env.DATABASE_URL;
export const REMAP_REFRESH_INTERVAL = int(env.REMAP_REFRESH_INTERVAL, 600_000);

export function validateConfig() {
  if (PORT <= 0 || PORT > 65_535) throw new Error(`Invalid PORT: ${env.PORT}`);
  if (!SERVER_ORIGIN && NODE_ENV !== "test") throw new Error("SERVER_ORIGIN must be set");
}
