import * as cheerio from "cheerio";
import { TOONSTREAM_BASE } from "../lib/const";
import { AnimeCard } from "../lib/types";

export async function ScrapeSearch(query: string, page: number = 1) {
    const url =
        `${TOONSTREAM_BASE}/home/${(page == 1 ? "" : `page/${page}/`)}?s=${decodeURIComponent(query).replaceAll(" ", "+")}`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch " + url);

        const html = await res.text();
        const $ = cheerio.load(html, { xml: true });

        const data: AnimeCard[] = [];

        const sect = $("main section.movies").first();

        $(sect).find(".aa-cn ul li").each((_, item) => {
            const url = $(item).find("article a").attr("href") || "";
            const poster = $(item).find("article .post-thumbnail img").attr("src") || "";

            if (!url || !poster) return;

            const type = url.startsWith(TOONSTREAM_BASE + "/series") ? "series" : "movie";
            const title = $(item).find("article header h2.entry-title").text()
            const tmdbRating = Number($(item).find("article header .vote").text().replace("TMDB", "").trim());
            const slug = url.split("/").reverse()[1];

            data.push({ type, title, slug, poster, url, tmdbRating })
        });

        // pagination 
        const start = 1;
        const current = page;
        const end = Number($("nav.pagination a.page-link").last().text() || 1);

        const pagination = { current, start, end }
        return { query, pagination, data };

    } catch (err) {
        console.log("ERROR", err);
    }
}