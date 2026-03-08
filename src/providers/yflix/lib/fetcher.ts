import { Logger } from "../../../core/logger";
import { cf_capcha_status, cf_signatures, getCloudflareClearance } from "./cf-bypass";


type FetchResponse = {
  status: number,
  text: string
} | undefined

const CF_BYPASS_MAX_TRY = 3;

export const fetcher = async (input: string, detectCfCapcha: boolean, init: RequestInit = {}): Promise<FetchResponse> => {
  // for flexibility, we can do
  try {
    const res = await fetch(input, init);
    const status = res.status;

    if (!res.ok) {
      Logger.warn("[yFlix] Failed to fetch url:", input, "\n", "Status:", status);

      if (detectCfCapcha && cf_capcha_status.includes(status)) {
        const text = await res.text();
        if (!cf_signatures.some(sig => text.includes(sig))) return; // return if doesnt match to any cf capcha signatures

        Logger.info("[yFlix] Detected CF Capcha");

        for (let i = 1; i <= CF_BYPASS_MAX_TRY; ++i) {
          Logger.info(`[yFlix] Bypasinng CF Capcha- Try ${i}/${CF_BYPASS_MAX_TRY}`);

          const { success, allCookies, cfClearance, userAgent } = await getCloudflareClearance(input);

          if (success) {
            Logger.success("[yFlix] Successfully bypassed CF capcha");
            console.log(cfClearance, userAgent);

            const headers = {
              "Cookie": `cf_clearance=${cfClearance};` || "",
              "User-Agent": userAgent || ""
            }

            const data = await fetcher(input, false, { headers });

            if (data && data.status >= 200 && data.status <= 299) {
              return data;
            }

          }

        }

        Logger.error(`[yFlix] Failed to  Bypass CF Capcha - returning`);

      }

    }
    const text = await res.text();

    return { status, text };

  } catch (err: unknown) {
    Logger.error("[yFlix] Error occured while fetching url:", input);
  }
};
