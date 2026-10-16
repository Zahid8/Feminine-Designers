import { describe, expect, it } from "vitest";
import { dataUrlImageSize, fitWithin } from "./image-size";

// 3x2 pixel PNG header (IHDR only is enough for size parsing).
const png = (w: number, h: number) => {
  const header = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(header);
  header.writeUInt32BE(13, 8);
  header.write("IHDR", 12);
  header.writeUInt32BE(w, 16);
  header.writeUInt32BE(h, 20);
  return `data:image/png;base64,${header.toString("base64")}`;
};

describe("image sizing for PDFs", () => {
  it("reads PNG dimensions and ignores non-data URLs", () => {
    expect(dataUrlImageSize(png(675, 900))).toEqual({ width: 675, height: 900 });
    expect(dataUrlImageSize("https://cdn.test/a.jpg")).toBeUndefined();
  });

  it("reads JPEG dimensions from the frame header", () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x03, 0x84, 0x02, 0x58, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01]);
    expect(dataUrlImageSize(`data:image/jpeg;base64,${jpeg.toString("base64")}`)).toEqual({ width: 600, height: 900 });
  });

  it("fits a tall photo inside the box keeping its shape", () => {
    expect(fitWithin({ width: 675, height: 900 }, 190, 150)).toEqual({ width: 113, height: 150 });
    expect(fitWithin({ width: 900, height: 450 }, 190, 150)).toEqual({ width: 190, height: 95 });
    expect(fitWithin(undefined, 190, 150)).toEqual({ width: 190, height: 150 });
  });
});
