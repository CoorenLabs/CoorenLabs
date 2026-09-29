import { webcrypto as crypto } from "node:crypto";
import { fetchJson, UA } from "../core/http.js";

const LABEL = "Byse";
const BLOCKS = 512;
const MASK = BLOCKS - 1;
const ROUNDS = 2;
const MUL_A = 2654435761;
const MUL_B = 2246822519;

function b64uDec(value) {
  return Buffer.from(value, "base64url");
}

function rot(value, shift) {
  return ((value << shift) | (value >>> (32 - shift))) >>> 0;
}

function mix(state) {
  state[0] = (state[0] + state[1]) >>> 0;
  state[3] = rot(state[3] ^ state[0], 16);
  state[2] = (state[2] + state[3]) >>> 0;
  state[1] = rot(state[1] ^ state[2], 12);
  state[0] = (state[0] + state[1]) >>> 0;
  state[3] = rot(state[3] ^ state[0], 8);
  state[2] = (state[2] + state[3]) >>> 0;
  state[1] = rot(state[1] ^ state[2], 7);
}

function hash(bytes) {
  const state = new Uint32Array([1779033703, 3144134277, 1013904242, 2773480762]);
  for (let i = 0; i < bytes.length; i++) {
    state[0] = rot((state[0] + bytes[i]) >>> 0, 7);
    mix(state);
  }
  for (let i = 0; i < 8; i++) mix(state);
  const table = new Uint32Array(BLOCKS);
  for (let i = 0; i < BLOCKS; i++) {
    mix(state);
    table[i] = (state[0] ^ state[2]) >>> 0;
  }
  for (let round = 0; round < ROUNDS; round++) {
    for (let index = 0; index < BLOCKS; index++) {
      let value = rot((table[index] + table[table[index] & MASK]) >>> 0, 13);
      value = (value ^ (Math.imul(table[(index + 1) & MASK], MUL_A) >>> 0)) >>> 0;
      table[index] = value;
      state[0] = (state[0] ^ value) >>> 0;
      mix(state);
    }
  }
  const out = new Uint32Array(8);
  const width = BLOCKS / 8;
  for (let i = 0; i < 8; i++) {
    mix(state);
    let value = state[0];
    for (let index = i * width; index < (i + 1) * width; index++) {
      value = rot((value + table[index]) >>> 0, 5);
      value = (value ^ (Math.imul(table[index], MUL_B) >>> 0)) >>> 0;
    }
    out[i] = (value ^ state[2]) >>> 0;
  }
  return out;
}

function leadingZeros(words) {
  let total = 0;
  for (const word of words) {
    if (word) return total + Math.clz32(word);
    total += 32;
  }
  return total;
}

function solvePoW(nonce, difficulty) {
  const prefix = `${nonce}:`;
  for (let counter = 0; ; counter++) {
    const input = prefix + counter;
    const bytes = new Uint8Array(input.length);
    for (let i = 0; i < input.length; i++) bytes[i] = input.charCodeAt(i) & 255;
    if (leadingZeros(hash(bytes)) >= difficulty) return String(counter);
  }
}

export function canExtractByse(url) {
  return /(?:bysesayeveum\.com|gn1r5n\.org|mfw09\.org)\/e\//i.test(String(url));
}

export async function extractByse(embedUrl, { userAgent = UA, referer } = {}) {
  const code = String(embedUrl).match(/\/e\/([a-z0-9]+)/i)?.[1];
  if (!code) throw new Error(`Cannot extract Byse code from ${embedUrl}`);
  const embedOrigin = new URL(embedUrl).origin;
  const parentUrl = referer || embedUrl;
  const embedHeaders = {
    "X-Embed-Origin": new URL(parentUrl).hostname,
    "X-Embed-Referer": parentUrl,
    "X-Embed-Parent": embedUrl,
  };
  const details = await fetchJson(`${embedOrigin}/api/videos/${code}/embed/details`, {
    label: LABEL,
    headers: { "User-Agent": userAgent, Referer: embedUrl, ...embedHeaders },
  });
  const frameUrl = details.embed_frame_url || embedUrl;
  const frameBase = new URL(frameUrl).origin;
  const post = (path, body, headers = {}) =>
    fetchJson(`${frameBase}${path}`, {
      label: LABEL,
      method: "POST",
      headers: {
        ...(body === undefined
          ? { "Content-Length": "0" }
          : { "Content-Type": "application/json" }),
        Origin: frameBase,
        Referer: frameUrl,
        "User-Agent": userAgent,
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  const challenge = await post("/api/videos/access/challenge");
  const keyPair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
    "sign",
  ]);
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    keyPair.privateKey,
    new TextEncoder().encode(challenge.nonce),
  );
  const attest = await post("/api/videos/access/attest", {
    nonce: challenge.nonce,
    challenge_id: challenge.challenge_id,
    public_key: await crypto.subtle.exportKey("jwk", keyPair.publicKey),
    signature: Buffer.from(signature).toString("base64url"),
  });
  const session = {
    Cookie: `byse_viewer_id=${attest.viewer_id}; byse_device_id=${attest.device_id}`,
    ...embedHeaders,
  };
  const fingerprint = {
    token: attest.token,
    viewer_id: attest.viewer_id,
    device_id: attest.device_id,
    confidence: attest.confidence,
  };
  const captcha = await post(`/api/videos/${code}/embed/captcha`, { fingerprint }, session);
  const verification = await post(
    `/api/videos/${code}/embed/captcha/verify`,
    {
      pow_token: captcha.pow_token,
      solution: solvePoW(captcha.pow_nonce, captcha.pow_difficulty),
      fingerprint,
    },
    session,
  );
  const { playback } = await post(
    `/api/videos/${code}/embed/playback`,
    { fingerprint },
    {
      ...session,
      "X-Captcha-Token": verification.token,
    },
  );
  const keyBytes = Buffer.concat(
    playback.key_parts.map(b64uDec).filter((part) => part.length === 16),
  );
  const aesKey = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, [
    "decrypt",
  ]);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64uDec(playback.iv) },
    aesKey,
    b64uDec(playback.payload),
  );
  return JSON.parse(new TextDecoder().decode(decrypted)).sources.map((item) => ({
    url: item.url,
    type: /\.mp4(?:$|[?#])/i.test(item.url) ? "mp4" : "hls",
    referer: `${frameBase}/`,
  }));
}
