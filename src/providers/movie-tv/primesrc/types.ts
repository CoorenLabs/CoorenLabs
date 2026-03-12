export type Source = {
    url: string
    dub: string
    type: "hls" | "mp4"
    quality?: number
    sizeBytes?: number
    poster?: string;
    thumbnail?: string,
    headers?: Record<string, string>
}

export type Caption = {
    label: string,
    langCode?: string,
    url: string,
    delay: number,
    size?: number
}

export type ServerSource = {
    name: string;
    sources: Source[],
    subtitles?: Caption[]
}

export type Response<T> = {
    success: boolean;
    status: number;
    data?: T
}