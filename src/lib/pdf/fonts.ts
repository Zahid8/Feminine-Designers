import { join } from "node:path";
import { Font } from "@react-pdf/renderer";

// Server-only: registers the app's typefaces for @react-pdf (bill PDFs).
const dir = join(process.cwd(), "src", "assets", "fonts");
const file = (name: string) => join(dir, name);

export const PDF_SANS = "PlusJakartaSans";
export const PDF_SERIF = "Fraunces";

Font.register({
  family: PDF_SANS,
  fonts: [
    { src: file("PlusJakartaSans-400.woff"), fontWeight: 400 },
    { src: file("PlusJakartaSans-400-italic.woff"), fontWeight: 400, fontStyle: "italic" },
    { src: file("PlusJakartaSans-600.woff"), fontWeight: 600 },
    { src: file("PlusJakartaSans-700.woff"), fontWeight: 700 }
  ]
});

Font.register({
  family: PDF_SERIF,
  fonts: [
    { src: file("Fraunces-500.woff"), fontWeight: 500 },
    { src: file("Fraunces-500-italic.woff"), fontWeight: 500, fontStyle: "italic" },
    { src: file("Fraunces-600.woff"), fontWeight: 600 }
  ]
});

// Keep words whole; react-pdf's default hyphenation splits names and receipt numbers.
Font.registerHyphenationCallback((word) => [word]);
