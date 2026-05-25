// ─── AniList GraphQL query fragments ─────────────────────────────────────────
// Ported from anime-stream-link/server.js

export const ANILIST_URL = "https://graphql.anilist.co";

export const SPOTLIGHT_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title { english romaji }
      bannerImage
      coverImage { extraLarge }
      description
      season
      seasonYear
      episodes
      status
      format
      nextAiringEpisode {
        timeUntilAiring
        episode
      }
    }
  }
`;

export const HOME_DATA_QUERY = `
  query ($season: MediaSeason, $seasonYear: Int) {
    trending: Page(page: 1, perPage: 20) {
      media(type: ANIME, sort: TRENDING_DESC) { ...mediaFields }
    }
    popular: Page(page: 1, perPage: 20) {
      media(type: ANIME, sort: POPULARITY_DESC) { ...mediaFields }
    }
    movies: Page(page: 1, perPage: 20) {
      media(type: ANIME, format: MOVIE, sort: POPULARITY_DESC) { ...mediaFields }
    }
    seasonal: Page(page: 1, perPage: 20) {
      media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC) { ...mediaFields }
    }
    allTime: Page(page: 1, perPage: 20) {
      media(type: ANIME, sort: SCORE_DESC) { ...mediaFields }
    }
    comingSoon: Page(page: 1, perPage: 20) {
      media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC) { ...mediaFields }
    }
  }

  fragment mediaFields on Media {
    id
    title { english romaji }
    coverImage { extraLarge }
    format
    episodes
    status
  }
`;

export const ANIME_DETAIL_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title { romaji english native }
      coverImage { extraLarge large color }
      bannerImage
      description
      season
      seasonYear
      episodes
      duration
      nextAiringEpisode { timeUntilAiring episode }
      status
      format
      genres
      averageScore
      meanScore
      popularity
      favourites
      source
      countryOfOrigin
      startDate { year month day }
      endDate { year month day }
      studios { nodes { name isAnimationStudio } }
      trailer { id site }
      streamingEpisodes { title thumbnail }
      synonyms
      tags { name rank }
      relations {
        edges {
          relationType
          node {
            id
            title { romaji english }
            coverImage { extraLarge }
            format
            status
            episodes
            type
          }
        }
      }
      characters(sort: [ROLE, RELEVANCE, ID], perPage: 25) {
        edges {
          role
          node { id name { userPreferred } image { large } }
          voiceActors(language: JAPANESE, sort: [RELEVANCE, ID]) {
            id
            name { userPreferred }
            image { large }
          }
        }
      }
      recommendations(sort: RATING_DESC, perPage: 12) {
        nodes {
          mediaRecommendation {
            id
            title { romaji english }
            coverImage { extraLarge }
            bannerImage
            format
            status
            episodes
            averageScore
            season
            seasonYear
          }
        }
      }
    }
  }
`;

export const SEARCH_QUERY = `
  query ($search: String, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total currentPage lastPage hasNextPage perPage
      }
      media(search: $search, type: ANIME, sort: [POPULARITY_DESC, SCORE_DESC]) {
        id
        title { romaji english native }
        coverImage { extraLarge color }
        format
        status
        episodes
        averageScore
        season
        seasonYear
      }
    }
  }
`;
