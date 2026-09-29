import crypto from "node:crypto";
import { fetchText, UA } from "../core/http.js";

const KEY = Buffer.from("kiemtienmua911ca");
const IV = Buffer.from("1234567890oiuytr");

export function canExtractNova(url) {
  return /(?:upn\.one|uns\.bio)\/?#/i.test(String(url));
}

export async function extractNova(embedUrl, { userAgent = UA } = {}) {
  const url = new URL(String(embedUrl));
  const id = url.hash.slice(1).split("&")[0];
  if (!/^[A-Za-z0-9]+$/.test(id)) throw new Error(`Cannot extract Nova id from ${embedUrl}`);
  const hex = (
    await fetchText(`${url.origin}/api/v1/video?id=${encodeURIComponent(id)}&w=1920&h=1080&r=`, {
      label: "Nova",
      headers: { "User-Agent": userAgent, Referer: `${url.origin}/`, Origin: url.origin },
    })
  ).trim();
  if (!/^[0-9a-f]+$/i.test(hex)) throw new Error("Nova response is not encrypted hex");
  const decipher = crypto.createDecipheriv("aes-128-cbc", KEY, IV);
  const data = JSON.parse(
    Buffer.concat([decipher.update(Buffer.from(hex, "hex")), decipher.final()]).toString("utf8"),
  );
  const source = [data.cfNative, data.source, data.cf].find(
    (value) => typeof value === "string" && /^https?:\/\//.test(value),
  );
  if (!source) throw new Error("Nova response missing m3u8 url");
  return [{ url: source, type: "hls", referer: `${url.origin}/` }];
}
