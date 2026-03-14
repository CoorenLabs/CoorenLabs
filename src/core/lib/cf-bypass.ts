export const cf_captcha_status = [403, 503, 429];
export const cf_signatures = [
  'window._cf_chl_opt',
  '<title>Just a moment...</title>',
  '<title>Attention Required! | Cloudflare</title>',
  'id="challenge-form"',
  '__cf_chl_tk'
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

let browserInstance: any = null;
let pageInstance: any = null;

let bypassQueue: Promise<void> = Promise.resolve();

export async function getCloudflareClearance(targetUrl: string): Promise<ClearanceResult> {
  let releaseLock: () => void;
  const nextInLine = new Promise<void>(resolve => { releaseLock = resolve; });
  
  const waitForPrevious = bypassQueue;
  bypassQueue = bypassQueue.then(() => nextInLine);

  await waitForPrevious;

  try {
    if (!browserInstance || !browserInstance.isConnected() || !pageInstance || pageInstance.isClosed()) {
      Logger.info("Cold start: Launching persistent browser...");
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

    Logger.info(`Navigating to ${targetUrl}...`);
    await pageInstance.goto(targetUrl, { waitUntil: 'domcontentloaded' });

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
          
          // THE REAL FIX: Ignore the stale cookie while the CF challenge is still rendering
          const title = await pageInstance.evaluate(() => document.title).catch(() => "");
          if (title.includes('Just a moment') || title.includes('Cloudflare') || title.includes('Attention Required')) {
            return; // Keep looping, do not resolve yet
          }

          const cookies = await pageInstance.cookies();
          const cfCookie = cookies.find((c: any) => c.name === 'cf_clearance');
          
          if (cfCookie) {
            let userAgent = "";
            try {
              userAgent = await pageInstance.evaluate((): string => navigator.userAgent);
            } catch (err) {
              return; 
            }

            clearInterval(checkInterval);
            clearTimeout(timeoutId);
            
            let ttlSeconds = 3600; 
            if (cfCookie.expires && cfCookie.expires > 0) {
              const currentUnixTime = Math.floor(Date.now() / 1000);
              ttlSeconds = Math.floor(cfCookie.expires) - currentUnixTime;
              if (ttlSeconds <= 0) ttlSeconds = 3600; 
            }
            
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
      }, 50); 
    });

    Logger.info(`Got the cookie! TTL is ${extractionData.ttl} seconds.`);

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
  } finally {
    releaseLock!(); 
  }
}