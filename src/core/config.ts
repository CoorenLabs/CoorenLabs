import { env } from "./runtime";

const port = parseInt(env.PORT ?? "", 10);

export const PORT = Number.isNaN(port) ? 3000 : port;
export const NODE_ENV = env.NODE_ENV || "development";
export const LOG_LEVEL = (env.LOG_LEVEL || "info").toLowerCase();
export const SERVER_ORIGIN = (env.SERVER_ORIGIN || `http://localhost:${PORT}`).replace(/\/+$/, "");

export const CORS_ORIGIN = env.CORS_ORIGIN || "*";
export const CORS_CREDENTIALS = env.CORS_CREDENTIALS === "true";

export function validateConfig() {
  if (PORT <= 0 || PORT > 65_535) throw new Error(`Invalid PORT: ${env.PORT}`);
  if (NODE_ENV === "production" && !env.SERVER_ORIGIN) {
    throw new Error("SERVER_ORIGIN must be set in production");
  }
}
