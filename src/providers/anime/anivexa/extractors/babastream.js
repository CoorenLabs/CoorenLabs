import crypto from "node:crypto";
import { availableParallelism } from "node:os";
import { Worker } from "node:worker_threads";
import { fetchJson, fetchText, UA } from "../core/http.js";
import { scriptStrings } from "../core/utils.js";
import { solveProof } from "./proof.js";

const LABEL = "BabaStream";

function parseConfig(html) {
  for (const match of html.matchAll(/\b(?:var|let|const)\s+\w+\s*=\s*(\{[^;]+\})\s*;/g)) {
    try {
      const config = JSON.parse(match[1]);
      if (typeof config.sid === "string" && typeof config.pk === "string") return config;
    } catch {}
  }
  return null;
}

function apiRoutes(html) {
  const routes = [...html.matchAll(/["'](\/[\w/-]*(?:resolve|verify)[\w/-]*)["']/gi)].map(
    (match) => match[1],
  );
  return {
    resolve: routes.find((route) => /resolve/i.test(route)) ?? null,
    verify: routes.find((route) => /verify/i.test(route)) ?? null,
  };
}

function cipherOptions(html, key) {
  const algorithm = html.match(
    /importKey\([^,]+,[^,]+,\s*\{\s*name\s*:\s*["'](AES-[A-Z]+)["']/i,
  )?.[1];
  const ivLength = Number(html.match(/getRandomValues\(new Uint8Array\((\d+)\)\)/)?.[1]);
  const tagLength = Number(html.match(/tagLength\s*:\s*(\d+)/)?.[1]) || 128;
  if (!algorithm || !Number.isInteger(ivLength) || ivLength < 1 || !key.length) return null;
  return {
    cipher: `aes-${key.length * 8}-${algorithm.slice(4).toLowerCase()}`,
    ivLength,
    tagLength: tagLength / 8,
  };
}

function encrypt(value, key, options) {
  const iv = crypto.randomBytes(options.ivLength);
  const cipher = crypto.createCipheriv(options.cipher, key, iv, {
    authTagLength: options.tagLength,
  });
  return Buffer.concat([
    iv,
    cipher.update(value, "utf8"),
    cipher.final(),
    cipher.getAuthTag(),
  ]).toString("base64");
}

function decrypt(value, key, options) {
  const raw = Buffer.from(value, "base64");
  const tagStart = raw.length - options.tagLength;
  if (tagStart <= options.ivLength) throw new Error("BabaStream encrypted payload is invalid");
  const decipher = crypto.createDecipheriv(options.cipher, key, raw.subarray(0, options.ivLength), {
    authTagLength: options.tagLength,
  });
  decipher.setAuthTag(raw.subarray(tagStart));
  return Buffer.concat([
    decipher.update(raw.subarray(options.ivLength, tagStart)),
    decipher.final(),
  ]).toString("utf8");
}

function seededHex(value, length) {
  let state = 2166136261;
  for (let index = 0; index < value.length; index++) {
    state ^= value.charCodeAt(index);
    state += (state << 1) + (state << 4) + (state << 7) + (state << 8) + (state << 24);
  }
  state >>>= 0;
  let output = "";
  while (output.length < length) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    output += state.toString(16).padStart(8, "0");
  }
  return output.slice(0, length);
}

function runWorker(batch) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./proof.js", import.meta.url), {
      workerData: { proofs: batch },
    });
    worker.once("message", resolve);
    worker.once("error", reject);
    worker.once("exit", (code) => {
      if (code !== 0) reject(new Error(`BabaStream proof worker exited with code ${code}`));
    });
  });
}

async function solveProofs(proofs) {
  if (proofs.length < 2)
    return proofs.map(({ index, salt, target }) => ({ index, nonce: solveProof(salt, target) }));
  const workers = Math.min(availableParallelism(), proofs.length);
  const batches = Array.from({ length: workers }, () => []);
  proofs.forEach((proof, index) => batches[index % workers].push(proof));
  const results = await Promise.all(batches.map(runWorker));
  return results.flat().sort((left, right) => left.index - right.index);
}

async function solveChallenge(payload) {
  if (Array.isArray(payload.challenges)) {
    const proofs = payload.challenges.map((challenge, index) => {
      if (challenge?.protocol !== "sha256-pow")
        throw new Error(`Unsupported BabaStream challenge protocol: ${challenge?.protocol}`);
      return { index, salt: challenge.payload.salt, target: challenge.payload.target };
    });
    return (await solveProofs(proofs)).map(({ nonce }) => ({ nonce }));
  }
  const { token, challenge } = payload;
  if (
    !token ||
    !Number.isInteger(challenge?.c) ||
    !Number.isInteger(challenge?.s) ||
    !Number.isInteger(challenge?.d)
  )
    throw new Error("BabaStream challenge is invalid");
  const proofs = Array.from({ length: challenge.c }, (_, index) => ({
    index,
    salt: seededHex(`${token}${index + 1}`, challenge.s),
    target: seededHex(`${token}${index + 1}d`, challenge.d),
  }));
  return (await solveProofs(proofs)).map(({ nonce }) => nonce);
}

async function capToken(html, pageUrl, config, userAgent) {
  const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(
    (match) => new URL(match[1], pageUrl).href,
  );
  const sources = await Promise.all(
    scripts.map((url) =>
      fetchText(url, {
        label: LABEL,
        headers: { "User-Agent": userAgent, Referer: pageUrl.href },
      }).catch(() => ""),
    ),
  );
  const widget = sources.find(
    (script) => /challenge/i.test(script) && /redeem/i.test(script) && /SHA-256/i.test(script),
  );
  const strings = widget
    ? [
        ...scriptStrings(widget),
        ...[...widget.matchAll(/`[^`]*\$\{[^}]+\}([^`]+)`/g)].map((match) => match[1]),
      ]
    : [];
  if (!strings.includes("challenge") || !strings.includes("redeem"))
    throw new Error("BabaStream challenge client not found");
  const headers = {
    "Content-Type": "application/json",
    "User-Agent": userAgent,
    Referer: pageUrl.href,
  };
  const challenge = await fetchJson(new URL("challenge", config.cap), {
    label: LABEL,
    method: "POST",
    headers,
  });
  const redeemed = await fetchJson(new URL("redeem", config.cap), {
    label: LABEL,
    method: "POST",
    headers,
    body: JSON.stringify({ token: challenge.token, solutions: await solveChallenge(challenge) }),
  });
  if (!redeemed?.success || !redeemed.token)
    throw new Error("BabaStream challenge verification failed");
  return redeemed.token;
}

export async function extractBabaStream(embedUrl, { userAgent = UA, referer } = {}) {
  const pageUrl = new URL(String(embedUrl));
  const html = await fetchText(pageUrl, {
    label: LABEL,
    headers: {
      "User-Agent": userAgent,
      Accept: "text/html,*/*",
      Referer: referer ?? `${pageUrl.origin}/`,
    },
  });
  const config = parseConfig(html);
  if (!config?.cap) throw new Error(`BabaStream config not found: ${embedUrl}`);
  const key = Buffer.from(config.pk, "base64");
  const options = cipherOptions(html, key);
  const routes = apiRoutes(html);
  if (!options || !routes.resolve || !routes.verify)
    throw new Error(`BabaStream client routes not found: ${embedUrl}`);
  const call = async (route, body) => {
    const response = await fetchJson(new URL(route, pageUrl), {
      label: LABEL,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": userAgent,
        Referer: pageUrl.href,
      },
      body: JSON.stringify({ s: config.sid, d: encrypt(JSON.stringify(body), key, options) }),
    });
    if (!response?.d) throw new Error("BabaStream response is missing encrypted data");
    return JSON.parse(decrypt(response.d, key, options));
  };
  let resolved = await call(routes.resolve, { ts: Date.now() });
  if (resolved?.t === "error" && /verify/i.test(resolved.m ?? "")) {
    const token = await capToken(html, pageUrl, config, userAgent);
    const verified = await call(routes.verify, { ts: Date.now(), token, mode: "invisible" });
    if (verified?.t !== "ok") throw new Error("BabaStream cap verification failed");
    resolved = await call(routes.resolve, { ts: Date.now() });
  }
  if (!resolved?.u) throw new Error(resolved?.m || "BabaStream did not return a stream");
  return [
    {
      url: resolved.u,
      type: /\.m3u8(?:$|[?&])/i.test(resolved.u) ? "hls" : resolved.t === "embed" ? "embed" : "mp4",
      referer: `${pageUrl.origin}/`,
    },
  ];
}
