import crypto from "node:crypto";
import { withPage } from "../../../../core/lib/browser";
import { Logger } from "../../../../core/logger";
import { getAniZip, getMedia } from "../core/anilist.js";
import { dedupe, keep, memo, recall, TTL } from "../core/cache.js";
import { cookiesFrom, HTML_ACCEPT, notFound, request, wreqFetch } from "../core/http.js";
import { balancedEnd, uniqueBy, watchId } from "../core/utils.js";
import { extractNova } from "../extractors/nova.js";

const UA4 =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36";
const REFERER = "https://mkissa.to";
const API = "https://api.mkissa.net";
const API_URL = `${API}/api`;
const CAPTCHA_ENDPOINT = `${API}/captcha/turnstile`;
const CAPTCHA_PROVIDER = "turnstile";
const CAPTCHA_TIMEOUT_MS = 20000;
const CAPTCHA_DEADLINE_MS = 45000;
const CAPTCHA_BACKOFF_MS = 2 * TTL.minute;
const RATE_LIMIT_WAIT_MS = 20000;
const CONTENT_LANE = "k7";
const REFERER_HOST = "mkissa.to";
const KEY_GROUP = "mkissa";
const BOOT_EPOCH_MS = 604800000;
const BOOT_GRACE_MS = 86400000;
const AA_REQ_MS = 300000;
const CONFIG_CHECK_MS = 10 * TTL.minute;
const DISCOVERY_CONCURRENCY = 16;
const DISCOVERY_LIMIT = 600;
const FETCH_TIMEOUT_MS = 10000;
const EXTRACT_TIMEOUT_MS = 5000;
const JS_ACCEPT = { Accept: "application/javascript,*/*" };

const HEX_TABLE = {
  79: "A",
  "7a": "B",
  "7b": "C",
  "7c": "D",
  "7d": "E",
  "7e": "F",
  "7f": "G",
  70: "H",
  71: "I",
  72: "J",
  73: "K",
  74: "L",
  75: "M",
  76: "N",
  77: "O",
  68: "P",
  69: "Q",
  "6a": "R",
  "6b": "S",
  "6c": "T",
  "6d": "U",
  "6e": "V",
  "6f": "W",
  60: "X",
  61: "Y",
  62: "Z",
  59: "a",
  "5a": "b",
  "5b": "c",
  "5c": "d",
  "5d": "e",
  "5e": "f",
  "5f": "g",
  50: "h",
  51: "i",
  52: "j",
  53: "k",
  54: "l",
  55: "m",
  56: "n",
  57: "o",
  48: "p",
  49: "q",
  "4a": "r",
  "4b": "s",
  "4c": "t",
  "4d": "u",
  "4e": "v",
  "4f": "w",
  40: "x",
  41: "y",
  42: "z",
  "08": "0",
  "09": "1",
  "0a": "2",
  "0b": "3",
  "0c": "4",
  "0d": "5",
  "0e": "6",
  "0f": "7",
  "00": "8",
  "01": "9",
  15: "-",
  16: ".",
  67: "_",
  46: "~",
  "02": ":",
  17: "/",
  "07": "?",
  "1b": "#",
  63: "[",
  65: "]",
  78: "@",
  19: "!",
  "1c": "$",
  "1e": "&",
  10: "(",
  11: ")",
  12: "*",
  13: "+",
  14: ",",
  "03": ";",
  "05": "=",
  "1d": "%",
};

let app = null;
let episodeQueue = Promise.resolve();
let captchaRetryAt = 0;
const sessionCookies = new Map();

function decodeHexUrl(hex) {
  let out = "";
  for (let i = 0; i < hex.length; i += 2) {
    const pair = hex.substring(i, i + 2).toLowerCase();
    out += HEX_TABLE[pair] ?? pair;
  }
  return out;
}

function sha256Hex(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hmacBytes(key, value) {
  return crypto.createHmac("sha256", key).update(value).digest();
}

function storeCookies(headers) {
  for (const pair of cookiesFrom(headers)) {
    const index = pair.indexOf("=");
    if (index > 0) sessionCookies.set(pair.slice(0, index), pair.slice(index + 1));
  }
}

function cookieHeader() {
  return [...sessionCookies].map(([key, value]) => `${key}=${value}`).join("; ");
}

function browserHeaders(headers = {}) {
  const cookie = cookieHeader();
  return {
    "User-Agent": UA4,
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "sec-ch-ua": '"Not=A?Brand";v="99", "Google Chrome";v="151", "Chromium";v="151"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    ...(cookie ? { Cookie: cookie } : {}),
    ...headers,
  };
}

function apiHeaders(buildId, headers = {}) {
  return {
    Referer: `${REFERER}/`,
    Origin: REFERER,
    "x-build-id": buildId,
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Priority: "u=1, i",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "cross-site",
    ...headers,
  };
}

async function sessionFetch(url, options = {}) {
  const { timeout = FETCH_TIMEOUT_MS, ...init } = options;
  const res = await request(url, {
    ...init,
    timeout,
    headers: browserHeaders(options.headers || {}),
  });
  storeCookies(res.headers);
  return res;
}

async function apiSessionFetch(url, options = {}) {
  try {
    await memo("mkissa:warm", 30 * TTL.minute, async () => {
      const home = await wreqFetch("mkissa", `${REFERER}/`, { headers: { Accept: HTML_ACCEPT } });
      storeCookies(home.headers);
      return true;
    });
    const res = await wreqFetch("mkissa", url, options);
    storeCookies(res.headers);
    return res;
  } catch {
    return sessionFetch(url, options);
  }
}

function findOpeningParen(text, end) {
  let depth = 0;
  for (let i = end; i >= 0; i--) {
    const ch = text[i];
    if (ch === ")") depth++;
    else if (ch === "(" && --depth === 0) return i;
  }
  return -1;
}

function normalizeCryptoConfig(out) {
  if (!out?.buildId || !Array.isArray(out.maskParts) || out.maskParts.length < 4) return null;
  return {
    scheme: "legacy",
    buildId: String(out.buildId),
    maskParts: out.maskParts.slice(0, 4).map(String),
  };
}

function functionSource(text, name) {
  const match = new RegExp(`function\\s+${name}\\s*\\(`).exec(text);
  if (!match) return null;
  const start = text.indexOf("{", match.index);
  const end = balancedEnd(text, start);
  return end === -1 ? null : text.slice(match.index, end);
}

function findStatementEnd(text, start) {
  let parens = 0;
  let brackets = 0;
  let braces = 0;
  let quote = "";
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = "";
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === "(") parens++;
    else if (ch === ")") parens--;
    else if (ch === "[") brackets++;
    else if (ch === "]") brackets--;
    else if (ch === "{") braces++;
    else if (ch === "}") braces--;
    else if (ch === ";" && !parens && !brackets && !braces) return i;
  }
  return -1;
}

function splitTopLevel(text) {
  const out = [];
  let start = 0;
  let parens = 0;
  let brackets = 0;
  let braces = 0;
  let quote = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = "";
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === "(") parens++;
    else if (ch === ")") parens--;
    else if (ch === "[") brackets++;
    else if (ch === "]") brackets--;
    else if (ch === "{") braces++;
    else if (ch === "}") braces--;
    else if (ch === "," && !parens && !brackets && !braces) {
      out.push(text.slice(start, i));
      start = i + 1;
    }
  }
  out.push(text.slice(start));
  return out;
}

function declarationStatementAt(text, index) {
  const start = Math.max(
    text.lastIndexOf("const ", index),
    text.lastIndexOf("let ", index),
    text.lastIndexOf("var ", index),
  );
  if (start < 0) return null;
  const end = findStatementEnd(text, start);
  if (end < 0 || index > end) return null;
  const keyword = /^(?:const|let|var)\s+/.exec(text.slice(start));
  if (!keyword) return null;
  const entries = splitTopLevel(text.slice(start + keyword[0].length, end))
    .map((value) => {
      const entry = /^\s*([A-Za-z_$][\w$]*)\s*=\s*([\s\S]+)$/.exec(value);
      return entry ? { name: entry[1], expression: entry[2], start, end } : null;
    })
    .filter(Boolean);
  return { start, end, entries };
}

function templateDependencies(expression) {
  return [...expression.matchAll(/\$\{\s*([A-Za-z_$][\w$]*)\b[^}]*\}/g)].map((match) => match[1]);
}

function templateDeclaration(chunk, name, before = chunk.length) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = [...chunk.matchAll(new RegExp(`(?<![A-Za-z0-9_$])${escaped}\\s*=`, "g"))];
  let fallback = null;
  for (const match of matches) {
    const statement = declarationStatementAt(chunk, match.index);
    const entry = statement?.entries.find((value) => value.name === name);
    if (!entry) continue;
    if (!fallback) fallback = entry;
    if (entry.start < before) fallback = entry;
  }
  return fallback;
}

function bootstrapBuildDeclaration(chunk) {
  const matches = [
    ...chunk.matchAll(/\bbuildId\s*:\s*[A-Za-z_$][\w$]*\s*=\s*([A-Za-z_$][\w$]*)\b/g),
  ];
  for (const match of matches) {
    const entry = templateDeclaration(chunk, match[1], match.index);
    if (entry) return entry;
  }
  return null;
}

function previousArrayAndBuildDeclaration(chunk, before) {
  const matches = [...chunk.slice(0, before).matchAll(/\b(?:const|let|var)\s+/g)];
  for (let i = matches.length - 1; i >= 0; i--) {
    const statement = declarationStatementAt(chunk, matches[i].index + matches[i][0].length);
    if (!statement?.entries.length || statement.start >= before) continue;
    const partsIndex = statement.entries.findIndex((entry) =>
      entry.expression.trim().startsWith("["),
    );
    if (partsIndex < 0) continue;
    const build = statement.entries.find(
      (entry, index) => index < partsIndex && !entry.expression.trim().startsWith("["),
    );
    if (build) return { build, parts: statement.entries[partsIndex] };
  }
  return null;
}

function validEpisodeQuery(query) {
  return (
    typeof query === "string" &&
    !/[\uD800-\uDFFF]/.test(query) &&
    /\bquery\b/.test(query) &&
    /\bepisode\s*\(\s*showId\s*:\s*\$showId\s+translationType\s*:\s*\$translationType\s+episodeString\s*:\s*\$episodeString\s*\)/.test(
      query,
    ) &&
    !query.includes("${")
  );
}

function evalEpisodeQueryChunk(chunk) {
  const operation =
    /\bepisode\s*\(\s*showId\s*:\s*\$showId\s*translationType\s*:\s*\$translationType\s*episodeString\s*:\s*\$episodeString\s*\)/g;
  const operationInExpression = new RegExp(operation.source);
  for (const match of chunk.matchAll(operation)) {
    const statement = declarationStatementAt(chunk, match.index);
    const candidate = statement?.entries.find((entry) =>
      operationInExpression.test(entry.expression),
    );
    if (!candidate) continue;
    const definitions = new Map();
    const resolving = new Set();
    const resolve = (name, before) => {
      if (definitions.has(name) || resolving.has(name)) return;
      const entry = templateDeclaration(chunk, name, before);
      if (!entry) return;
      resolving.add(name);
      for (const dependency of templateDependencies(entry.expression))
        resolve(dependency, entry.start);
      resolving.delete(name);
      definitions.set(name, entry);
    };
    resolve(candidate.name, candidate.start + 1);
    try {
      const source = [...definitions.values()]
        .map((entry) => `const ${entry.name}=${entry.expression};`)
        .join("\n");
      const query = Function(`${source}\nreturn ${candidate.name}();`)();
      if (validEpisodeQuery(query)) return query;
    } catch {}
  }
  return null;
}

function evalFragmentCryptoChunk(chunk) {
  for (const match of chunk.matchAll(/\bsaltMul\s*:/g)) {
    const declarationAt = chunk.lastIndexOf("const ", match.index);
    const declarationEnd = declarationAt === -1 ? -1 : findStatementEnd(chunk, declarationAt);
    if (declarationEnd === -1 || match.index > declarationEnd) continue;
    const declarations = splitTopLevel(chunk.slice(declarationAt + 6, declarationEnd))
      .map((value) => {
        const entry = /^\s*([A-Za-z_$][\w$]*)\s*=\s*([\s\S]+)$/.exec(value);
        return entry ? { name: entry[1], expression: entry[2] } : null;
      })
      .filter(Boolean);
    const configIndex = declarations.findIndex((entry) =>
      /\b(?:saltMul|fragMul)\s*:/.test(entry.expression),
    );
    if (configIndex < 0) continue;
    const previous = previousArrayAndBuildDeclaration(chunk, declarationAt);
    const partsIndex = declarations
      .slice(0, configIndex)
      .map((entry, index) => ({ entry, index }))
      .reverse()
      .find(({ entry }) => entry.expression.trim().startsWith("["))?.index;
    const build = bootstrapBuildDeclaration(chunk) ?? previous?.build ?? declarations[0];
    const parts = partsIndex === undefined ? previous?.parts : declarations[partsIndex];
    const params = declarations[configIndex];
    if (!build || !parts || !params) continue;
    const expression = `${build.expression};${parts.expression};${params.expression}`;
    const names = new Set(
      [...expression.matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)].map((entry) => entry[1]),
    );
    const helpers = [];
    for (let pass = 0; pass < 8; pass++) {
      let changed = false;
      for (const name of [...names]) {
        if (helpers.some((source) => new RegExp(`function\\s+${name}\\s*\\(`).test(source)))
          continue;
        const source = functionSource(chunk, name);
        if (!source) continue;
        helpers.push(source);
        for (const reference of source.matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)) {
          if (!names.has(reference[1])) {
            names.add(reference[1]);
            changed = true;
          }
        }
      }
      if (
        helpers.some((source) =>
          /^function\s+[A-Za-z_$][\w$]*\s*\(\)\s*\{const\s+e=\[/.test(source),
        )
      )
        break;
      if (!changed) break;
    }
    const tableSource =
      helpers.find((source) =>
        /^function\s+[A-Za-z_$][\w$]*\s*\(\)\s*\{const\s+e=\[/.test(source),
      ) ?? null;
    const tableName = tableSource?.match(/^function\s+([A-Za-z_$][\w$]*)\s*\(/)?.[1] ?? null;
    const tableInitEnd = tableName ? chunk.lastIndexOf(`)(${tableName},`, declarationAt) : -1;
    const tableInitStart = tableInitEnd === -1 ? -1 : findOpeningParen(chunk, tableInitEnd);
    const tableInit =
      tableInitStart === -1 || tableInitEnd === -1
        ? ""
        : chunk.slice(tableInitStart, chunk.indexOf(";", tableInitEnd) + 1);
    if (!tableSource || !tableInit) continue;
    const source = `${tableSource}\n${tableInit}\n${helpers.filter((helper) => !helper.startsWith(`function ${tableName}`)).join("\n")}\nreturn { buildId: (${build.expression}), maskParts: (${parts.expression}), params: (${params.expression}) };`;
    const out = Function(source)();
    const config = out?.params;
    if (
      !out?.buildId ||
      !Array.isArray(out.maskParts) ||
      out.maskParts.length < 4 ||
      !config ||
      typeof config !== "object"
    )
      continue;
    const numeric = ["saltMul", "saltAdd", "fragMul", "fragAdd"];
    if (numeric.some((key) => !Number.isFinite(Number(config[key])))) continue;
    if (
      !Array.isArray(config.parts) ||
      !config.parts.length ||
      typeof config.bootPrefix !== "string" ||
      typeof config.join !== "string"
    )
      continue;
    return {
      scheme: "fragments",
      buildId: String(out.buildId),
      maskParts: out.maskParts.slice(0, 4).map(String),
      saltMul: Number(config.saltMul),
      saltAdd: Number(config.saltAdd),
      fragMul: Number(config.fragMul),
      fragAdd: Number(config.fragAdd),
      bootPrefix: config.bootPrefix,
      join: config.join,
      parts: config.parts.map(String),
      omitEmptyLane: Boolean(config.omitEmptyLane),
    };
  }
  return null;
}

function evalOldCryptoChunk(chunk) {
  const cryptoStart = chunk.search(
    /const\s+[A-Za-z_$][\w$]*\s*=[^;]{0,180}\?"\d+":"",\s*[A-Za-z_$][\w$]*=\[/,
  );
  if (cryptoStart < 0) return null;
  const tableMatches = [
    ...chunk.slice(0, cryptoStart).matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(\)\{const e=\[/g),
  ];
  const tableStart = tableMatches.at(-1)?.index ?? -1;
  const asyncStart = chunk.indexOf("async function", cryptoStart);
  if (tableStart < 0 || asyncStart < 0) return null;
  let code = chunk.slice(tableStart, asyncStart);
  const buildMatch = code.match(
    /const\s+([A-Za-z_$][\w$]*)\s*=([^;]+?\?"(\d+)":"")\s*,\s*([A-Za-z_$][\w$]*)=\[/,
  );
  if (!buildMatch) return null;
  const buildName = buildMatch[1];
  const maskName = buildMatch[4];
  code = code.replace(
    new RegExp(`\\b[A-Za-z_$][\\w$]*\\(\\);\\s*const\\s+${buildName}=`),
    `const ${buildName}=`,
  );
  code = code.replace(new RegExp(`const\\s+${buildName}=`), `var ${buildName}=`);
  code = code.replace(new RegExp(`,\\s*${maskName}=\\[`), `;var ${maskName}=[`);
  code += `\nreturn { buildId: ${buildName}, maskParts: ${maskName} };`;
  return normalizeCryptoConfig(Function(code)());
}

function evalModernCryptoChunk(chunk) {
  const cryptoStart = chunk.search(
    /const\s+[A-Za-z_$][\w$]*\s*=[^;]{0,220}\?"\d+":"",\s*[A-Za-z_$][\w$]*=\[/,
  );
  if (cryptoStart < 0) return null;
  const wrapperMatch = [
    ...chunk.slice(0, cryptoStart).matchAll(/const\s+[A-Za-z_$][\w$]*=\(function\(\)\{/g),
  ].at(-1);
  const wrapperStart = wrapperMatch?.index ?? -1;
  const tableMatch = [
    ...chunk
      .slice(0, wrapperStart)
      .matchAll(/function\s+[A-Za-z_$][\w$]*\s*\(\)\{const\s+[A-Za-z_$][\w$]*=\[/g),
  ].at(-1);
  const tableStart = tableMatch?.index ?? -1;
  const decoderMatch = [
    ...chunk
      .slice(0, tableStart)
      .matchAll(
        /function\s+[A-Za-z_$][\w$]*\s*\([A-Za-z_$][\w$]*(?:,[A-Za-z_$][\w$]*)?\)\{return\s+[A-Za-z_$][\w$]*=[A-Za-z_$][\w$]*-\d+,[A-Za-z_$][\w$]*\(\)\[[A-Za-z_$][\w$]*\]\}/g,
      ),
  ].at(-1);
  const tiStart = decoderMatch?.index ?? -1;
  const asyncStart = chunk.indexOf("async function", cryptoStart);
  if (tiStart < 0 || wrapperStart < 0 || asyncStart < 0) return null;
  const head = chunk.slice(tiStart, wrapperStart);
  let body = chunk.slice(cryptoStart, asyncStart);
  const buildMatch = body.match(/const\s+([A-Za-z_$][\w$]*)=/);
  const maskMatch = body.match(/,([A-Za-z_$][\w$]*)=\[/);
  const maskFunction = body.match(
    /function\s+([A-Za-z_$][\w$]*)\s*\([^)]*=\s*([A-Za-z_$][\w$]*)\)/,
  );
  if (!buildMatch || !maskMatch || !maskFunction) return null;
  const buildName = buildMatch[1];
  const maskName = maskMatch[1];
  const maskFunctionName = maskFunction[1];
  body = body.replace(new RegExp(`const\\s+${buildName}=`), `var ${buildName}=`);
  body = body.replace(new RegExp(`,${maskName}=\\[`), `;var ${maskName}=[`);
  body += `\nreturn { buildId: ${buildName}, maskParts: ${maskName}, mask: Array.from(${maskFunctionName}(${buildName}) || []) };`;
  return normalizeCryptoConfig(Function(head + body)());
}

function evalCryptoChunk(chunk) {
  try {
    const config = evalFragmentCryptoChunk(chunk);
    if (config) return config;
  } catch {}
  try {
    return evalModernCryptoChunk(chunk);
  } catch {}
  try {
    return evalOldCryptoChunk(chunk);
  } catch {}
  return null;
}

async function fetchText(url, headers = {}) {
  const res = await sessionFetch(url, { headers: { Referer: `${REFERER}/`, ...headers } });
  if (!res.ok) throw new Error(`Fetch ${res.status}: ${url}`);
  return res.text();
}

async function fetchWithTimeout(url, options = {}, timeout = EXTRACT_TIMEOUT_MS) {
  const res = await request(url, { ...options, timeout });
  storeCookies(res.headers);
  return res;
}

function appEntryUrl(html) {
  const entry = html.match(
    /(?:import\(|src=)["']([^"']+\/_app\/immutable\/entry\/app\.[^"']+\.js)["']/,
  )?.[1];
  return entry ? new URL(entry, REFERER).toString() : null;
}

function chunkImports(chunk) {
  return [
    ...chunk.text.matchAll(/(?:import\(|from\s*)["']([^"']+\.js)["']/g),
    ...chunk.text.matchAll(/["'](\.\.\/(?:chunks|nodes)\/[^"'\n]+\.js)["']/g),
  ]
    .map((match) => match[1])
    .filter((value) => value.startsWith(".") || value.startsWith("/"))
    .map((value) => new URL(value, chunk.url).toString());
}

function discoverApp(force = false) {
  if (!force && app && Date.now() - app.checkedAt < CONFIG_CHECK_MS) return Promise.resolve(app);
  return dedupe(`mkissa:discover:${force}`, () => loadApp(force));
}

async function loadApp(force) {
  try {
    const entryUrl = new URL(`${REFERER}/`);
    if (force) entryUrl.searchParams.set("_mkissa", String(Date.now()));
    const html = await fetchText(entryUrl, {
      Accept: "text/html,*/*",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    });
    const appUrl = appEntryUrl(html);
    if (!appUrl) throw new Error("MKissa app entry not found");
    if (!force && app?.appUrl === appUrl) {
      app.checkedAt = Date.now();
      return app;
    }
    let config = null;
    let query = null;
    const queue = [appUrl];
    const seen = new Set();
    while (queue.length && seen.size < DISCOVERY_LIMIT && !config) {
      const batch = queue
        .splice(0, DISCOVERY_CONCURRENCY)
        .filter((url) => !seen.has(url) && seen.add(url));
      const chunks = await Promise.all(
        batch.map((url) =>
          fetchText(url, JS_ACCEPT).then(
            (text) => ({ url, text }),
            () => null,
          ),
        ),
      );
      for (const chunk of chunks) {
        if (!chunk) continue;
        for (const next of chunkImports(chunk)) if (!seen.has(next)) queue.push(next);
        query ??= evalEpisodeQueryChunk(chunk.text);
        if (!config && /client-crypto|x-aa-boot|aaReq|partB/.test(chunk.text))
          config = evalCryptoChunk(chunk.text);
      }
    }
    if (!config) throw new Error("MKissa crypto chunk not found");
    app = { ...config, appUrl, query: query ?? episodeQuery(), checkedAt: Date.now() };
    return app;
  } catch (error) {
    app = null;
    throw error;
  }
}

function buildMaskSeed(buildId) {
  const n = String(buildId || "");
  const out = Buffer.alloc(32);
  for (let i = 0; i < 32; i++) {
    out[i] = (n.charCodeAt(i % n.length) || 0) ^ ((i * 17 + 31) & 255);
  }
  return out;
}

function buildMask(config) {
  const { buildId, maskParts } = config;
  if (config.scheme === "fragments") {
    const salt = Buffer.alloc(32);
    const name = String(buildId || "");
    for (let i = 0; i < salt.length; i++) {
      salt[i] =
        (name.charCodeAt(i % name.length) || 0) ^ ((i * config.saltMul + config.saltAdd) & 255);
    }
    const out = Buffer.alloc(32);
    for (let i = 0; i < maskParts.length; i++) {
      const part = Buffer.from(maskParts[i], "base64");
      const offset = i * 8;
      for (let j = 0; j < 8; j++) {
        out[offset + j] =
          part[j] ^ salt[offset + j] ^ ((i * config.fragMul + j * config.fragAdd) & 255);
      }
    }
    return out;
  }
  const seed = buildMaskSeed(buildId);
  const out = Buffer.alloc(32);
  for (let i = 0; i < maskParts.length; i++) {
    const part = Buffer.from(maskParts[i], "base64");
    const offset = i * 8;
    for (let j = 0; j < 8; j++) {
      out[offset + j] = part[j] ^ seed[offset + j] ^ ((i * 41 + j * 7) & 255);
    }
  }
  return out;
}

function currentEpochs(now = Date.now()) {
  const epoch = Math.floor(now / BOOT_EPOCH_MS);
  const previousGrace =
    now - epoch * BOOT_EPOCH_MS < BOOT_GRACE_MS && epoch > 0 ? epoch - 1 : epoch;
  return [...new Set([previousGrace, epoch])];
}

function makeBootToken(config, epoch, lane = CONTENT_LANE) {
  const mask = buildMask(config);
  const bootKey = hmacBytes(mask, `${config.bootPrefix ?? "aa-boot:"}${config.buildId}`);
  if (config.scheme !== "fragments") {
    return hmacBytes(
      bootKey,
      `${config.buildId}:${KEY_GROUP}:${REFERER_HOST}:${epoch}:${lane}`,
    ).toString("hex");
  }
  const fields = {
    buildId: config.buildId,
    group: KEY_GROUP,
    host: REFERER_HOST,
    epoch: String(epoch),
    lane: String(lane || ""),
  };
  const parts =
    config.omitEmptyLane && !fields.lane
      ? config.parts.filter((part) => part !== "lane")
      : config.parts;
  return hmacBytes(bootKey, parts.map((part) => fields[part] ?? "").join(config.join)).toString(
    "hex",
  );
}

function isUnknownBuildId(raw) {
  try {
    return JSON.parse(raw)?.error === "unknown_build_id";
  } catch {
    return /unknown_build_id/i.test(raw);
  }
}

async function fetchBootstrap(lane = CONTENT_LANE, force = false) {
  let lastError = null;
  for (let refresh = 0; refresh < 2; refresh++) {
    const config = await discoverApp(force || refresh > 0);
    let retryWithFreshEntry = false;
    for (const epoch of currentEpochs()) {
      const res = await sessionFetch(
        `${API}/client-crypto/v1/bootstrap?buildId=${encodeURIComponent(config.buildId)}&k=${encodeURIComponent(lane)}`,
        {
          headers: {
            Referer: `${REFERER}/`,
            Origin: REFERER,
            "x-build-id": config.buildId,
            "x-aa-boot": makeBootToken(config, epoch, lane),
          },
        },
      );
      const raw = await res.text();
      if (!res.ok) {
        lastError = new Error(`Bootstrap ${res.status}: ${raw.slice(0, 180)}`);
        if (isUnknownBuildId(raw)) {
          app = null;
          retryWithFreshEntry = true;
          break;
        }
        continue;
      }
      const data = JSON.parse(raw);
      if (!data?.partB) {
        lastError = new Error("Bootstrap missing partB");
        continue;
      }
      return { ...data, ...config, lane, buildId: config.buildId };
    }
    if (!retryWithFreshEntry) break;
  }
  throw lastError || new Error("MKissa bootstrap failed");
}

function deriveLaneKey(partB, config) {
  const encrypted = Buffer.from(partB, "base64");
  const mask = buildMask(config);
  const key = Buffer.alloc(32);
  for (let i = 0; i < 32; i++) {
    key[i] = encrypted[i] ^ mask[i % mask.length];
  }
  return key;
}

async function getLaneKey(lane = CONTENT_LANE, force = false) {
  const boot = await fetchBootstrap(lane, force);
  return { key: deriveLaneKey(boot.partB, boot), epoch: boot.epoch, buildId: boot.buildId };
}

function makeAaReq(key, epoch, buildId, queryHash, lane = CONTENT_LANE) {
  const ts = Math.floor(Date.now() / AA_REQ_MS) * AA_REQ_MS;
  const payload = Buffer.from(JSON.stringify({ v: 1, ts, epoch, buildId, qh: queryHash, k: lane }));
  const iv = crypto
    .createHash("sha256")
    .update(`${epoch}:${buildId}:${queryHash}:${ts}:${lane}`)
    .digest()
    .subarray(0, 12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([cipher.update(payload), cipher.final(), cipher.getAuthTag()]);
  return Buffer.concat([Buffer.from([1]), iv, body]).toString("base64");
}

function decryptTobeparsed(b64, key) {
  const buf = Buffer.from(b64, "base64");
  const version = buf[0];
  if (version !== 1) throw new Error(`Unsupported MKissa encryption version: ${version}`);
  const iv = buf.subarray(1, 13);
  const body = buf.subarray(13);
  const ct = body.subarray(0, body.length - 16);
  const tag = body.subarray(body.length - 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8"));
}

function episodeQuery() {
  const zt = `
tbObj {
  u
  sm
  md
  ts
}
`;
  const pu = `
_id
name
englishName
nativeName
slugTime
`;
  const xa = `
${pu}
thumbnail
${zt}
lastEpisodeInfo
lastEpisodeDate
type
season
score
airedStart
availableEpisodes
episodeDuration
episodeCount
lastUpdateEnd
characterCount
`;
  const ef = `
  _id
  username
  displayName
  createdAt
  picture
  reputation
  roleLevel

  
  brief
  followerCount
  followingCount
  pDec
  equippedBadgeKey
  equippedBadge {
    key
    name
    rank
    iconPath
    date
  }
  ugcContributorStats {
    mediaEditReviewSubmitCount
    mediaEditApprovedCount
    mediaEditRejectedCount
    mediaEditAppliedCount
    mediaEditContributionPoints
    mediaEditModContributionPoints
  }

  hideMe
`;
  const fr = `
views
likesCount
commentCount
dislikesCount
boostsCount
reviewCount
userScoreCount
userScoreTotalValue
userScoreAverValue
viewers{
firstViewers{
viewCount
lastWatchedDate
user{
${ef}
}
}
recViewers{
viewCount
lastWatchedDate
user{
${ef}
}
}
}
`;
  return `
query(
$showId: String!
$translationType: VaildTranslationTypeEnumType!
$episodeString: String!
) {
episode(
showId: $showId
translationType: $translationType
episodeString: $episodeString
) {
episodeString
uploadDate
sourceUrls
thumbnail
notes
show{
${xa}
description
broadcastInterval
banner
characters
availableEpisodesDetail
nameOnlyString
characters
isAdult
relatedShows
relatedMangas
altNames
disqusIds
}
pageStatus{
_id
notes
pageId
showId
${fr}
}
episodeInfo{
notes
thumbnails
${zt}
vidInforssub
uploadDates
vidInforsdub
vidInforsraw
description
}
versionFix
}
}
`;
}

async function apiPost(query, variables, options = {}) {
  const config = options.buildId ? options : await discoverApp();
  const body = options.extensions
    ? { query, variables, extensions: options.extensions }
    : { query, variables };
  const res = await apiSessionFetch(API_URL, {
    method: "POST",
    headers: apiHeaders(config.buildId, {
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  if (!res.ok) {
    const err = new Error(`API POST ${res.status}`);
    err.rawBody = raw;
    throw err;
  }
  const json = JSON.parse(raw);
  if (json.errors?.length) {
    const messages = json.errors.map((e) => e.message || e.extensions?.code || "GraphQL error");
    const err = new Error(messages.join(" · "));
    if (messages.includes("NEED_CAPTCHA") || messages.includes("CAPTCHA_INVALID"))
      err.code = "NEED_CAPTCHA";
    err.rawBody = raw;
    err.graphql = json;
    throw err;
  }
  return json.data;
}

function unwrap(data, key) {
  return data?.tobeparsed ? decryptTobeparsed(data.tobeparsed, key) : data;
}

function captchaError(rawBody) {
  return Object.assign(new Error("MKissa requested captcha"), { code: "NEED_CAPTCHA", rawBody });
}

function captchaFailure(reason, rawBody) {
  captchaRetryAt = Date.now() + CAPTCHA_BACKOFF_MS;
  Logger.warn(`[anivexa] mkissa captcha ${reason}`);
  return captchaError(rawBody);
}

async function readCaptchaToken(page) {
  await page.goto(CAPTCHA_ENDPOINT, {
    referer: `${REFERER}/`,
    waitUntil: "domcontentloaded",
    timeout: FETCH_TIMEOUT_MS,
  });
  const solved = await page.waitForFunction(
    () => globalThis.document.querySelector('.cf-turnstile [name="cf-turnstile-response"]')?.value,
    { polling: 250, timeout: CAPTCHA_TIMEOUT_MS },
  );
  return solved.jsonValue();
}

async function solveCaptcha() {
  const started = Date.now();
  let timer;
  const expired = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("timed out")), CAPTCHA_DEADLINE_MS);
  });
  const token = await Promise.race([withPage(readCaptchaToken), expired]).finally(() =>
    clearTimeout(timer),
  );
  Logger.debug(`[anivexa] mkissa captcha solved in ${Date.now() - started}ms`);
  return { token, provider: CAPTCHA_PROVIDER };
}

async function passCaptcha(post, rawBody) {
  if (Date.now() < captchaRetryAt) throw captchaError(rawBody);
  const captcha = await solveCaptcha().catch((error) => {
    throw captchaFailure(`not solved: ${error.message}`, rawBody);
  });
  return post(captcha).catch((error) => {
    throw error.code === "NEED_CAPTCHA" ? captchaFailure("rejected", error.rawBody) : error;
  });
}

function retryDelay(message) {
  const seconds = /too many requests\D*(\d+)\s*second/i.exec(message ?? "")?.[1];
  return seconds === undefined ? 0 : Math.max(Number(seconds), 1) * 1000;
}

async function retryRateLimited(task) {
  const deadline = Date.now() + RATE_LIMIT_WAIT_MS;
  for (;;) {
    try {
      return await task();
    } catch (error) {
      const delay = retryDelay(error?.message);
      if (!delay || Date.now() + delay > deadline) throw error;
      Logger.debug(`[anivexa] mkissa rate limited, retrying in ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function apiGet(url, buildId) {
  const res = await apiSessionFetch(url, { headers: apiHeaders(buildId) });
  const raw = await res.text();
  if (!res.ok) throw Object.assign(new Error(`API ${res.status}`), { rawBody: raw });
  const json = JSON.parse(raw);
  const messages = json.errors?.map((e) => e.message || e.extensions?.code).filter(Boolean) || [];
  if (messages.some(retryDelay))
    throw Object.assign(new Error(messages.join(" · ")), { rawBody: raw });
  return { raw, json, messages };
}

async function apiEpisode(query, variables, { force = false, captcha = null, lane = null } = {}) {
  const hash = sha256Hex(query);
  const { key, epoch, buildId } = !force && lane ? lane : await getLaneKey(CONTENT_LANE, force);
  const extensions = (solved) => ({
    persistedQuery: { version: 1, sha256Hash: hash },
    k: CONTENT_LANE,
    aaReq: makeAaReq(key, epoch, buildId, hash, CONTENT_LANE),
    ...(solved ? { captcha: solved } : {}),
  });
  const post = (solved = captcha) =>
    retryRateLimited(async () =>
      unwrap(await apiPost(query, variables, { buildId, extensions: extensions(solved) }), key),
    );
  if (captcha) return post();
  const { raw, json, messages } = await retryRateLimited(() =>
    apiGet(
      `${API_URL}?variables=${encodeURIComponent(JSON.stringify(variables))}&extensions=${encodeURIComponent(JSON.stringify(extensions()))}`,
      buildId,
    ),
  );
  if (messages.includes("NEED_CAPTCHA")) return passCaptcha(post, raw);
  if (
    messages.includes("PersistedQueryNotFound") ||
    messages.some((message) => /Context creation failed/i.test(message))
  )
    return post().catch((error) => {
      if (error.code !== "NEED_CAPTCHA") throw error;
      return passCaptcha(post, error.rawBody);
    });
  if (messages.some((message) => /^AA_CRYPTO_/.test(message))) {
    if (!force) return apiEpisode(query, variables, { force: true });
    throw Object.assign(new Error(messages.join(" · ")), { rawBody: raw });
  }
  if (json.data?.tobeparsed) return decryptTobeparsed(json.data.tobeparsed, key);
  if (messages.length) throw Object.assign(new Error(messages.join(" · ")), { rawBody: raw });
  return json.data;
}

async function searchMkissa(query, mode = "sub") {
  const gql = `query($search:SearchInput $limit:Int $page:Int $translationType:VaildTranslationTypeEnumType $countryOrigin:VaildCountryOriginEnumType){shows(search:$search limit:$limit page:$page translationType:$translationType countryOrigin:$countryOrigin){edges{_id name englishName nativeName slugTime availableEpisodes availableEpisodesDetail aniListId __typename}}}`;
  const data = await apiPost(gql, {
    search: { allowAdult: false, allowUnknown: false, query },
    limit: 40,
    page: 1,
    translationType: mode,
    countryOrigin: "ALL",
  });
  return data?.shows?.edges ?? [];
}

function queued(task) {
  const run = episodeQueue.then(task);
  episodeQueue = run.catch(() => {});
  return run;
}

async function getEpisodeSources(showId, epNum, audio, captcha, warm) {
  const [{ query }, lane] = await Promise.all([
    discoverApp(),
    getLaneKey(CONTENT_LANE),
    captcha ? null : warm(),
  ]);
  const variables = { showId, translationType: audio, episodeString: String(epNum) };
  const data = await queued(() => apiEpisode(query, variables, { captcha, lane }));
  return data?.episode ?? null;
}

function slugifyTitle(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function warmWatchPage(showId, show, epNum, audio) {
  const slug = show?.slugTime || slugifyTitle(show?.englishName || show?.name || show?.nativeName);
  if (!slug || !showId) return;
  await fetchWithTimeout(
    `${REFERER}/anime/${slug}-${showId}/${audio}/${epNum}`,
    {
      headers: browserHeaders({
        Accept: HTML_ACCEPT,
        Referer: `${REFERER}/`,
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      }),
    },
    FETCH_TIMEOUT_MS,
  ).catch(() => null);
}

function normalize(s) {
  return (s || "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

function extractYear(title) {
  const match = title?.match(/\b(19\d{2}|20\d{2})\b/);
  return match ? parseInt(match[1]) : null;
}

function findBestMatch(results, titles, targetYear, targetId) {
  const normalizedTitles = titles.map(normalize).filter(Boolean);
  let bestShow = null;
  let maxScore = -Infinity;
  for (const r of results) {
    if (targetId && r.aniListId && String(r.aniListId) === String(targetId)) return r;
    const names = [r.name, r.englishName, r.nativeName].map(normalize).filter(Boolean);
    let nameScore = names.some((name) => normalizedTitles.includes(name)) ? 100 : 0;
    if (!nameScore) {
      for (const rName of names) {
        for (const t of normalizedTitles) {
          if (t.includes(rName) || rName.includes(t)) {
            const score =
              Math.min(rName.length, t.length) - Math.abs(rName.length - t.length) * 0.1;
            nameScore = Math.max(nameScore, score);
          }
        }
      }
    }
    const rYear = extractYear(r.name) || extractYear(r.englishName) || extractYear(r.nativeName);
    const yearScore = targetYear && rYear ? (rYear === targetYear ? 50 : -200) : 0;
    if (nameScore + yearScore > maxScore) {
      maxScore = nameScore + yearScore;
      bestShow = r;
    }
  }
  return bestShow || results[0];
}

async function resolveMkissaId(anilistId, ctx = {}) {
  const [anizipData, media] = await Promise.all([
    ctx.anizip ?? getAniZip(anilistId),
    ctx.media ?? getMedia(anilistId).catch(() => null),
  ]);
  const anizip = anizipData || {};
  let titles = anizip.titles
    ? [
        anizip.titles.en,
        anizip.titles.ja,
        anizip.titles["x-jat"],
        ...Object.values(anizip.titles),
      ].filter(Boolean)
    : [];
  if (media?.title)
    titles = [
      ...new Set([
        ...[media.title.english, media.title.romaji, media.title.native].filter(Boolean),
        ...titles,
      ]),
    ];
  if (!titles.length && anizip.mappings?.animeplanet_id)
    titles = [
      anizip.mappings.animeplanet_id
        .split(/[-_]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    ];
  if (!titles.length) throw new Error(`Could not resolve titles for AniList ID: ${anilistId}`);
  const results = uniqueBy(
    (await Promise.all(titles.slice(0, 3).map((title) => searchMkissa(title, "sub")))).flat(),
    (result) => result._id,
  );
  if (!results.length) throw new Error(`No MKissa match for "${titles[0]}"`);
  const match = findBestMatch(
    results,
    titles,
    media?.seasonYear || media?.startDate?.year || null,
    anilistId,
  );
  return { showId: match._id, show: match, anizip };
}

async function extractMp4(id) {
  try {
    const r = await fetchWithTimeout(`https://www.mp4upload.com/embed-${id}.html`, {
      headers: { "User-Agent": UA4, Referer: "https://mp4upload.com/" },
    });
    if (!r.ok) return null;
    const h = await r.text();
    const m =
      h.match(/player\.src\s*\(\s*\{[^}]*\bsrc\s*:\s*"([^"]+)"/) ||
      h.match(/"file"\s*:\s*"(https?:[^"]+\.mp4[^"]*)"/) ||
      h.match(/\bsrc\s*:\s*"(https?:[^"]+\.mp4[^"]*)"/);
    return m?.[1]?.replace(/\\/g, "") || null;
  } catch {
    return null;
  }
}

async function extractUns(url) {
  const sources = await extractNova(url, { userAgent: UA4 }).catch(() => null);
  return sources?.[0]?.url ?? null;
}

async function extractOk(id) {
  try {
    const r = await fetchWithTimeout(`https://ok.ru/videoembed/${id}`, {
      headers: { "User-Agent": UA4, Referer: "https://ok.ru/" },
    });
    if (!r.ok) return null;
    const h = await r.text();
    const m = h.match(/ondemandHls\\&quot;:\\&quot;(https?:\/\/.*?)\\&quot;/);
    return m?.[1]?.replace(/\\u0026/g, "&") || null;
  } catch {
    return null;
  }
}

async function extractStreamSB(id) {
  try {
    const baseHeaders = {
      "User-Agent": UA4,
      Referer: `${REFERER}/`,
      watchsb: "streamsb",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
    };
    const r1 = await fetchWithTimeout(`https://streamsb.net/api/v1/video?id=${id}`, {
      headers: baseHeaders,
    });
    const sid = (r1.headers.get("set-cookie") || "").match(/sid=([^;]+)/)?.[1] ?? "";
    const html = await r1.text();
    const m = html.match(/window\.location\.replace\('([^']+)'\)/);
    if (!m) return null;
    const r2 = await fetchWithTimeout(m[1], {
      headers: {
        ...baseHeaders,
        Cookie: `sid=${sid}`,
        Referer: `https://streamsb.net/e/${id}.html`,
      },
    });
    if (!r2.ok) return null;
    const ct = r2.headers.get("content-type") ?? "";
    if (!ct.includes("json")) return null;
    const data = await r2.json();
    return data?.stream_data?.file ?? data?.data?.file ?? null;
  } catch {
    return null;
  }
}

async function extractStreamlare(id) {
  try {
    const r = await fetchWithTimeout("https://streamlare.com/api/video/stream/get", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": UA4,
        Referer: "https://streamlare.com/",
        Origin: "https://streamlare.com",
        Accept: "application/json, */*",
      },
      body: JSON.stringify({ id }),
    });
    if (!r.ok) return null;
    const data = await r.json();
    return data?.data?.file ?? null;
  } catch {
    return null;
  }
}

async function extractClock(url) {
  try {
    const parsed = new URL(url);
    const clockUrl = parsed.pathname.includes("/clock.json")
      ? url
      : url.replace("/clock", "/clock.json");
    const r = await fetchWithTimeout(clockUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
        Referer: "https://allanime.day/player.html",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
      },
    });
    if (!r.ok) return null;
    const data = await r.json();
    const links = Array.isArray(data?.links) ? data.links : [];
    const best = links.find((item) => item?.hls && item?.link) || links.find((item) => item?.link);
    return best?.link || null;
  } catch {
    return null;
  }
}

function embedMediaType(url) {
  if (!url) return null;
  if (url.includes(".m3u8")) return "hls";
  if (url.includes(".mp4")) return "mp4";
  return "direct";
}

async function extractSource(src) {
  let url = src.sourceUrl;
  if (url && url.startsWith("--")) url = decodeHexUrl(url.slice(2));
  if (url && url.startsWith("/apivtwo/clock"))
    url = "https://allanime.day" + url.replace("/clock", "/clock.json");
  if (url && /^https?:\/\/allanime\.day\/apivtwo\/clock(?:\.json)?/i.test(url))
    url = url.replace("/clock?", "/clock.json?");
  let extractedUrl = null;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host === "allanime.day" && /\/apivtwo\/clock(?:\.json)?/i.test(new URL(url).pathname)) {
      extractedUrl = await extractClock(url);
    } else if (src.type === "player") extractedUrl = url;
    else if (host === "mp4upload.com") {
      const m = url.match(/embed-([a-zA-Z0-9]+)\.html/i);
      if (m?.[1]) extractedUrl = await extractMp4(m[1]);
    } else if (/uns\.bio$/i.test(host)) {
      extractedUrl = await extractUns(url);
    } else if (host === "ok.ru") {
      const m = url.match(/\/(?:videoembed\/)?(\d+)(?:[/?#]|$)/i);
      if (m?.[1]) extractedUrl = await extractOk(m[1]);
    } else if (/streamsb\./i.test(host)) {
      const m = url.match(/\/(?:e\/|embed-)([a-zA-Z0-9]+)(?:\.html)?/i);
      if (m?.[1]) extractedUrl = await extractStreamSB(m[1]);
    } else if (/streamlare\./i.test(host)) {
      const m = url.match(/\/e\/([a-zA-Z0-9]+)/i);
      if (m?.[1]) extractedUrl = await extractStreamlare(m[1]);
    }
  } catch {}
  return {
    name: src.sourceName || "",
    url,
    extractedUrl,
    extractedType: embedMediaType(extractedUrl),
    type: src.type,
    priority: src.priority,
    headers: {
      Referer: REFERER,
      "User-Agent": UA4,
    },
    downloads: src.downloads || null,
  };
}

export async function getEpisodes(anilistId, ctx = {}) {
  const { showId, show, anizip } = await resolveMkissaId(anilistId, ctx);
  const detail = show.availableEpisodesDetail || {};
  const build = (numbers, audio) =>
    (numbers || [])
      .map(Number)
      .sort((a, b) => a - b)
      .map((number) => {
        const meta = anizip.episodes?.[String(number)] ?? {};
        return {
          id: watchId("mkissa", anilistId, audio, number),
          number,
          title: meta.title?.en || meta.title?.["x-jat"] || null,
          duration: meta.runtime ?? meta.length ?? 0,
          audio,
          filler: meta.filler ?? false,
          uncensored: false,
          description: meta.overview || meta.summary || null,
          image: meta.image || anizip.images?.cover || null,
          airDate: meta.airdate || meta.aired || null,
        };
      });
  return {
    meta: { id: showId, title: show.englishName || show.name },
    episodes: { sub: build(detail.sub, "sub"), dub: build(detail.dub, "dub"), raw: [] },
  };
}

function readCaptcha(request, url) {
  const token =
    url.searchParams.get("captchaToken") ||
    url.searchParams.get("turnstileToken") ||
    request?.headers.get("x-captcha-token") ||
    request?.headers.get("cf-turnstile-response");
  const provider =
    url.searchParams.get("captchaProvider") ||
    request?.headers.get("x-captcha-provider") ||
    "turnstile1";
  return token ? { token, provider } : null;
}

function watchPath(next, basePath) {
  const match = String(next || "").match(
    /^((?:\/[\w-]+)*)(\/watch\/mkissa\/\d+\/(?:sub|dub)\/mkissa-\d+\/?)$/,
  );
  return match && (!match[1] || match[1] === basePath) ? `${basePath}${match[2]}` : "";
}

function script(value) {
  return JSON.stringify(value).replace(/</g, "\\x3c");
}

export function captchaPage(url, basePath = "") {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MKissa Security Check</title>
<style>
body{margin:0;font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#101114;color:#f5f5f5;display:grid;place-items:center;min-height:100vh}
main{width:min(720px,calc(100vw - 32px))}
h1{font-size:20px;font-weight:650;margin:0 0 14px}
#captcha-root{min-height:160px}
iframe{width:100%;min-height:180px;border:0;border-radius:8px;background:white}
pre{white-space:pre-wrap;word-break:break-word;background:#17191f;border:1px solid #2a2d36;border-radius:8px;padding:14px;max-height:48vh;overflow:auto}
</style>
</head>
<body>
<main>
<h1>MKissa Security Check</h1>
<div id="captcha-root"></div>
<pre id="out">Waiting for captcha...</pre>
</main>
<script>
const next=${script(watchPath(url.searchParams.get("next"), basePath))};
const endpoint=${script(CAPTCHA_ENDPOINT)};
const out=document.getElementById("out");
const root=document.getElementById("captcha-root");
function show(value){out.textContent=typeof value==="string"?value:JSON.stringify(value,null,2)}
function run(token,provider){
  if(!next){show({error:"Missing next watch path"});return}
  const u=new URL(next,location.origin);
  u.searchParams.set("captchaToken",token);
  u.searchParams.set("captchaProvider",provider||"turnstile");
  show("Captcha solved. Retrying watch request...");
  fetch(u).then(r=>r.text().then(t=>{try{show(JSON.parse(t))}catch{show(t)}})).catch(e=>show({error:String(e)}));
}
window.addEventListener("message",event=>{
  if(event.origin!==new URL(endpoint).origin)return;
  const data=event.data;
  if(!data||data.type!=="sitea-captcha-ready")return;
  if(data.error){show({error:data.error});return}
  if(!data.token){show({error:"Captcha token missing"});return}
  run(data.token,data.provider);
});
const iframe=document.createElement("iframe");
iframe.src=endpoint;
iframe.title="Security check";
iframe.loading="eager";
iframe.referrerPolicy="strict-origin-when-cross-origin";
iframe.onerror=()=>show({error:"Failed to load captcha frame"});
root.appendChild(iframe);
</script>
</body>
</html>`;
}

async function resolveWatch(anilistId, audio, episode, captcha) {
  const [{ showId, show }, anizip] = await Promise.all([
    memo(`series:mkissa:${anilistId}`, TTL.identity, async () => {
      const { showId, show } = await resolveMkissaId(anilistId);
      return { showId, show };
    }),
    getAniZip(anilistId),
  ]);
  const data = await getEpisodeSources(showId, episode, audio, captcha, () =>
    warmWatchPage(showId, show, episode, audio),
  );
  if (!data) throw notFound("Episode not found");
  const sources = (await Promise.all((data.sourceUrls || []).map(extractSource))).sort(
    (a, b) => b.priority - a.priority,
  );
  const meta = anizip?.episodes?.[String(episode)] ?? {};
  return {
    anilistId: Number(anilistId),
    mkissaId: showId,
    episode,
    audio,
    intro: meta.intro ?? null,
    outro: meta.outro ?? null,
    sources,
  };
}

export async function watch(anilistId, audio, episode, { url, request, basePath = "" } = {}) {
  const captcha = url ? readCaptcha(request, url) : null;
  const key = `mkissa:watch:${anilistId}:${audio}:${episode}`;
  const cached = recall(key);
  if (cached && !captcha) return cached;
  try {
    const data = await resolveWatch(anilistId, audio, episode, captcha);
    keep(key, data, TTL.watch);
    return data;
  } catch (error) {
    const needsCaptcha = error.code === "NEED_CAPTCHA";
    if (needsCaptcha && cached) return cached;
    const path = `${basePath}/watch/mkissa/${anilistId}/${audio}/mkissa-${episode}`;
    throw Object.assign(error, {
      status: needsCaptcha ? 403 : error.status,
      details: {
        code: error.code ?? null,
        captcha: needsCaptcha
          ? {
              endpoint: CAPTCHA_ENDPOINT,
              provider: "turnstile",
              tokenQuery: "captchaToken",
              tokenHeader: "x-captcha-token",
              solveUrl: `${basePath}/captcha/mkissa?next=${encodeURIComponent(path)}`,
            }
          : null,
      },
    });
  }
}
