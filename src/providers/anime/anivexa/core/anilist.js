import { forget, memo, TTL } from "./cache.js";
import { cookiesFrom, HTML_ACCEPT, request } from "./http.js";

const GRAPHQL = "https://graphql.anilist.co";
const WEB = "https://anilist.co";
const ARM = "https://arm.haglund.dev/api/v2/ids";
const ANIZIP = "https://api.ani.zip/mappings";
const STATUS = {
  RELEASING: "RELEASING",
  FINISHED: "FINISHED",
  NOT_YET_RELEASED: "NOT_YET_RELEASED",
  CANCELLED: "FINISHED",
  HIATUS: "HIATUS",
};
const MEDIA_QUERY = `query($id:Int){Media(id:$id,type:ANIME){id idMal title{english romaji native} status format episodes seasonYear startDate{year} synonyms nextAiringEpisode{episode airingAt timeUntilAiring}}}`;
const RELATION_EDGES = (depth) =>
  depth
    ? `edges{relationType(version:2) node{id type episodes relations{${RELATION_EDGES(depth - 1)}}}}`
    : `edges{relationType(version:2) node{id type episodes}}`;
const PREQUEL_QUERY = `query($id:Int){Media(id:$id,type:ANIME){relations{${RELATION_EDGES(3)}}}}`;

async function jsonOrNull(response) {
  if (!response?.ok) return null;
  return response.json().catch(() => null);
}

function webSession() {
  return memo("anilist:web", 30 * TTL.minute, async () => {
    const home = await request(`${WEB}/`, { headers: { Accept: HTML_ACCEPT } }).catch(() => null);
    if (!home?.ok) return null;
    const token = (await home.text()).match(/window\.al_token\s*=\s*"([^"]+)"/)?.[1];
    const cookie = cookiesFrom(home.headers).join("; ");
    return token && cookie ? { token, cookie } : null;
  });
}

async function webQuery(body) {
  const session = await webSession();
  if (!session) return null;
  const response = await request(`${WEB}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Referer: `${WEB}/home`,
      "x-csrf-token": session.token,
      schema: "default",
      Cookie: session.cookie,
    },
    body,
  }).catch(() => null);
  if (response && !response.ok) forget("anilist:web");
  return jsonOrNull(response);
}

export async function anilistQuery(query, variables) {
  const body = JSON.stringify({ query, variables });
  const response = await request(GRAPHQL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body,
  }).catch(() => null);
  const json = (await jsonOrNull(response)) ?? (await webQuery(body));
  if (!json?.data) throw new Error(`AniList: ${json?.errors?.[0]?.message ?? "request failed"}`);
  return json.data;
}

export function getAniZip(anilistId, fresh = false) {
  if (fresh) forget(`anizip:${anilistId}`);
  return memo(`anizip:${anilistId}`, TTL.hour, () =>
    request(`${ANIZIP}?anilist_id=${anilistId}`, { headers: { Accept: "application/json" } })
      .then(jsonOrNull)
      .catch(() => null),
  );
}

export function fetchArm(anilistId) {
  return memo(`arm:${anilistId}`, 6 * TTL.hour, () =>
    request(`${ARM}?source=anilist&id=${anilistId}`, { headers: { Accept: "application/json" } })
      .then(jsonOrNull)
      .catch(() => null),
  );
}

export function getMedia(anilistId) {
  const id = Number(anilistId);
  return memo(`media:${id}`, TTL.hour, async () => {
    const [data, arm] = await Promise.all([
      anilistQuery(MEDIA_QUERY, { id }).catch(() => null),
      fetchArm(id),
    ]);
    const media = data?.Media;
    if (!media) throw new Error(`No data found for AniList ID ${id}`);
    return {
      id,
      idMal: media.idMal ?? arm?.myanimelist ?? null,
      title: {
        english: media.title?.english ?? null,
        romaji: media.title?.romaji ?? null,
        native: media.title?.native ?? null,
      },
      status: STATUS[media.status] ?? "RELEASING",
      format: media.format ?? null,
      episodes: media.episodes ?? null,
      seasonYear: media.seasonYear ?? null,
      startDate: media.startDate ?? null,
      nextAiringEpisode: media.nextAiringEpisode ?? null,
      synonyms: Array.isArray(media.synonyms) ? media.synonyms : [],
    };
  });
}

export function forgetMedia(anilistId) {
  forget(`media:${Number(anilistId)}`);
}

function prequelOffset(relations, depth = 0) {
  if (!relations || depth > 5) return 0;
  const prequel = relations.edges?.find(
    (edge) =>
      edge.relationType === "PREQUEL" &&
      edge.node.type === "ANIME" &&
      (edge.node.episodes ?? 0) >= 5,
  );
  return prequel ? prequel.node.episodes + prequelOffset(prequel.node.relations, depth + 1) : 0;
}

export function getPrequelOffset(anilistId) {
  return memo(`prequel:${anilistId}`, TTL.identity, async () => {
    const data = await anilistQuery(PREQUEL_QUERY, { id: Number(anilistId) });
    return prequelOffset(data?.Media?.relations);
  });
}
