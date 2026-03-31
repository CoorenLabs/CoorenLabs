/**
 * MangaFire VRF generation.
 *
 * Ported and adapted from:
 * https://github.com/m2k3a/mangayomi-extensions/blob/main/javascript/manga/src/all/mangafire.js (Apache-2.0)
 *
 * Original Credits:
 * https://github.com/keiyoushi/extensions-source/pull/10988
 */

const CONST = {
  rc4Keys: [
    "FgxyJUQDPUGSzwbAq/ToWn4/e8jYzvabE+dLMb1XU1o=",
    "CQx3CLwswJAnM1VxOqX+y+f3eUns03ulxv8Z+0gUyik=",
    "fAS+otFLkKsKAJzu3yU+rGOlbbFVq+u+LaS6+s1eCJs=",
    "Oy45fQVK9kq9019+VysXVlz1F9S1YwYKgXyzGlZrijo=",
    "aoDIdXezm2l3HrcnQdkPJTDT8+W6mcl2/02ewBHfPzg=",
  ],
  seeds32: [
    "yH6MXnMEcDVWO/9a6P9W92BAh1eRLVFxFlWTHUqQ474=",
    "RK7y4dZ0azs9Uqz+bbFB46Bx2K9EHg74ndxknY9uknA=",
    "rqr9HeTQOg8TlFiIGZpJaxcvAaKHwMwrkqojJCpcvoc=",
    "/4GPpmZXYpn5RpkP7FC/dt8SXz7W30nUZTe8wb+3xmU=",
    "wsSGSBXKWA9q1oDJpjtJddVxH+evCfL5SO9HZnUDFU8=",
  ],
  prefixKeys: ["l9PavRg=", "Ml2v7ag1Jg==", "i/Va0UxrbMo=", "WFjKAHGEkQM=", "5Rr27rWd"],
};

const toBytes = (str: string): number[] => Array.from(str, (c) => c.charCodeAt(0) & 0xff);
const fromBytes = (bytes: number[]): string =>
  bytes.map((b) => String.fromCharCode(b & 0xff)).join("");

const b64encode = (data: string): string => Buffer.from(data, "base64").toString("binary");
const b64decode = (s: string): string => Buffer.from(s, "binary").toString("base64");

const rc4Bytes = (key: string, input: number[]): number[] => {
  const s = Array.from({ length: 256 }, (_, i) => i);
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + key.charCodeAt(i % key.length)) & 0xff;
    [s[i], s[j]] = [s[j], s[i]];
  }
  const out = new Array(input.length);
  let i = 0;
  j = 0;
  for (let y = 0; y < input.length; y++) {
    i = (i + 1) & 0xff;
    j = (j + s[i]) & 0xff;
    [s[i], s[j]] = [s[j], s[i]];
    const k = s[(s[i] + s[j]) & 0xff];
    out[y] = ((input[y] || 0) ^ k) & 0xff;
  }
  return out;
};

const transform = (
  input: number[],
  initSeedBytes: number[],
  prefixKeyBytes: number[],
  prefixLen: number,
  schedule: Array<(c: number) => number>,
): number[] => {
  const out: number[] = [];
  for (let i = 0; i < input.length; i++) {
    if (i < prefixLen) out.push(prefixKeyBytes[i] || 0);
    const op = schedule[i % 10];
    if (op) {
      out.push(op(((input[i] || 0) ^ (initSeedBytes[i % 32] || 0)) & 0xff) & 0xff);
    }
  }
  return out;
};

const add8 = (n: number) => (c: number) => (c + n) & 0xff;
const sub8 = (n: number) => (c: number) => (c - n + 256) & 0xff;
const rotl8 = (n: number) => (c: number) => ((c << n) | (c >>> (8 - n))) & 0xff;
const rotr8 = (n: number) => (c: number) => ((c >>> n) | (c << (8 - n))) & 0xff;

const bytesFromBase64 = (b64: string): number[] => toBytes(b64encode(b64));
const base64UrlEncodeBytes = (bytes: number[]): string => {
  const std = b64decode(fromBytes(bytes));
  return std.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

/**
 * Generate VRF for MangaFire
 * @param input - The input string (e.g., keyword or chapter format)
 * @returns The encoded VRF string
 */
export function generateVrf(input: string): string {
  const schedule0 = [
    sub8(223),
    rotr8(4),
    rotr8(4),
    add8(234),
    rotr8(7),
    rotr8(2),
    rotr8(7),
    sub8(223),
    rotr8(7),
    rotr8(6),
  ];
  const schedule1 = [
    add8(19),
    rotr8(7),
    add8(19),
    rotr8(6),
    add8(19),
    rotr8(1),
    add8(19),
    rotr8(6),
    rotr8(7),
    rotr8(4),
  ];
  const schedule2 = [
    sub8(223),
    rotr8(1),
    add8(19),
    sub8(223),
    rotl8(2),
    sub8(223),
    add8(19),
    rotl8(1),
    rotl8(2),
    rotl8(1),
  ];
  const schedule3 = [
    add8(19),
    rotl8(1),
    rotl8(1),
    rotr8(1),
    add8(234),
    rotl8(1),
    sub8(223),
    rotl8(6),
    rotl8(4),
    rotl8(1),
  ];
  const schedule4 = [
    rotr8(1),
    rotl8(1),
    rotl8(6),
    rotr8(1),
    rotl8(2),
    rotr8(4),
    rotl8(1),
    rotl8(1),
    sub8(223),
    rotl8(2),
  ];

  let bytes = toBytes(encodeURIComponent(input));

  // Step 0
  bytes = rc4Bytes(b64encode(CONST.rc4Keys[0] || ""), bytes);
  let prefixKey = bytesFromBase64(CONST.prefixKeys[0] || "");
  bytes = transform(
    bytes,
    bytesFromBase64(CONST.seeds32[0] || ""),
    prefixKey,
    prefixKey.length,
    schedule0,
  );

  // Step 1
  bytes = rc4Bytes(b64encode(CONST.rc4Keys[1] || ""), bytes);
  prefixKey = bytesFromBase64(CONST.prefixKeys[1] || "");
  bytes = transform(
    bytes,
    bytesFromBase64(CONST.seeds32[1] || ""),
    prefixKey,
    prefixKey.length,
    schedule1,
  );

  // Step 2
  bytes = rc4Bytes(b64encode(CONST.rc4Keys[2] || ""), bytes);
  prefixKey = bytesFromBase64(CONST.prefixKeys[2] || "");
  bytes = transform(
    bytes,
    bytesFromBase64(CONST.seeds32[2] || ""),
    prefixKey,
    prefixKey.length,
    schedule2,
  );

  // Step 3
  bytes = rc4Bytes(b64encode(CONST.rc4Keys[3] || ""), bytes);
  prefixKey = bytesFromBase64(CONST.prefixKeys[3] || "");
  bytes = transform(
    bytes,
    bytesFromBase64(CONST.seeds32[3] || ""),
    prefixKey,
    prefixKey.length,
    schedule3,
  );

  // Step 4
  bytes = rc4Bytes(b64encode(CONST.rc4Keys[4] || ""), bytes);
  prefixKey = bytesFromBase64(CONST.prefixKeys[4] || "");
  bytes = transform(
    bytes,
    bytesFromBase64(CONST.seeds32[4] || ""),
    prefixKey,
    prefixKey.length,
    schedule4,
  );

  return base64UrlEncodeBytes(bytes);
}
