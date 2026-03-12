export type AnimeCard = {
    type: "movie" | "series";
    slug: string;
    title: string;
    url: string;
    poster: string;
    tmdbRating: number;
}


export type Episode = {
    episode_no: number;
    slug: string;
    title: string;
    epXseason: string;
    url: string;
    thumbnail: string;
    ago?: string; // not available on ajax - series info page
}
export type LastEpisode = {
    slug: string;
    title: string;
    epXseason: string;
    url: string;
    thumbnail: string;
    ago: string;
}

export type Season = {
    label: string,
    season_no: number,
    episodes: Episode[]
}

export type Genre = {
    name: string;
    slug: string;
    url: string;
}

export type Tag = {
    name: string;
    url: string;
}

export type Cast = {
    name: string;
    url: string;
}

export type SidebarSection = {
    label: string;
    data: AnimeCard[]
}

export type MainSection = {
    label: string;
    viewMore?: string
    data: AnimeCard[]
}


export type DirectSource = {
    label?: string;
    type: "hls" | "mp4",
    url: string;
    cover?: string;
    thumbnail?: string;
    subtitles?: {
        label: string;
        flag?: string;
        url: string;
    }
    headers?: Record<string, string>,
    proxiedUrl?:string
};

export type TResponse = {
    success: boolean;
    msg?: string;
    served_cache?: boolean;
    took_ms: number;
}
export interface HomeResponse extends TResponse {

}

export interface MovieInfoResponse extends TResponse {
    data?: {
        title: string;
        year: string;
        tmdbRating: number;
        description: string;
        languages?: string[];
        qualities?: string[];
        duration: string;
        genres: Genre[];
        tags: Tag[];
        casts: Cast[];
    }
}

export interface SeriesInfoResponse extends TResponse {
    data?: {
        title: string;
        year: string;
        tmdbRating: number;
        totalSeasons: number;
        totalEpisodes: number;
        description: string;
        languages?: string[];
        qualities?: string[];
        runtime?: string;
        genres: Genre[];
        tags: Tag[];
        casts: Cast[];
        seasons: Season[];
    }
}


