const ALPHA62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ALPHA95 =
  " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~";

const PACKED = /eval\(function\(p,a,c,k,e,(?:r|d)/;
const PAYLOAD = /\}\s*\('(.*)',\s*(.*?),\s*(\d+),\s*'(.*?)'\.split\('\|'\)/s;

function unbaser(radix: number): (word: string) => number {
  if (radix <= 36) return (word) => parseInt(word, radix);
  const alphabet = (radix <= 62 ? ALPHA62 : ALPHA95).slice(0, radix);
  const digits = new Map([...alphabet].map((char, index) => [char, index]));
  return (word) => [...word].reduce((value, char) => value * radix + (digits.get(char) ?? 0), 0);
}

export function unpackJsAndCombine(packed: string): string {
  const match = PACKED.test(packed.replace(/ /g, "")) ? PAYLOAD.exec(packed) : null;
  if (!match) throw new Error("Unable to unpack JS: not a valid p.a.c.k.e.r payload");

  const [, payload, radix, count, symbolList] = match;
  const symbols = symbolList!.split("|");
  if (symbols.length !== (parseInt(count!, 10) || 0)) {
    throw new Error("Unknown p.a.c.k.e.r encoding");
  }

  const decode = unbaser(parseInt(radix!, 10) || 36);
  return payload!.replace(/\\'/g, "'").replace(/\b\w+\b/g, (word) => symbols[decode(word)] || word);
}
