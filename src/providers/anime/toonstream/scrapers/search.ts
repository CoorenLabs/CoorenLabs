import { scrapeListing } from "../lib/parse";

export async function ScrapeSearch(query: string, page = 1) {
  const params = new URLSearchParams({ q: query, page: String(page) });
  return { query, ...(await scrapeListing(`/s?${params}`, page)) };
}
