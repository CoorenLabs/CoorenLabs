import { Logger } from "../../../../core/logger";
import { PROVIDERS } from "../providers/index.js";
import { cached, episodeTtl } from "./cache.js";

const BUDGET_MS = 20_000;

function orderEpisodeFields(data) {
  if (!data?.episodes || typeof data.episodes !== "object") return data;
  const episodes = Object.fromEntries(
    Object.entries(data.episodes).map(([audio, list]) => [
      audio,
      Array.isArray(list)
        ? list.map(({ id, audio: itemAudio, sourceNumber, ...episode }) => ({
            ...(id === undefined ? {} : { id }),
            ...(sourceNumber === undefined ? {} : { sourceNumber }),
            ...(itemAudio === undefined ? {} : { audio: itemAudio }),
            ...episode,
          }))
        : list,
    ]),
  );
  return { ...data, episodes };
}

function withBudget(task, name) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${name} did not respond within ${BUDGET_MS / 1000}s`)),
      BUDGET_MS,
    );
  });
  return Promise.race([task, timeout]).finally(() => clearTimeout(timer));
}

export async function providerEpisodes(names, anilistId, media, anizip, { fresh = false } = {}) {
  const { ttl, refreshAfter } = episodeTtl(media?.status ?? "RELEASING");
  const ctx = { media, anizip };
  const pairs = await Promise.all(
    [...names].map(async (name) => {
      const task = cached(`epv:${name}:${anilistId}`, { ttl, refreshAfter, force: fresh }, () =>
        PROVIDERS[name].getEpisodes(anilistId, ctx),
      );
      try {
        return [name, orderEpisodeFields(await withBudget(task, name))];
      } catch (error) {
        Logger.debug(`[anivexa] episodes ${name}:${anilistId} failed: ${error.message}`);
        return [name, { error: error.message }];
      }
    }),
  );
  return Object.fromEntries(pairs);
}
