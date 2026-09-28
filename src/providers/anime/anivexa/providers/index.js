import { TTL } from "../core/cache.js";
import * as dhive from "./2dhive.js";
import * as anibd from "./anibd.js";
import * as anidbapp from "./anidbapp.js";
import * as anikoto from "./anikoto.js";
import * as animedunya from "./animedunya.js";
import * as animegg from "./animegg.js";
import * as animenosub from "./animenosub.js";
import * as animeonsen from "./animeonsen.js";
import * as anineko from "./anineko.js";
import * as aniwaves from "./aniwaves.js";
import * as anizone from "./anizone.js";
import * as kaa from "./kickassanime.js";
import * as mkissa from "./mkissa.js";
import * as reanime from "./reanime.js";
import * as senshi from "./senshi.js";

export const PROVIDERS = {
  mkissa,
  reanime,
  anikoto,
  animegg,
  anineko,
  anidbapp,
  "2dhive": dhive,
  animenosub,
  anizone,
  aniwaves,
  anibd,
  senshi,
  kaa,
  animedunya,
  animeonsen,
};

export const PROVIDER_NAMES = Object.keys(PROVIDERS);

const SIGNED_STREAMS = new Set(["anikoto", "2dhive", "senshi"]);

export function watchTtl(name) {
  return SIGNED_STREAMS.has(name) ? TTL.signedWatch : TTL.watch;
}

export function resolveProviders(rawNames) {
  const resolved = new Set();
  const unknown = [];
  for (const raw of rawNames) {
    const name = raw.toLowerCase();
    if (Object.hasOwn(PROVIDERS, name)) resolved.add(name);
    else unknown.push(raw);
  }
  return { resolved, unknown };
}
