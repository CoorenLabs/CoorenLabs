import * as cheerio from "cheerio";
import { SearchResult } from "../types";

export const extractSearchData = (html: string) => {
    const $ = cheerio.load(html, { xml: true }); // use htmlparser2 for performance

    const searchResults: SearchResult[] = [];

    $("main .film-section .item").each((_, element) => {
        const item = $(element);
        const type = item.find(".info .metadata span").first().text();

        if (!type) return; // continue 

        const quality = item.find(".quality").text();
        const a = item.find(".info a").first();
        const url = a.attr("href");
        const id = url.split("/").reverse()[0];
        const title = a.text();

        // console.log(id, title)

        if (!id || !title) return;

        if (type == "Movie") {
            // extract for movie
            const [_, year, runtime] = item.find(".info .metadata span").get().map(el => $(el).text())
            searchResults.push({
                type: "movie",
                id,
                title,
                quality,
                runtime,
                year: +year
            })
        } else {
            // extract for tv
            const [_, total_seasons, latest_episode] = item.find(".info .metadata span").get().map(el => +$(el).text().replace(/[^0-9]/g, ''))
            searchResults.push({
                type: "tv",
                id,
                title,
                quality,
                season_count: total_seasons,
                latest_episode,
            })
        }
    })

    return searchResults;
}