import { webcrypto as crypto } from "node:crypto";
import { fetchJson } from "../core/http.js";
import { balancedEnd } from "../core/utils.js";

const encoder = new TextEncoder();
const WASM_OFFSET = 1000;

async function sha256hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Buffer.from(digest).toString("hex");
}

function bytes(value) {
  return new Uint8Array(Buffer.from(String(value ?? ""), "base64"));
}

async function deriveFields(seed) {
  let first = seed;
  for (let i = 0; i < 3; i++) first = await sha256hex(first + i);
  let second = first;
  for (let i = 0; i < 3; i++) second = await sha256hex(second + i);
  return {
    keyField: `kf_${first.substring(8, 16)}`,
    ivField: `ivf_${first.substring(16, 24)}`,
    containerName: `cd_${first.substring(24, 32)}`,
    arrayName: `ad_${first.substring(32, 40)}`,
    objectName: `od_${first.substring(40, 48)}`,
    tokenField: `${first.substring(48, 64)}_${first.substring(56, 64)}`,
    keyFrag2Field: `${second.substring(0, 16)}_${second.substring(16, 24)}`,
  };
}

function ssrObject(html) {
  const match = html.match(/\{type:"data",data:(\{)/);
  if (!match) throw new Error("Flixcloud SSR data block not found");
  const start = match.index + match[0].length - 1;
  const end = balancedEnd(html, start);
  if (end < 0) throw new Error("Flixcloud SSR brace matching failed");
  return html.slice(start, end);
}

function parseJsLiteral(source) {
  let index = 0;
  const whitespace = () => {
    while (index < source.length && /\s/.test(source[index])) index++;
  };
  const string = (quote) => {
    let out = "";
    index++;
    while (index < source.length && source[index] !== quote) {
      if (source[index] === "\\") {
        index++;
        out += { n: "\n", t: "\t", r: "\r" }[source[index]] ?? source[index];
      } else out += source[index];
      index++;
    }
    index++;
    return out;
  };
  const key = () => {
    whitespace();
    if (source[index] === '"' || source[index] === "'") return string(source[index]);
    const match = source.slice(index, index + 256).match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/);
    if (!match) throw new Error(`Flixcloud SSR bad key at ${index}`);
    index += match[0].length;
    return match[0];
  };
  const LITERALS = [
    ["true", true],
    ["false", false],
    ["null", null],
    ["undefined", null],
    ["!0", true],
    ["!1", false],
  ];
  const value = () => {
    whitespace();
    const char = source[index];
    if (char === "{" || char === "[") {
      const isObject = char === "{";
      const out = isObject ? {} : [];
      const close = isObject ? "}" : "]";
      index++;
      whitespace();
      while (index < source.length && source[index] !== close) {
        if (source[index] === ",") {
          index++;
          whitespace();
          continue;
        }
        if (isObject) {
          const name = key();
          whitespace();
          index++;
          out[name] = value();
        } else out.push(value());
        whitespace();
      }
      index++;
      return out;
    }
    if (char === '"' || char === "'") return string(char);
    for (const [literal, result] of LITERALS) {
      if (source.startsWith(literal, index)) {
        index += literal.length;
        return result;
      }
    }
    const number = source.slice(index, index + 64).match(/^-?[\d.]+(?:[eE][+-]?\d+)?/);
    if (!number) throw new Error(`Flixcloud SSR parse error at ${index}`);
    index += number[0].length;
    return parseFloat(number[0]);
  };
  return value();
}

async function unwrapKeyMaterial(wasm, fragment, keyFragment, token, seed) {
  const { instance } = await WebAssembly.instantiate(wasm, {});
  const { memory, _s, _r } = instance.exports;
  if (!memory.buffer.byteLength) memory.grow(1);
  const length = fragment.length;
  const heap = new Uint8Array(memory.buffer);
  heap.set(fragment, WASM_OFFSET);
  heap.set(keyFragment, WASM_OFFSET + length);
  heap.set(token, WASM_OFFSET + 2 * length);
  _s(seed);
  _r(WASM_OFFSET, WASM_OFFSET + length, WASM_OFFSET + 2 * length, WASM_OFFSET + 3 * length, length);
  const output = WASM_OFFSET + 3 * length;
  return new Uint8Array(memory.buffer).slice(output, output + length);
}

export async function extractFlixcloud(embedHtml, { apiBase, headers = {}, referer } = {}) {
  const data = parseJsLiteral(ssrObject(embedHtml));
  const seed = data.obfuscation_seed;
  if (!seed) throw new Error("Flixcloud obfuscation_seed missing");
  const fields = await deriveFields(seed);
  const object =
    data.obfuscated_crypto_data?.[fields.containerName]?.[fields.arrayName]?.[0]?.[
      fields.objectName
    ];
  if (!object) throw new Error("Flixcloud crypto payload not found");
  const keyFragment = data[fields.keyFrag2Field];
  const token = data[fields.tokenField];
  const wasm = bytes(data.w_payload);
  if (!keyFragment || !token || !wasm.length) throw new Error("Flixcloud key material missing");
  const tokenData = await fetchJson(`${apiBase}/api/m3u8/${token}`, {
    label: "Flixcloud",
    headers: { ...headers, ...(referer ? { Referer: referer } : {}) },
  });
  const [videoKey, tokenKey] = await Promise.all([
    sha256hex(`${token}vid`).then((hash) => hash.substring(0, 10)),
    sha256hex(`${token}key`).then((hash) => hash.substring(0, 10)),
  ]);
  const video = bytes(tokenData[videoKey]);
  const tokenBytes = bytes(tokenData[tokenKey]);
  if (!video.length || !tokenBytes.length) throw new Error("Flixcloud token response incomplete");
  const material = await crypto.subtle.importKey(
    "raw",
    await unwrapKeyMaterial(
      wasm,
      bytes(object[fields.keyField]),
      bytes(keyFragment),
      tokenBytes,
      parseInt(seed.substring(0, 8), 16),
    ),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const derived = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: encoder.encode(seed), iterations: 1e3, hash: "SHA-256" },
      material,
      256,
    ),
  );
  for (let i = 0; i < 32; i++) derived[i] ^= seed.charCodeAt(i % seed.length);
  const aesKey = await crypto.subtle.importKey(
    "raw",
    await crypto.subtle.digest("SHA-256", derived),
    { name: "AES-CBC" },
    false,
    ["decrypt"],
  );
  const plain = await crypto.subtle.decrypt(
    { name: "AES-CBC", iv: bytes(object[fields.ivField]) },
    aesKey,
    video,
  );
  const url = new TextDecoder().decode(plain).trim().replace(/\0+$/, "");
  if (!url.startsWith("http")) throw new Error("Flixcloud decrypted an unexpected value");
  return {
    url,
    subtitles: data.subtitles ?? [],
    thumbnails_vtt: data.thumbnails_vtt ?? null,
    video_title: data.video_title ?? null,
    intro_chapter: data.intro_chapter ?? null,
    outro_chapter: data.outro_chapter ?? null,
    video_id: data.video_id ?? null,
  };
}
