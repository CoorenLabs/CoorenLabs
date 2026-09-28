import crypto from "node:crypto";
import vm from "node:vm";
import { memo, TTL } from "../core/cache.js";
import { fetchJson, fetchText, UA } from "../core/http.js";
import { scriptStrings } from "../core/utils.js";

const LABEL = "MegaPlay";

function sourceRoutes(script) {
  const routes = scriptStrings(script)
    .filter((value) => /^stream\/getSources[\w/-]*$/i.test(value))
    .sort((left, right) => left.length - right.length);
  const legacy = routes[0] ?? null;
  const modern = routes.find((route) => route !== legacy && route.startsWith(legacy)) ?? null;
  return { legacy, modern };
}

function keyCandidates(script) {
  const values = scriptStrings(script).filter(
    (item) => Buffer.byteLength(item) > 0 && Buffer.byteLength(item) <= 32,
  );
  return { values, ivs: values.filter((item) => Buffer.byteLength(item) === 16) };
}

function decryptSource(value, candidates) {
  if (!value) return null;
  const encrypted = Buffer.from(value, "base64url");
  if (!encrypted.length || encrypted.length % 16) return null;
  for (const keyValue of candidates.values) {
    const key = Buffer.alloc(32);
    Buffer.from(keyValue).copy(key);
    for (const ivValue of candidates.ivs) {
      try {
        const decipher = crypto.createDecipheriv("aes-256-cbc", key, Buffer.from(ivValue));
        const data = JSON.parse(
          Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8"),
        );
        const source = data?.file ?? data?.url ?? data?.sources?.file ?? data?.sources?.[0]?.file;
        if (typeof source === "string" && source) return source;
      } catch {}
    }
  }
  return null;
}

function signingKey(script) {
  const objectName = script.match(
    /\blet\s+([A-Za-z_$][\w$]*)\s*;\s*!\s*function\s*\(\)\s*\{/i,
  )?.[1];
  const entry = script.match(/\bconst\s+[A-Za-z_$][\w$]*\s*=\s*new URLSearchParams\b/);
  const encoderIndex = script.indexOf("new TextEncoder();return");
  if (!objectName || !entry || encoderIndex < 0) return null;
  const keyVar = script
    .slice(encoderIndex, encoderIndex + 1600)
    .match(/new TextEncoder\(\);return[\s\S]{0,1200}?\]\(([A-Za-z_$][\w$]*)\),\{/i)?.[1];
  if (!keyVar) return null;
  const keyExpression = script.match(
    new RegExp(
      `(?:const|let|var)\\s+${keyVar}\\s*=\\s*(${objectName}\\.[A-Za-z_$][\\w$]*\\(\\d+\\))`,
    ),
  )?.[1];
  if (!keyExpression) return null;
  try {
    const context = {
      console,
      decodeURI,
      encodeURI,
      Math,
      String,
      Array,
      Object,
      RegExp,
      Error,
      SyntaxError,
    };
    context.globalThis = context;
    vm.runInNewContext(
      `${script.slice(0, entry.index)};globalThis.__signingKey=${keyExpression};`,
      context,
      { timeout: 5000 },
    );
    return typeof context.__signingKey === "string" ? context.__signingKey : null;
  } catch {
    return null;
  }
}

function sign(value, key) {
  if (!value || !key || /[?&]token=/i.test(value)) return value;
  const match = String(value).match(/\/([a-f0-9]{32})\/([a-f0-9]{32})\//i);
  if (!match) return value;
  const payload = `${Math.floor(Date.now() / 1000) + 90}|${match[1].toLowerCase()}/${match[2].toLowerCase()}`;
  const signature = crypto.createHmac("sha256", key).update(payload).digest("base64url");
  const endpoint = new URL(value);
  endpoint.searchParams.set("token", `${Buffer.from(payload).toString("base64url")}.${signature}`);
  return endpoint.href;
}

function analyzeScript(url, headers) {
  return memo(`megaplay:${url}`, TTL.hour, async () => {
    const script = await fetchText(url, { label: LABEL, headers });
    const isClient = /getSources/i.test(script) && /AES-CBC/i.test(script);
    const isSigner = script.includes("[a-f0-9]{32}") && script.includes("token=");
    return {
      client: isClient ? { routes: sourceRoutes(script), keys: keyCandidates(script) } : null,
      signingKey: isSigner ? signingKey(script) : null,
    };
  });
}

export function canExtractMegaPlay(url) {
  return /megaplay\.[^/]+\/stream\//i.test(String(url));
}

export async function extractMegaPlay(embedUrl, { userAgent = UA, referer } = {}) {
  const pageUrl = new URL(String(embedUrl));
  const pageHtml = await fetchText(pageUrl, {
    label: LABEL,
    headers: {
      "User-Agent": userAgent,
      Accept: "text/html,*/*",
      Referer: referer ?? `${pageUrl.origin}/`,
    },
  });
  const fileId = pageHtml.match(/data-id=["']([^"']+)["']/i)?.[1];
  if (!fileId) throw new Error(`MegaPlay file id not found: ${embedUrl}`);
  const scripts = await Promise.all(
    [...pageHtml.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map((match) =>
      analyzeScript(new URL(match[1], pageUrl).href, {
        "User-Agent": userAgent,
        Referer: pageUrl.href,
      }).catch(() => null),
    ),
  );
  const client = scripts.find((script) => script?.client)?.client;
  if (!client) throw new Error(`MegaPlay client script not found: ${embedUrl}`);
  const { legacy, modern } = client.routes;
  if (!legacy && !modern) throw new Error(`MegaPlay source routes not found: ${embedUrl}`);
  const key = scripts.find((script) => script?.signingKey)?.signingKey ?? null;
  const headers = {
    "User-Agent": userAgent,
    Accept: "application/json,*/*",
    Referer: pageUrl.href,
    "X-Requested-With": "XMLHttpRequest",
  };
  const load = (route) => {
    if (!route) return null;
    const endpoint = new URL(route, pageUrl.origin);
    endpoint.searchParams.append("id", fileId);
    endpoint.searchParams.append("id", fileId);
    return fetchJson(endpoint, { label: LABEL, headers }).catch(() => null);
  };
  const [modernData, legacyData] = await Promise.all([load(modern), load(legacy)]);
  const sources = [
    { data: modernData, variant: "modern" },
    { data: legacyData, variant: "legacy" },
  ]
    .map(({ data, variant }) => ({
      url: sign(data?.sources?.file ?? decryptSource(data?.enc, client.keys), key),
      variant,
    }))
    .filter(
      (source, index, all) =>
        source.url && all.findIndex((item) => item.url === source.url) === index,
    );
  if (!sources.length) throw new Error(`MegaPlay response has no sources: ${embedUrl}`);
  const metadata = modernData ?? legacyData ?? {};
  return {
    origin: pageUrl.origin,
    sources,
    tracks: Array.isArray(metadata.tracks) ? metadata.tracks : [],
    intro: metadata.intro ?? null,
    outro: metadata.outro ?? null,
  };
}
