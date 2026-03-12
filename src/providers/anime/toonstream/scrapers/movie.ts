import * as cheerio from "cheerio";
import { Cache } from "../lib/cache";
import { MOVIE_IFRAMES_TTL, TOONSTREAM_BASE } from "../lib/const";
import { AnimeCard, Cast, Genre, Tag } from "../lib/types";
import { getDirectSources, getPlayerIframeUrls } from "./source";

export async function ScrapeMovies(page: number = 1) {
    const url = TOONSTREAM_BASE + "/movies/" + (page == 1 ? "" : `page/${page}/`)
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch " + url);


        const html = await res.text();
        const $ = cheerio.load(html, { xml: true });

        const data: AnimeCard[] = [];

        const sect = $("main section.movies").first();
        $(sect).find(".aa-cn ul li").each((_, item) => {
            const title = $(item).find("article header h2.entry-title").text()
            const url = $(item).find("article a").attr("href") || "";
            const poster = $(item).find("article .post-thumbnail img").attr("src") || "";

            if (!url || !poster) return;

            const type = url.startsWith(TOONSTREAM_BASE + "/series") ? "series" : "movie";
            const tmdbRating = Number($(item).find("article header .vote").text().replace("TMDB", "").trim());
            const slug = url.split("/").reverse()[1];

            data.push({ type, title, slug, poster, url, tmdbRating })
        });

        // pagination 
        const start = 1;
        const current = page;
        const end = Number($("nav.pagination a.page-link").last().text() || 1);

        const pagination = { current, start, end }
        return { pagination, data };

    } catch (err) {
        console.log("ERROR", err);
    }
}



export async function ScrapeMovieInfo(slug: string) {
    // if (url.startsWith("http") && !url.startsWith(TOONSTREAM_BASE)) return; // avoid urls other than toonstream's

    // const decodedURL = url.startsWith("http") ? decodeURIComponent(url) : `${TOONSTREAM_BASE}/movies/${url}`; // url or slug
    const decodedURL = `${TOONSTREAM_BASE}/movies/${slug}/`; // slug only

    console.log("Fetching", decodedURL)

    try {
        const res = await fetch(decodedURL);
        if (!res.ok) throw new Error("Failed to fetch " + decodedURL);

        const html = await res.text();
        const $ = cheerio.load(html, { xml: true });

        // basic info
        const article = $("#aa-wp article.single")

        const title = $(article).find("header .entry-title").text();

        // if title not found return no data
        if (!title) throw new Error("title not found for " + decodedURL);

        const year = $(article).find("header .entry-meta .year").text();
        const duration = $(article).find("header .entry-meta .duration").text();

        const $paragraphs = $(article).find(".description p");
        const description = $paragraphs.eq(0).text();
        const languages = $paragraphs.eq(1).text().replace("Language:", "").trim().split("–").filter(Boolean).map(e => e.trim());
        const qualities = $paragraphs.eq(2).text().replace("Quality:", "").trim().split("|").filter(Boolean).map(e => e.trim());

        const tmdbRating = Number($(article).find("footer .vote-cn span.num").text());

        const genres: Genre[] = [];
        const tags: Tag[] = [];
        const casts: Cast[] = [];

        $(article).find("header span.genres a").each((_, elem) => {
            const name = $(elem).text();
            const url = $(elem).attr("href");

            const urlSplits = url?.split("/").reverse() || [];
            const slug = urlSplits[0] || urlSplits[1];

            if (!url || !slug) return;
            genres.push({ name, slug, url })
        })

        $(article).find("header span.tag a").each((_, elem) => {
            const name = $(elem).text();
            const url = $(elem).attr("href");

            if (!url) return;
            tags.push({ name, url })
        })

        $(article).find(".cast-lst a").each((_, elem) => {
            const name = $(elem).text();
            const url = $(elem).attr("href");

            if (!url) return;
            casts.push({ name, url })
        })

        return {
            title, year, tmdbRating,
            description, languages, qualities, duration,
            genres, tags, casts
        }
    } catch (err) {
        console.log("ERROR", err);
    }
}

export async function ScrapeMovieSources(slug: string) {
    const url = `${TOONSTREAM_BASE}/movies/${slug}/`; // slug only

    console.log("Fetching", url)

    const key = `movie:iframes:${slug}`;
    const cachedIframes = await Cache.get(key, true);

    if (cachedIframes) {
        const directSources = await getDirectSources(cachedIframes);
        return {
            embeds: cachedIframes,
            sources: directSources
        };
    }

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch " + url);

        const html = await res.text();
        const $ = cheerio.load(html, { xml: true });

        const toonStreamIframeUrls = $("aside#aa-options iframe").map((_, el) => $(el).attr("data-src")).get();

        const playerIframeUrls = await getPlayerIframeUrls(toonStreamIframeUrls);
        Cache.set(key, true, playerIframeUrls, MOVIE_IFRAMES_TTL);

        const directSources = await getDirectSources(playerIframeUrls);

        return {
            embeds: playerIframeUrls,
            sources: directSources
        };

    } catch (err) {
        console.log("ERROR", err);
    }
}


