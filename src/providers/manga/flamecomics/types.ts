export interface FlameComicsSeries {
  series_id: string;
  title: string;
  cover: string | null;
  status: string | null;
  type: string | null;
  url: string;
}

export interface FlameComicsChapter {
  chapter_id: string;
  chapter: string;
  title: string;
  token: string;
  releaseDate: string | null;
  url: string;
}

export interface FlameComicsMangaDetail extends FlameComicsSeries {
  description: string | null;
  altTitles: string[];
  tags: string[];
  author: string[];
  chapters: FlameComicsChapter[];
}
