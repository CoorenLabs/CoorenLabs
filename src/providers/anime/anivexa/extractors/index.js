import { extractBabaStream } from "./babastream.js";
import { canExtractByse, extractByse } from "./byse.js";
import { canExtractEchoVideo, extractEchoVideo } from "./echovideo.js";
import { canExtractMegaPlay, extractMegaPlay } from "./megaplay.js";
import { canExtractNova, extractNova } from "./nova.js";
import { canExtractVidmoly, extractVidmoly } from "./vidmoly.js";

async function megaPlaySources(url, options) {
  const details = await extractMegaPlay(url, options);
  return details.sources.map((source) => ({
    url: source.url,
    type: "hls",
    referer: `${details.origin}/`,
  }));
}

const EXTRACTORS = [
  { matches: (url) => /babastream\.[^/]+\/embed\//i.test(url), extract: extractBabaStream },
  { matches: canExtractByse, extract: extractByse },
  { matches: canExtractEchoVideo, extract: extractEchoVideo },
  { matches: canExtractMegaPlay, extract: megaPlaySources },
  { matches: canExtractVidmoly, extract: extractVidmoly },
  { matches: canExtractNova, extract: extractNova },
];

export function canResolveEmbed(url) {
  return EXTRACTORS.some((extractor) => extractor.matches(String(url)));
}

export async function resolveEmbed(url, options = {}) {
  const extractor = EXTRACTORS.find((item) => item.matches(String(url)));
  if (!extractor) return [];
  for (let attempt = 1; ; attempt++) {
    try {
      return await extractor.extract(url, options);
    } catch (error) {
      if (attempt >= (options.attempts ?? 1)) throw error;
    }
  }
}
