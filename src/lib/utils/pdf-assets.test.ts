import { describe, expect, it } from "vitest";
import { getPublicPngDataUri } from "@/lib/utils/pdf-assets";

describe("getPublicPngDataUri", () => {
  it("embeds the public logo as a PNG data URI for generated PDFs", () => {
    const dataUri = getPublicPngDataUri("Logo.PNG");

    expect(dataUri.startsWith("data:image/png;base64,")).toBe(true);
    expect(dataUri.length).toBeGreaterThan(1000);
  });
});

