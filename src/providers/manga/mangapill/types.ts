export interface MangaPillSeries {
  id: string;
  title: string;
  altTitle: string | null;
  cover: string | null;
  type: string | null;
  status: string | null;
  year: number | null;
  url: string;
}

export interface MangaPillChapter {
  id: string;
  number: number | null;
  title: string;
  url: string;
}

export interface MangaPillMangaDetail extends MangaPillSeries {
  description: string | null;
  genres: string[];
  chapters: MangaPillChapter[];
}

export interface MangaPillChapterPages {
  id: string;
  mangaId: string;
  title: string;
  number: number | null;
  pages: string[];
  url: string;
  prevChapterId: string | null;
  nextChapterId: string | null;
}
