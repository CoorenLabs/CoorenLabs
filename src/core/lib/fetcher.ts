import { Cache } from "../cache";
import { Logger } from "../logger";
import { cf_capcha_status, cf_signatures, getCloudflareClearance } from "./cf-bypass";


type FetchResponse = {
  success: boolean,
  status: number,
  text: string
} | undefined

export type CfBypassCreds = {
  clearnaceCookieString: string, userAgent: string
}

const CF_COOKIE_TTL = 2 * 3600; // 2hr

const CF_BYPASS_MAX_TRY = 3;

export const fetcher = async (input: string, detectCfCapcha: boolean, cachePrefix: string = "default", init: RequestInit = {}): Promise<FetchResponse> => {
  // for flexibility, we can do
  try {

    if (detectCfCapcha) {
      const cfCredsRaw: string | undefined | null = await Cache.get(`${cachePrefix}:cf-capcha:creds`);

      if (cfCredsRaw) {
        const { clearnaceCookieString, userAgent } = JSON.parse(cfCredsRaw);

        init = init || {};
        init.headers = init.headers || {};

        init.headers["cookie"] = init.headers["cookie"] ? clearnaceCookieString + ";" + init.headers["cookie"] : clearnaceCookieString;
        init.headers["user-agent"] = userAgent;
      }
    }

    const res = await fetch(input, init);
    const status = res.status;

    if (!res.ok) {
      Logger.warn("[primsrc] Failed to fetch url:", input, "\n", "Status:", status);

      if (detectCfCapcha && cf_capcha_status.includes(status)) {
        const text = await res.text();
        if (!cf_signatures.some(sig => text.includes(sig))) {
          Logger.info("CF capcha not detected!")
          return;
        }  // return if doesnt match to any cf capcha signatures

        Logger.info("[primsrc] Detected CF Capcha");

        for (let i = 1; i <= CF_BYPASS_MAX_TRY; ++i) {
          Logger.info(`[primsrc] Bypasinng CF Capcha- Try ${i}/${CF_BYPASS_MAX_TRY}`);

          const { success, allCookies, cfClearance, userAgent } = await getCloudflareClearance(input);

          if (success) {
            Logger.success("[primsrc] Successfully bypassed CF capcha");

            const cookieCf = `cf_clearance=${cfClearance};`;

            const cfCredsToCache = JSON.stringify({ clearnaceCookieString: cookieCf, userAgent })
            console.log(cfCredsToCache)
            Cache.set(`${cachePrefix}:cf-capcha:creds`, cfCredsToCache, CF_COOKIE_TTL); // dont await for non-blocking

            const headers = {
              "Cookie": cfClearance ? cookieCf : "",
              "User-Agent": userAgent || ""
            }

            const data = await fetcher(input, false, cachePrefix, { headers });

            if (data && data.status >= 200 && data.status <= 299) {
              return data;
            }

          }

        }

        Logger.error(`[primsrc] Failed to  Bypass CF Capcha - returning`);

      }
    }

    const text = await res.text();

    return { success: true, status, text };

  } catch (err: unknown) {
    Logger.error("[primsrc] Error occured while fetching url:", input, err);
  }
};
