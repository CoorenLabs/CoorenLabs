import * as cheerio from "cheerio";
import { Logger } from "../../../core/logger";
import type { ContentFeatured, ContentTop10Card, Genre, MovieCard, TvCard } from "../types";

type Slider = {
    name: string,
    items: (MovieCard | TvCard)[]
}
type HomeData = {
    featured: ContentFeatured[],
    top10: ContentTop10Card[],
    recommended: {
        movies?: MovieCard[],
        tvs?: TvCard[]
    },
    // latest_movies: MovieCard[],
    // latest_series: 
    sliders: Slider[]
}

export function extractHomeData(html: string): HomeData {
    // extracting featured section
    const $ = cheerio.load(html, { xml: true }); // faster

    const featured: ContentFeatured[] = [];
    const top10: ContentTop10Card[] = [];
    const sliders: Slider[] = [];

    $("main section#featured .swiper-slide").each((_, node) => {
        const url = $(node).find("a.watch-btn").attr("href");
        if (!url) return;

        const id = url.split("/").reverse()[0];
        const title = $(node).find("p.title").text();
        const description = $(node).find("p.description").text();

        Logger.info("[featured]", id!, title);

        if (!id || !title) return;

        let imdbRate, quality, rating, runtime, year;
        const genres: Genre[] = []

        $(node).find("div.metadata span").each((_, node) => {
            const span = $(node)
            if (span.hasClass("IMDb")) {
                imdbRate = Number(span.text().replace("IMDb", "").trim());
                imdbRate = isNaN(imdbRate) ? 0 : imdbRate;
            }
            else if (span.hasClass("quality")) {
                quality = span.text();
            }
            else if (span.hasClass("ratingR")) {
                rating = span.text();
            }
            else {
                const txt = span.text();

                if (txt.endsWith("min")) {
                    runtime = txt;
                }
                else if (!isNaN(Number(txt))) {
                    year = txt;
                }
                else {
                    genres.push(txt);
                }
            }
        });

        if (!imdbRate || !quality || !runtime || !year) return;

        featured.push({ id, title, year, imdbRate, runtime, quality, genres })
    });


    $("main section.top10 .item.swiper-slide").each((_, node) => {
        const url = $(node).find("a.title").attr("href");
        if (!url) return;

        const id = url.split("/").reverse()[0];
        const title = $(node).find("a.title").text();
        const quality = $(node).find(".quality").text();

        if (!id || !title) return;

        top10.push({ id, title, quality })
    });


    // recommended
    const recommended_movies: MovieCard[] = [];
    const recommended_tvs: TvCard[] = [];

    $("main section:not([class]) .tab-body").each((_, slider) => {

        if ($(slider).attr("data-id") == "movie") {
            //movies  of recommended section

            $(slider).find(".item").each((_, item) => {
                const url = $(item).find("a.title").attr("href");

                if (!url) return;

                const id = url.split("/").reverse()[0];
                const title = $(item).find("a.title").text();
                const quality = $(item).find(".quality").text();

                const [__, year, runtime] = $(item).find(".metadata span").map((_, el) => $(el).text()).get();

                // Logger.info("[recommended movie]", id!, title, year, runtime);

                // Logger.info("TOTAL MOVIES", recommended_movies.length);

                if (!id || !year) return;

                recommended_movies.push({ id, type: "movie", title, year: +year, runtime, quality });
            })

        } else {
            //tvs  of recommended section
            $(slider).find(".item").each((_, item) => {
                const url = $(item).find("a.title").attr("href");

                if (!url) return;

                const id = url.split("/").reverse()[0];
                const title = $(item).find("a.title").text();
                const quality = $(item).find(".quality").text();

                // Logger.info("[recommended tv]", id!, title);

                const [__, season_count, latest_episode] = $(item).find(".metadata span").map((_, el) => +$(el).text().replace(/[^0-9]/g, "")).get();

                if (!id || !season_count || !latest_episode) return;

                recommended_tvs.push({ id, type: "tv", title, season_count, latest_episode, quality });
            })
        }

    });


    $("main section.slider").each((_, sli) => {

        const name = $(sli).find(".section-title").text();
        const sliderItems: (MovieCard | TvCard)[] = []

        $(sli).find(".swiper-slide").each((_, item) => {
            const url = $(item).find("a.title").attr("href");

            if (!url) return;

            const id = url.split("/").reverse()[0];
            const title = $(item).find("a.title").text();
            const quality = $(item).find(".quality").text();

            const [type, string2, string3] = $(item).find(".metadata span").map((_, el) => $(el).text()).get();

            if (!id || !type || !string2 || !string2) return;

            if (type == "Movie") {
                sliderItems.push({ id, type: "movie", title, year: +string2, runtime: string3, quality });
            } else {
                sliderItems.push({ id, type: "tv", title, season_count: +string2.replace(/[^0-9]/g, ""), latest_episode: +string2.replace(/[^0-9]/g, ""), quality });
            }
        })

        sliders.push({ name, items: sliderItems })
    })

    return {
        featured,
        top10,
        recommended: {
            movies: recommended_movies, tvs: recommended_tvs
        },
        sliders
    }
}