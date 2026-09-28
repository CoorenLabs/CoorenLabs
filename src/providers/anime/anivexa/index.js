import { Logger } from "../../../core/logger";
import { getMedia } from "./core/anilist.js";
import { cached, isFresh, mapTtl, read, write } from "./core/cache.js";
import { getEpisodesResponse, getFilteredEpisodesResponse } from "./core/episode-cache.js";
import { mapAnimeIds } from "./core/mapper.js";
import { flixcloudHls } from "./extractors/flixcloud-hls.js";
import { stream as dhiveStream } from "./providers/2dhive.js";
import { PROVIDER_NAMES, PROVIDERS, resolveProviders, watchTtl } from "./providers/index.js";
import { captchaPage } from "./providers/mkissa.js";
import { stream as reanimeStream } from "./providers/reanime.js";

export { PROVIDER_NAMES };

export const ROUTES = [
  "/map/:anilistId",
  "/episodes/:anilistId",
  "/episodes/:provider[/:provider...]/:anilistId?map=true|false",
  "/watch/:provider/:anilistId/sub|dub/:provider-:episode",
  "/stream/reanime/:anilistId/sub|dub/:episode",
  "/stream/2dhive/:anilistId/sub|dub/:episode",
  "/captcha/mkissa?next=/watch/mkissa/:anilistId/sub|dub/mkissa-:episode",
];

const CORS = { "Access-Control-Allow-Origin": "*" };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS,
      "Content-Type": "application/json",
      "Cache-Control": status < 400 ? "public, max-age=300" : "no-store",
    },
  });
}

function redirect(location) {
  return new Response(null, {
    status: 302,
    headers: { ...CORS, Location: location, "Cache-Control": "no-store" },
  });
}

function failure(error) {
  if (error?.rawBody)
    Logger.debug(`[anivexa] ${error.message}: ${String(error.rawBody).slice(0, 500)}`);
  return json(
    { error: error?.message ?? String(error), ...(error?.details ?? {}) },
    error?.status ?? 500,
  );
}

function notFound(basePath) {
  return json({ error: "Not found", routes: ROUTES.map((route) => basePath + route) }, 404);
}

async function mapRoute(anilistId) {
  const key = `map:${anilistId}`;
  const entry = await read(key);
  if (isFresh(entry)) return json(entry.data);
  try {
    const [data, media] = await Promise.all([
      mapAnimeIds(anilistId),
      getMedia(anilistId).catch(() => null),
    ]);
    write(key, data, mapTtl(media?.status ?? "RELEASING"));
    return json(data);
  } catch (error) {
    if (entry) return json(entry.data);
    throw error;
  }
}

async function filteredRoute(names, anilistId, url) {
  const { resolved, unknown } = resolveProviders(names.replace(/\/$/, "").split("/"));
  if (!resolved.size) return json({ error: "No valid providers specified", unknown }, 400);
  const data = await getFilteredEpisodesResponse(
    anilistId,
    resolved,
    url.searchParams.get("map") !== "false",
  );
  return json(unknown.length ? { ...data, _unknownProviders: unknown } : data);
}

async function watchRoute([, name, anilistId, audio, prefix, episode], context) {
  if (prefix !== name || !Object.hasOwn(PROVIDERS, name)) return notFound(context.basePath);
  const hasCaptcha =
    name === "mkissa" &&
    (["captchaToken", "turnstileToken"].some((param) => context.url.searchParams.has(param)) ||
      ["x-captcha-token", "cf-turnstile-response"].some((header) =>
        context.request.headers.has(header),
      ));
  const data = await cached(
    `watch:${name}:${anilistId}:${audio}:${episode}`,
    { ttl: watchTtl(name), force: hasCaptcha },
    () => PROVIDERS[name].watch(anilistId, audio, Number(episode), context),
  );
  return json(data);
}

const ROUTE_HANDLERS = [
  [/^\/map\/(\d+)\/?$/, ([, id]) => mapRoute(id)],
  [/^\/episodes\/(\d+)\/?$/, async ([, id]) => json(await getEpisodesResponse(id))],
  [
    /^\/episodes\/((?:[\w-]+\/)+)(\d+)\/?$/i,
    ([, names, id], { url }) => filteredRoute(names, id, url),
  ],
  [/^\/watch\/([a-z0-9]+)\/(\d+)\/(sub|dub)\/([a-z0-9]+)-(\d+)\/?$/, watchRoute],
  [
    /^\/stream\/reanime\/(\d+)\/(sub|dub)\/(\d+)\/?$/,
    async ([, id, audio, episode], context) =>
      redirect(await reanimeStream(id, audio, Number(episode), context)),
  ],
  [
    /^\/hls\/flixcloud\/(playlist\.m3u8|segment\.ts)$/,
    ([, file], context) => flixcloudHls(file, context),
  ],
  [
    /^\/stream\/2dhive\/(\d+)\/(sub|dub)\/(\d+)\/?$/,
    async ([, id, audio, episode]) => redirect(await dhiveStream(id, audio, Number(episode))),
  ],
  [
    /^\/captcha\/mkissa\/?$/,
    (_, { url, basePath }) =>
      new Response(captchaPage(url, basePath), {
        headers: {
          ...CORS,
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      }),
  ],
];

export default {
  async fetch(request, env = {}) {
    const url = new URL(request.url);
    const context = { url, request, basePath: env.basePath ?? "" };
    for (const [pattern, handle] of ROUTE_HANDLERS) {
      const match = url.pathname.match(pattern);
      if (!match) continue;
      try {
        return await handle(match, context);
      } catch (error) {
        return failure(error);
      }
    }
    return notFound(context.basePath);
  },
};
