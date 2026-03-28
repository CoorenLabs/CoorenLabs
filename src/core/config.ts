/**
 * Environment-based configuration for Cooren API
 * All configurations are sourced from environment variables with sensible defaults
 */

// Server Configuration
export const PORT = parseInt(process.env.PORT || "3000", 10);
export const NODE_ENV = process.env.NODE_ENV || "development";

// Domain Masking Configuration
export const CUSTOM_DOMAIN = process.env.CUSTOM_DOMAIN || "localhost:3000";

// Provider Configuration
// Logging Configuration
export const LOG_LEVEL = process.env.LOG_LEVEL || "info";

// Rate Limiting Configuration
export const RATE_LIMIT_PER_MINUTE = parseInt(process.env.RATE_LIMIT_PER_MINUTE || "100", 10);
export const ENABLE_RATE_LIMITING = process.env.ENABLE_RATE_LIMITING === "true";

// Proxy Configuration
export const PROXY_TIMEOUT_MS = parseInt(process.env.PROXY_TIMEOUT_MS || "30000", 10);
export const PROXY_MAX_RETRIES = parseInt(process.env.PROXY_MAX_RETRIES || "3", 10);

// CORS Configuration
export const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
export const CORS_CREDENTIALS = process.env.CORS_CREDENTIALS === "true";

// OpenAPI Configuration
export const OPENAPI_ENABLED = process.env.OPENAPI_ENABLED !== "false";
export const OPENAPI_VERSION = process.env.OPENAPI_VERSION || "3.0.0";

// Security Configuration  
export const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT || "60000", 10);


// proxy confs
export const SERVER_ORIGIN = process.env.SERVER_ORIGIN;

export const SHOW_PROXIED_URL = process.env.SHOW_PROXIED_URL == "true";

// Production mode check
export const IS_PRODUCTION = NODE_ENV === "production";
export const IS_DEVELOPMENT = NODE_ENV === "development";

// Validation function for required environment variables
export function validateConfig(): void {
  const required = [
    { key: "PORT", value: PORT },
    { key: "CUSTOM_DOMAIN", value: CUSTOM_DOMAIN },
  ];

  const missing = required.filter(({ value }) => !value);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.map(({ key }) => key).join(", ")}`
    );
  }

  if (IS_PRODUCTION && CUSTOM_DOMAIN.includes("localhost")) {
    console.warn("⚠️  WARNING: Using localhost domain in production mode");
  }
}

