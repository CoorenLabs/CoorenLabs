export const cf_capcha_status = [403, 503, 429]
export const cf_signatures = [
  'window._cf_chl_opt',             // Turnstile / JS Challenge config object
  '<title>Just a moment...</title>', // Modern default challenge title
  '<title>Attention Required! | Cloudflare</title>', // Legacy block title
  'id="challenge-form"',            // Hidden form used for token submission
  '__cf_chl_tk'                     // Token parameter in scripts/URLs
];

import { connect } from "puppeteer-real-browser";
import { Logger } from "../logger";

interface ClearanceResult {
  success: boolean;
  cfClearance?: string;
  userAgent?: string;
  ttl?: number;      
  allCookies?: any[]; 
  error?: string;
}

const TIMEOUT = 15_000; 

// Simple global variables to hold the warm browser and page
let browserInstance: any = null;
let pageInstance: any = null;

export async function getCloudflareClearance(targetUrl: string): Promise<ClearanceResult> {
  try {
    // 1. Cold start ONLY if the browser/page doesn't exist or somehow crashed
    if (!browserInstance || !pageInstance || pageInstance.isClosed()) {
      Logger.info("Cold start: Launching persistent browser...");
      
      // Cleanup just in case there's a zombie process
      if (browserInstance) await browserInstance.close().catch(() => {});
      
      const { browser, page } = await connect({
        headless: false,       
        turnstile: true,       
        disableXvfb: false,    
        ignoreAllFlags: false  
      });
      
      browserInstance = browser;
      pageInstance = page;
    }

    // 2. Just use the warm page to navigate directly
    Logger.info(`Navigating to ${targetUrl}...`);
    await pageInstance.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    Logger.info("Polling every 500ms for the cf_clearance cookie...");
    
    // 3. Extract the cookie and TTL
    const extractionData = await new Promise<{ cookies: any[], cfClearance: string, userAgent: string, ttl: number }>((resolve, reject) => {
      // eslint-disable-next-line prefer-const
      let checkInterval: NodeJS.Timeout;
      
      const timeoutId = setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error("Timeout: cf_clearance cookie never appeared."));
      }, TIMEOUT);

      checkInterval = setInterval(async () => {
        try {
          if (pageInstance.isClosed()) return;
          
          const cookies = await pageInstance.cookies();
          const cfCookie = cookies.find((c: any) => c.name === 'cf_clearance');
          
          if (cfCookie) {
            clearInterval(checkInterval);
            clearTimeout(timeoutId);
            
            let ttlSeconds = 3600; 
            if (cfCookie.expires) {
              const currentUnixTime = Math.floor(Date.now() / 1000);
              ttlSeconds = Math.floor(cfCookie.expires) - currentUnixTime;
              if (ttlSeconds <= 0) ttlSeconds = 3600; 
            }
            
            const userAgent = await pageInstance.evaluate((): string => navigator.userAgent);
            
            resolve({ 
              cookies, 
              cfClearance: cfCookie.value, 
              userAgent, 
              ttl: ttlSeconds 
            });
          }
        } catch (err) {
          // Suppress rapid-reload context errors
        }
      }, 500);
    });

    Logger.info(`Got the cookie! TTL is ${extractionData.ttl} seconds. Leaving browser idle.`);

    // NO FINALLY BLOCK. We don't close the tab or change the URL. 
    // We just leave it exactly as-is so it's perfectly ready for the next run.

    return {
      success: true,
      cfClearance: extractionData.cfClearance,
      userAgent: extractionData.userAgent,
      ttl: extractionData.ttl, 
      allCookies: extractionData.cookies
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error("Failed to bypass:", errorMessage);
    return { success: false, error: errorMessage };
  }
}