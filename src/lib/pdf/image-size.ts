/** Pixel width and height of a PNG or JPEG data URL, or undefined for anything else (e.g. remote URLs). */
export function dataUrlImageSize(dataUrl: string | undefined): { width: number; height: number } | undefined {
  const match = /^data:image\/(png|jpe?g);base64,(.+)$/i.exec(dataUrl ?? "");
  if (!match) return undefined;
  const bytes = Buffer.from(match[2], "base64");
  if (match[1].toLowerCase() === "png") {
    return bytes.length > 24 ? { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) } : undefined;
  }
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) return undefined;
    const marker = bytes[offset + 1];
    const length = bytes.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5) };
    }
    offset += 2 + length;
  }
  return undefined;
}

/** Largest size with the image's proportions that fits inside maxWidth × maxHeight. */
export function fitWithin(size: { width: number; height: number } | undefined, maxWidth: number, maxHeight: number) {
  if (!size || size.width <= 0 || size.height <= 0) return { width: maxWidth, height: maxHeight };
  const scale = Math.min(maxWidth / size.width, maxHeight / size.height);
  return { width: Math.round(size.width * scale), height: Math.round(size.height * scale) };
}

/** Reads width/height from the first bytes of PNG or JPEG data. */
export function imageSizeFromBytes(bytes: Buffer): { width: number; height: number } | undefined {
  if (bytes.length > 24 && bytes[0] === 0x89 && bytes[1] === 0x50) return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return undefined;
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) return undefined;
    const marker = bytes[offset + 1];
    const length = bytes.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5) };
    }
    offset += 2 + length;
  }
  return undefined;
}

/** Image size for a data URL or a remote PNG/JPEG (fetches the file; undefined on any failure). */
export async function imageSizeFromUrl(url: string | undefined): Promise<{ width: number; height: number } | undefined> {
  if (!url) return undefined;
  const inline = dataUrlImageSize(url);
  if (inline || url.startsWith("data:")) return inline;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return undefined;
    return imageSizeFromBytes(Buffer.from(await response.arrayBuffer()));
  } catch {
    return undefined;
  }
}
