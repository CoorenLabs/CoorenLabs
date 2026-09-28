import { animelok as BASE_URL } from "../../../origins";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.6",
  "sec-ch-ua": '"Chromium";v="148", "Google Chrome";v="148", "Not:A-Brand";v="99"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
};

export async function animelokFetch(path: string, headers?: Record<string, string>) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: { ...HEADERS, ...headers } });
  if (!res.ok) throw new Error(`animelok responded ${res.status} for ${path}`);
  return res.text();
}
