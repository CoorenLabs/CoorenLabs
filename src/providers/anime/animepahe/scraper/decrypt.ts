export function decrypt(
  packedStr: string,
  key: string,
  offsetStr: string,
  delimiterIndex: number,
): string {
  const offset = parseInt(offsetStr, 10);
  if (isNaN(offset)) {
    throw new Error("Invalid offset value for decryption");
  }

  const delimiter = key[delimiterIndex];
  const radix = delimiterIndex;
  let html = "";
  let i = 0;

  while (i < packedStr.length) {
    let chunk = "";
    while (i < packedStr.length && packedStr[i] !== delimiter) {
      chunk += packedStr[i];
      i++;
    }

    let chunkWithDigits = chunk;
    for (let j = 0; j < key.length; j++) {
      chunkWithDigits = chunkWithDigits.replaceAll(key[j]!, j.toString());
    }

    const numericValue = parseInt(chunkWithDigits, radix);
    html += String.fromCharCode(numericValue - offset);

    i++;
  }

  return html;
}
