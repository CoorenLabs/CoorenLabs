import { gunzipSync } from "node:zlib";
import { remapManager } from "../../../core/remapManager";

const CATALOG_KEY = new TextEncoder().encode("miruro/catalog");

export function applyRemapsToMedia(media: any): any {
  const remap = media?.id ? remapManager.getRemap(media.id) : undefined;
  if (!remap) return media;

  if (media.title && remap.name) media.title.english = remap.name;
  if (media.coverImage && remap.poster_img) {
    media.coverImage.extraLarge = remap.poster_img;
    media.coverImage.large = remap.poster_img;
  }
  if (remap.banner || remap.banner_image) media.bannerImage = remap.banner || remap.banner_image;
  if (remap.description) media.description = remap.description;
  if (remap.logo || remap.clear_logo) media.logo = remap.logo || remap.clear_logo;

  return media;
}

export const MEDIA_LIST_FIELDS = `
    id
    title { romaji english native }
    coverImage { large extraLarge }
    bannerImage
    format
    season
    seasonYear
    episodes
    duration
    status
    averageScore
    meanScore
    popularity
    favourites
    genres
    source
    countryOfOrigin
    isAdult
    studios(isMain: true) { nodes { name isAnimationStudio } }
    nextAiringEpisode { episode airingAt timeUntilAiring }
    startDate { year month day }
    endDate { year month day }
`;

export const MEDIA_FULL_FIELDS = `
    id
    idMal
    title { romaji english native }
    description(asHtml: false)
    coverImage { large extraLarge color }
    bannerImage
    format
    season
    seasonYear
    episodes
    duration
    status
    averageScore
    meanScore
    popularity
    favourites
    trending
    genres
    tags { name rank isMediaSpoiler }
    source
    countryOfOrigin
    isAdult
    hashtag
    synonyms
    siteUrl
    trailer { id site thumbnail }
    studios { nodes { id name isAnimationStudio siteUrl } }
    nextAiringEpisode { episode airingAt timeUntilAiring }
    startDate { year month day }
    endDate { year month day }
    characters(sort: [ROLE, RELEVANCE], perPage: 25) {
        edges {
            role
            node { id name { full native } image { large } }
            voiceActors(language: JAPANESE) { id name { full native } image { large } languageV2 }
        }
    }
    staff(sort: RELEVANCE, perPage: 25) {
        edges {
            role
            node { id name { full native } image { large } }
        }
    }
    relations {
        edges {
            relationType(version: 2)
            node {
                id
                title { romaji english native }
                coverImage { large }
                format
                type
                status
                episodes
                meanScore
            }
        }
    }
    recommendations(sort: RATING_DESC, perPage: 10) {
        nodes {
            rating
            mediaRecommendation {
                id
                title { romaji english native }
                coverImage { large }
                format
                episodes
                status
                meanScore
                averageScore
            }
        }
    }
    externalLinks { url site type }
    streamingEpisodes { title thumbnail url site }
    stats {
        scoreDistribution { score amount }
        statusDistribution { status amount }
    }
`;

export function decodeCatalog(contentType: string | null, body: Uint8Array): any {
  if (!contentType?.startsWith("application/octet-stream")) {
    return JSON.parse(new TextDecoder().decode(body));
  }
  for (let i = 0; i < body.length; i++) body[i] ^= CATALOG_KEY[i % CATALOG_KEY.length];
  return JSON.parse(gunzipSync(body).toString("utf8"));
}
