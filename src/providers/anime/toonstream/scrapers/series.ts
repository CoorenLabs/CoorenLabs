import * as cheerio from "cheerio";
import { Cache } from "../lib/cache";
import { EPISODE_IFRAMES_TTL, TOONSTREAM_BASE } from "../lib/const";
import { AnimeCard, Cast, Episode, Genre, Season, Tag } from "../lib/types";
import { getDirectSources, getPlayerIframeUrls } from "./source";

export async function ScrapeSeries(page: number = 1) {
    const url = TOONSTREAM_BASE + "/series/" + (page == 1 ? "" : `page/${page}/`)
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


export async function ScrapeSeriesInfo(url: string) {
    // if (url.startsWith("http") && !url.startsWith(TOONSTREAM_BASE)) return; // avoid urls other than toonstream's

    // const decodedURL = url.startsWith("http") ? decodeURIComponent(url) : `${TOONSTREAM_BASE}/series/${url}`; // url or slug
    const decodedURL = `${TOONSTREAM_BASE}/series/${url}/`; // slug only
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
        const totalSeasons = Number($(article).find("header .entry-meta .seasons").text().replace("Seasons", "").trim());
        const totalEpisodes = Number($(article).find("header .entry-meta .episodes").text().replace("Episodes", "").trim());

        const $paragraphs = $(article).find(".description p");
        const description = $paragraphs.eq(0).text();
        const languages = $paragraphs.eq(1).text().replace("Language:", "").trim().split("–").filter(Boolean).map(e => e.trim());
        const qualities = $paragraphs.eq(2).text().replace("Quality:", "").trim().split("|").filter(Boolean).map(e => e.trim());
        const runtime = $paragraphs.eq(3).text().replace("Running time:", "").trim();

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


        // seasons
        const bodyClass = $("body").attr("class");
        const match = bodyClass?.match(/postid-(\d+)/) || [];
        const postId = match[1];

        if (!postId) throw new Error("postid not found for " + url);

        const seasons: Season[] = await getSeasonsByPostId(postId, 1, totalSeasons);

        return {
            title, year, tmdbRating,
            totalSeasons, totalEpisodes,
            description, languages, qualities, runtime,
            genres, tags, casts,
            seasons
        }
    } catch (err) {
        console.log("ERROR", err);
    }
} 

async function getSeasonsByPostId(postId: string, start_season: number, end_season: number) {
    const seasons: Season[] = [];

    for (let i = start_season; i <= end_season; i++) {
        const episodes: Episode[] = [];

        const res = await fetch(TOONSTREAM_BASE + "/home/wp-admin/admin-ajax.php", {
            "headers": {
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.9,hi;q=0.8,bn;q=0.7",
                "cache-control": "no-cache",
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                "pragma": "no-cache",
                "priority": "u=1, i",
                "sec-ch-ua": "\"Google Chrome\";v=\"143\", \"Chromium\";v=\"143\", \"Not A(Brand\";v=\"24\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-requested-with": "XMLHttpRequest",
            },
            "body": `action=action_select_season&season=${i}&post=${postId}`,
            "method": "POST"
        });

        if (!res.ok) {
            console.log("Error: failed to fetch season " + i + " episodes for postid-" + postId);
            continue;
        }

        const html = await res.text();
        const $ = cheerio.load(html, { xml: true });

        $("li").each((j, ep) => {
            const url = $(ep).find("a").attr("href");
            const thumbnail = $(ep).find("img").attr("src");
            
            if (!url || !thumbnail) return;
            
            const slug = url.split("/").reverse()[1];
            
            const title = $(ep).find("header h2.entry-title").text();
            const epXseason = $(ep).find("header .num-epi").text();

            episodes.push({ episode_no: j + 1, slug, title, url, epXseason, thumbnail })
        })

        seasons.push({
            label: `Season ${i}`,
            season_no: i,
            episodes
        })
    }

    return seasons;

}

export async function ScrapeEpisodeSources(slug: string) {
    const url = `${TOONSTREAM_BASE}/episode/${slug}/`;

    const key = `episode:iframes:${slug}`;
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
        Cache.set(key, true, playerIframeUrls, EPISODE_IFRAMES_TTL);

        const directSources = await getDirectSources(playerIframeUrls);

        return {
            embeds: playerIframeUrls,
            sources: directSources
        };

    } catch (err) {
        console.log("ERROR", err);
    }
}


