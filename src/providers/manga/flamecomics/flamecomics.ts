import { fetcher } from "../../../core/lib/fetcher";

const BASE_URL = "https://flamecomics.xyz";
const CDN_BASE = "https://cdn.flamecomics.xyz/uploads/images";

export class FlameComicsParser {
  private async fetch(route: string): Promise<any> {
    const homepage = await fetcher(`${BASE_URL}/`, true, "flamecomics");
    if (!homepage || !homepage.success) throw new Error("Failed to fetch homepage");

    const match = homepage.text.match(/"buildId"\s*:\s*"([^"]+)"/);
    if (!match) throw new Error("Could not extract buildId");

    const buildId = match[1];
    const url = `${BASE_URL}/_next/data/${buildId}${route}.json`;

    const response = await fetcher(url, true, "flamecomics");
    if (!response || !response.success) throw new Error(`Failed to fetch data for ${route}`);

    return JSON.parse(response.text).pageProps;
  }

  async search(query: string): Promise<any> {
    try {
      const data = await this.fetch("/latest");
      const allSeries = (data.allSeries || data.series || []).concat(
        (data.latestEntries?.blocks || []).flatMap((b: any) => b.series || []),
      );

      return allSeries
        .filter((s: any) => s.title?.toLowerCase().includes(query.toLowerCase()))
        .map((s: any) => ({
          id: String(s.series_id || s.id),
          title: s.title,
          cover: s.cover
            ? `${BASE_URL}/_next/image?url=${CDN_BASE}/series/${s.series_id || s.id}/${s.cover}&w=1920&q=75`
            : null,
          url: `${BASE_URL}/series/${s.series_id || s.id}`,
        }));
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async getMangaDetail(id: string): Promise<any> {
    try {
      const data = await this.fetch(`/series/${id}`);
      const series = data.series;
      if (!series) return null;

      return {
        id: String(series.series_id || id),
        title: series.title,
        description: series.description,
        cover: series.cover
          ? `${BASE_URL}/_next/image?url=${CDN_BASE}/series/${series.series_id}/${series.cover}&w=1920&q=75`
          : null,
        chapters: (data.chapters || []).map((ch: any) => ({
          chapter_id: ch.chapter_id,
          chapter: ch.chapter,
          title: ch.title,
          token: ch.token,
          releaseDate: ch.release_date || null,
          url: ch.token ? `${BASE_URL}/series/${series.series_id || id}/${ch.token}` : null,
        })),
      };
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async getMangaChapter(mangaId: string, token: string): Promise<any> {
    try {
      const url = `${BASE_URL}/series/${mangaId}/${token}`;
      const response = await fetcher(url, true, "flamecomics");
      if (!response || !response.success) throw new Error("Failed to fetch chapter page");

      const scriptMatch = response.text.match(
        /<script\s+id="__NEXT_DATA__"\s+type="application\/json"[^>]*>([\s\S]*?)<\/script>/,
      );
      if (!scriptMatch) throw new Error("Could not find __NEXT_DATA__ in page");

      const jsonData = JSON.parse(scriptMatch[1]);
      const pageProps = jsonData?.props?.pageProps;
      const chapter = pageProps?.chapter;
      const chapterList: any[] = pageProps?.chapterList || [];

      if (!chapter) return null;

      // Build image URLs from chapter.images object (keys are page numbers)
      const images: string[] = Object.entries(chapter.images || {})
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([, img]: [string, any]) => {
          const name = typeof img === "string" ? img : img?.name || "";
          return `${CDN_BASE}/series/${mangaId}/${token}/${name}?${chapter.edit_time}`;
        })
        .filter(Boolean);

      // Determine prev/next tokens
      let prevToken: string | null = chapter.previous || null;
      let nextToken: string | null = chapter.next || null;

      if ((!prevToken || !nextToken) && Array.isArray(chapterList) && chapter.token) {
        const currentIndex = chapterList.findIndex(
          (ch: any) => String(ch.token) === String(chapter.token),
        );
        if (currentIndex !== -1) {
          if (!prevToken && chapterList[currentIndex + 1])
            prevToken = chapterList[currentIndex + 1].token;
          if (!nextToken && chapterList[currentIndex - 1])
            nextToken = chapterList[currentIndex - 1].token;
        }
      }

      return {
        series_id: chapter.series_id,
        chapter_id: chapter.chapter_id,
        chapter: chapter.chapter,
        title: chapter.title || "",
        language: chapter.language,
        token: chapter.token,
        release_date: chapter.release_date,
        images,
        prevChapter: prevToken
          ? `${BASE_URL}/series/${chapter.series_id || mangaId}/${prevToken}`
          : null,
        nextChapter: nextToken
          ? `${BASE_URL}/series/${chapter.series_id || mangaId}/${nextToken}`
          : null,
        prevToken,
        nextToken,
      };
    } catch (err) {
      console.error(err);
      return null;
    }
  }
}

export const flamecomics = new FlameComicsParser();
