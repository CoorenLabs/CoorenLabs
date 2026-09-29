export interface MangaPillSeries {
  id: string;
  title: string;
  cover: string | null;
  url: string;
}

export interface MangaPillChapter {
  id: string;
  title: string;
  url: string;
}

export interface MangaPillMangaDetail extends MangaPillSeries {
  description: string | null;
  chapters: MangaPillChapter[];
}
