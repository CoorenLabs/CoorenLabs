import * as cheerio from "cheerio";
// Adjust these import paths to match your project structure
import { embedPlayerOrigins, TOONSTREAM_BASE, UserAgent } from "../../lib/const";
import { DirectSource } from "../../lib/types";

const { rubyStreamOrigin } = embedPlayerOrigins;

/**
 * Standard Dean Edwards Unpacker Algorithm
 */
function unpack(p: string, a: number, c: number, k: string[]): string {
  while (c--) {
    if (k[c]) {
      p = p.replace(new RegExp("\\b" + c.toString(a) + "\\b", "g"), k[c]);
    }
  }
  return p;
}

/**
 * Robustly extracts the 4 arguments from a packed script
 * by parsing backwards from the .split('|') call.
 * * This avoids Regex failure caused by escaped quotes (\') inside the payload.
 */
function extractPackedArgs(text: string) {
  try {
    // 1. Find the standard signature of the packer
    const packerSignature = "eval(function(p,a,c,k,e,d)";
    const startIdx = text.indexOf(packerSignature);
    if (startIdx === -1) return null;

    // 2. Find the end of the argument list: .split('|'))
    // We look for the last occurrence to be safe
    const endIdx = text.lastIndexOf(".split('|'))");
    if (endIdx === -1) return null;

    // 3. Extract the raw string between the function start and the split call
    // The structure roughly looks like: ...}('PAYLOAD',RADIX,COUNT,'KEYWORDS'

    // Find the start of the arguments: the first `(` after the function definition `}`
    // Usually: ...return p}('...
    const functionEnd = text.indexOf("}", startIdx);
    const argsStart = text.indexOf("(", functionEnd);

    // Isolate the arguments string: 'PAYLOAD',RADIX,COUNT,'KEYWORDS'
    const argsBody = text.substring(argsStart + 1, endIdx);

    // 4. Parse Backwards
    // We know the structure is: PAYLOAD, RADIX, COUNT, KEYWORDS

    // A. KEYWORDS are at the very end.
    // They are wrapped in quotes. Find the last comma.
    const lastComma = argsBody.lastIndexOf(",");
    const kRaw = argsBody.substring(lastComma + 1);
    // Strip the quotes around keywords and split
    const k = kRaw.replace(/^['"]|['"]$/g, "").split("|");

    // B. COUNT is the 2nd to last argument
    const secondLastComma = argsBody.lastIndexOf(",", lastComma - 1);
    const c = parseInt(argsBody.substring(secondLastComma + 1, lastComma));

    // C. RADIX is the 3rd to last argument
    const thirdLastComma = argsBody.lastIndexOf(",", secondLastComma - 1);
    const a = parseInt(argsBody.substring(thirdLastComma + 1, secondLastComma));

    // D. PAYLOAD is everything before the third-to-last comma
    const pRaw = argsBody.substring(0, thirdLastComma);
    // Strip the wrapping quotes from the payload.
    // We handle potential leading whitespace or different quote types.
    const p = pRaw.trim().replace(/^['"]|['"]$/g, "");

    return { p, a, c, k };
  } catch (error_rubystm) {
    console.error("[StreamRuby] Manual extraction failed:", error_rubystm);
    return null;
  }
}

/**
 * Main Scraper Function
 */
export async function getRubystmSource(url: string): Promise<DirectSource | null> {
  // 1. Extract File Code
  // Handles URLs ending in slash or .html
  const segments = url.replace(".html", "").split("/");
  const file_code = segments.pop() || segments.pop();

  if (!file_code) {
    console.log("[StreamRuby] Couldnt extract file_code from", url);
    return null;
  }

  // 2. Fetch the Embed Page
  const res = await fetch(`${rubyStreamOrigin}/dl`, {
    body: `op=embed&file_code=${file_code}&auto=1&referer=${encodeURIComponent(TOONSTREAM_BASE + "/")}`,
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Referer: url,
      "User-Agent": UserAgent,
    },
  });

  if (!res.ok) {
    console.log(`[StreamRuby Error] Fetch failed: ${res.status}`);
    return null;
  }

  const html = await res.text();

  // 3. Parse the HTML & get  source
  const source = scrapeStreamRuby(html);
  return source;
}

/**
 * HTML Parser & Unpacker
 */
export function scrapeStreamRuby(html: string): DirectSource | null {
  const $ = cheerio.load(html); // has some invalid tags - so skip using xml:true aka htmlparser2
  let unpacked: string | null = null;

  const scripts = $("script").toArray();

  // 1. Find the script containing the packer
  for (const el of scripts) {
    const text = $(el).html();
    if (text && text.startsWith("eval(function(p,a,c,k,e,d)")) {
      // console.log(text);
      // Use Robust Backwards Extraction
      const args = extractPackedArgs(text);

      if (args) {
        unpacked = unpack(args.p, args.a, args.c, args.k);
        break; // Found it, stop looping
      }
    }
  }

  if (!unpacked) {
    console.log("[StreamRuby Error] Failed to unpack JS or Script not found.");
    return null;
  }

  // 2. Extract Assets from Unpacked Code

  // A. Main Video (m3u8)
  // Matches: file:"..." OR file:'...' (ignores spaces)
  const hlsMatch = unpacked.match(/file\s*:\s*(['"])(https?:\/\/[^"']+\.m3u8[^"']*)\1/);
  if (!hlsMatch) {
    console.log("[StreamRuby Error] Unpacked JS ok, but no .m3u8 found.");
    return null;
  }

  // B. Cover Image (Poster)
  const coverMatch = unpacked.match(/image\s*:\s*(['"])(https?:\/\/[^"']+\.jpg)\1/);

  // C. Tracks (Subtitles & Thumbnails/Storyboard)
  let subtitleObj = undefined;
  let spriteUrl = undefined;

  // Regex to capture objects like { file: "...", kind: "..." }
  // We capture the content inside the curly braces to parse properties safely
  const objectRegex = /\{([^{}]*?)\}/g;
  let objMatch;

  while ((objMatch = objectRegex.exec(unpacked)) !== null) {
    const content = objMatch[1];

    // Extract properties from the object content
    const kindMatch = content.match(/kind\s*:\s*(['"])([^"']+)\1/);
    const fileMatch = content.match(/file\s*:\s*(['"])([^"']+)\1/);
    const labelMatch = content.match(/label\s*:\s*(['"])([^"']+)\1/);

    if (kindMatch && fileMatch) {
      const kind = kindMatch[2];
      const url = fileMatch[2];
      const label = labelMatch ? labelMatch[2] : "Unknown";

      if (kind === "thumbnails" && !spriteUrl) {
        // This is the VTT Sprite Map (scrubbing preview)
        spriteUrl = url;
      } else if (kind === "captions") {
        // This is a Subtitle track
        // Priority: Pick English, or default to the first one found if none exist yet
        if (!subtitleObj || label.toLowerCase().includes("eng")) {
          subtitleObj = { label, url };
        }
      }
    }
  }

  // 3. Return the DirectSource object
  return {
    label: "Ruby",
    type: "hls",
    url: hlsMatch[2], // Index 2 contains the URL
    cover: coverMatch ? coverMatch[2] : undefined,
    thumbnail: spriteUrl, // The VTT sprite map (optional, mapped to thumbnail field)
    subtitles: subtitleObj,
    headers: {
      Origin: rubyStreamOrigin,
      Referer: rubyStreamOrigin + "/",
      // "User-Agent": UserAgent,
    },
    proxiedUrl: hlsMatch[2],
  };
}
