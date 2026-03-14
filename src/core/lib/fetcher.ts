import { Cache } from "../cache";
import { Logger } from "../logger";
import { cf_captcha_status, cf_signatures, getCloudflareClearance } from "./cf-bypass";

type FetchResponse = {
  success: boolean,
  status: number,
  text: string
} | undefined

export type CfBypassCreds = {
  clearnaceCookieString: string, userAgent: string
}

const FALLBACK_CF_COOKIE_TTL = 2 * 3600; 
const CF_BYPASS_MAX_TRY = 3;

export const fetcher = async (input: string, detectCfCapcha: boolean, cachePrefix: string = "default", init: RequestInit = {}): Promise<FetchResponse> => {
  try {
    init = init || {};
    init.headers = init.headers || {};

    if (detectCfCapcha) {
      const cfCredsRaw: string | undefined | null = await Cache.get(`${cachePrefix}:cf-capcha:creds`);

      if (cfCredsRaw) {
        const { clearnaceCookieString, userAgent } = JSON.parse(cfCredsRaw);
        
        const headers = init.headers as Record<string, string>;
        // Use lowercase to standardize for Bun fetch
        headers["cookie"] = headers["cookie"] ? `${clearnaceCookieString}; ${headers["cookie"]}` : clearnaceCookieString;
        headers["user-agent"] = userAgent;
      }
    }

    const res = await fetch(input, init);
    const status = res.status;
    const text = await res.text();

    if (!res.ok) {
      Logger.warn(`[${cachePrefix}] Failed to fetch url:`, input, "\n", "Status:", status);

      if (detectCfCapcha && cf_captcha_status.includes(status)) {
        if (!cf_signatures.some(sig => text.includes(sig))) {
          Logger.info("CF capcha not detected!");
          return;
        }

        Logger.info(`[${cachePrefix}] Detected CF Capcha`);

        for (let i = 1; i <= CF_BYPASS_MAX_TRY; ++i) {
          Logger.info(`[${cachePrefix}] Bypassing CF Capcha - Try ${i}/${CF_BYPASS_MAX_TRY}`);

          const { success, allCookies, cfClearance, userAgent, ttl } = await getCloudflareClearance(input);

          if (success) {
            Logger.success(`[${cachePrefix}] Successfully bypassed CF capcha`);

            // Reverted back to your exact format with the semicolon
            const cookieCf = `cf_clearance=${cfClearance};`;
            const cfCredsToCache = JSON.stringify({ clearnaceCookieString: cookieCf, userAgent });
            
            Cache.set(`${cachePrefix}:cf-capcha:creds`, cfCredsToCache, ttl || FALLBACK_CF_COOKIE_TTL);

            const retryHeaders: Record<string, string> = {
              ...(init.headers as Record<string, string>),
              "cookie": cfClearance ? cookieCf : "",
              "user-agent": userAgent || ""
            };

            const data = await fetcher(input, false, cachePrefix, { ...init, headers: retryHeaders });

            if (data && data.status >= 200 && data.status <= 299) {
              return data;
            }
          }
        }

        Logger.error(`[${cachePrefix}] Failed to Bypass CF Capcha - returning`);
      }
    }

    return { success: true, status, text };

  } catch (err: unknown) {
    Logger.error(`[${cachePrefix}] Error occured while fetching url:`, input, err);
  }
};