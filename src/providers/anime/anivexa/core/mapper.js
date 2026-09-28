import { anilistQuery, fetchArm, getMedia } from "./anilist.js";

const NODE = "id type format title{romaji english native}";
const RELATIONS_QUERY = `query($id:Int){Media(id:$id,type:ANIME){id synonyms relations{edges{relationType(version:2) node{${NODE} relations{edges{relationType(version:2) node{${NODE}}}}}}}}}`;

function hashFranchiseId(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  return hash >>> 0;
}

function franchiseEntry(edge) {
  return {
    relation: edge.relationType,
    anilistId: edge.node.id,
    title: edge.node.title.romaji || edge.node.title.english,
    type: edge.node.type,
    format: edge.node.format,
  };
}

export async function mapAnimeIds(anilistId) {
  const id = Number(anilistId);
  const [arm, media, relations] = await Promise.all([
    fetchArm(id),
    getMedia(id).catch(() => null),
    anilistQuery(RELATIONS_QUERY, { id })
      .then((data) => data?.Media ?? null)
      .catch(() => null),
  ]);
  const synonyms = [...new Set([...(media?.synonyms ?? []), ...(relations?.synonyms ?? [])])];
  const franchise = new Map();
  for (const edge of relations?.relations?.edges ?? []) {
    if (!franchise.has(edge.node.id)) franchise.set(edge.node.id, franchiseEntry(edge));
    for (const nested of edge.node.relations?.edges ?? []) {
      if (nested.node.id !== id && !franchise.has(nested.node.id))
        franchise.set(nested.node.id, franchiseEntry(nested));
    }
  }
  const thetvdbId = arm?.thetvdb ?? null;
  return {
    mappings: {
      id,
      title: media?.title?.english || media?.title?.romaji || null,
      type: arm?.media ?? null,
      format: media?.format ?? null,
      episodes: media?.episodes ?? null,
      malId: arm?.myanimelist ?? null,
      aniId: id,
      anidbId: arm?.anidb ?? null,
      animePlanetId: arm?.["anime-planet"] ?? null,
      kitsuId: arm?.kitsu ?? null,
      animeCountdownId: arm?.animecountdown ?? null,
      anisearchId: arm?.anisearch ?? null,
      notifyMoeId: null,
      simklId: arm?.simkl ?? null,
      imdbId: arm?.imdb ?? null,
      themoviedbId: arm?.themoviedb ?? null,
      thetvdbId,
      livechartId: arm?.livechart ?? null,
      annId: arm?.animenewsnetwork ?? null,
      animescheduleId: null,
      animethemesId: null,
      animefillerlistId: null,
      franchiseAnchor: thetvdbId ? `tvdb:${thetvdbId}` : null,
      franchiseId: thetvdbId ? hashFranchiseId(`tvdb:${thetvdbId}`) : null,
      defaultTvdbSeason: arm?.["thetvdb-season"] != null ? String(arm["thetvdb-season"]) : null,
      tmdbSeason: arm?.["themoviedb-season"] != null ? String(arm["themoviedb-season"]) : null,
      episodeOffset: null,
      tmdbOffset: null,
      malIds: null,
      aniskip: null,
      animefillerlist: null,
      synonyms,
      franchise: [...franchise.values()],
    },
  };
}
