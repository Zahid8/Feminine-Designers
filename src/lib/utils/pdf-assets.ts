import { readFileSync } from "node:fs";
import { join } from "node:path";

export function getPublicPngDataUri(fileName: string) {
  const file = readFileSync(join(process.cwd(), "public", fileName));
  return `data:image/png;base64,${file.toString("base64")}`;
}

