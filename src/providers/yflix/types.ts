export const MEDIA_TYPES = ["Movie", "TV-Shows"] as const;
export const QUALITIES = ["HD", "HDrip", "SD", "TS", "CAM"] as const;

export const RELEASE_YEARS = [
  "2026",
  "2025",
  "2024",
  "2023",
  "2022",
  "2021",
  "2020",
  "2019",
  "2018",
  "2017",
  "2016",
  "Older",
] as const;

export const GENRES = [
  "Action",
  "Adult",
  "Adventure",
  "Animation",
  "Biography",
  "Comedy",
  "Costume",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "Film-Noir",
  "Game-Show",
  "History",
  "Horror",
  "Kungfu",
  "Music",
  "Musical",
  "Mystery",
  "News",
  "Reality",
  "Reality-TV",
  "Romance",
  "Sci-Fi",
  "Science Fiction",
  "Short",
  "Sport",
  "Talk",
  "Talk-Show",
  "Thriller",
  "TV Movie",
  "TV Show",
  "War",
  "War & Politics",
  "Western",
] as const;

export const COUNTRIES = [
  "Argentina",
  "Australia",
  "Austria",
  "Belgium",
  "Brazil",
  "Canada",
  "China",
  "Colombia",
  "Czech Republic",
  "Denmark",
  "Finland",
  "France",
  "Germany",
  "Hong Kong",
  "Hungary",
  "India",
  "Ireland",
  "Israel",
  "Italy",
  "Japan",
  "Luxembourg",
  "Mexico",
  "Netherlands",
  "New Zealand",
  "Nigeria",
  "Norway",
  "Philippines",
  "Poland",
  "Romania",
  "Russia",
  "South Africa",
  "South Korea",
  "Spain",
  "Sweden",
  "Switzerland",
  "Taiwan",
  "Thailand",
  "Turkey",
  "United Kingdom",
  "United States",
] as const;

export const SORT_OPTIONS = [
  "Updated date",
  "Added date",
  "Release date",
  "Trending",
  "Name A-Z",
  "Average score",
  "IMDb",
  "Total views",
  "Total bookmarks",
] as const;

//  The Inferred Types ---

export type MediaType = (typeof MEDIA_TYPES)[number];
export type Quality = (typeof QUALITIES)[number];
export type ReleaseYear = (typeof RELEASE_YEARS)[number];
// export type Genre = (typeof GENRES)[number];
export type Genre = string;
export type Country = (typeof COUNTRIES)[number];
export type SortOption = (typeof SORT_OPTIONS)[number];

//  The Main Interface ---
export type FilterOptions = {
  type?: MediaType[];
  quality?: Quality[];
  released?: ReleaseYear[];
  genre?: Genre[];
  country?: Country[];
  sort?: SortOption;
};

export type ContentFeatured = {
  id: string;
  // type: "movie"; // need to confirm, ~~saw only movies on hero section till now~~.
  title: string;
  description?: string;
  imdbRate: number;
  runtime: string;
  year: number;
  quality: string;
  ageRating?: "PG" | "R" | "PG-13"; // need to spot more
  genres: Genre[];
};

export type MovieCard = {
  id: string;
  type: "movie";
  title: string;
  year: number;
  runtime?: string;
  quality: string;
};

export type TvCard = {
  id: string;
  type: "tv";
  title: string;
  season_count: number;
  latest_episode: number;
  quality: string;
};

export type ContentTop10Card = {
  id: string;
  title: string;
  quality: string;
};
