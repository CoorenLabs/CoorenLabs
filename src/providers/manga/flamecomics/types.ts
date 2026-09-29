export interface FlameComicsSeries {
  id: string;
  title: string;
  cover: string | null;
  type: string | null;
  status: string | null;
  url: string;
}

export interface FlameComicsChapter {
  id: string;
  number: number;
  title: string | null;
  token: string;
  releaseDate: string | null;
  url: string;
}

export interface FlameComicsMangaDetail extends FlameComicsSeries {
  description: string | null;
  altTitles: string[];
  genres: string[];
  authors: string[];
  artists: string[];
  year: number | null;
  chapters: FlameComicsChapter[];
}

export interface FlameComicsChapterPages {
  id: string;
  mangaId: string;
  mangaTitle: string | null;
  number: number;
  title: string | null;
  token: string;
  releaseDate: string | null;
  images: string[];
  prevToken: string | null;
  nextToken: string | null;
}
