import { describe, expect, it } from "vitest";
import { telLink, whatsappLink, whatsappNumber } from "./phone-links";

describe("phone links", () => {
  it("normalises Indian mobile numbers for WhatsApp", () => {
    expect(whatsappNumber("9717075751")).toBe("919717075751");
    expect(whatsappNumber("09717075751")).toBe("919717075751");
    expect(whatsappNumber("+91 97170 75751")).toBe("919717075751");
    expect(whatsappNumber("12345")).toBeUndefined();
  });

  it("builds wa.me and tel links", () => {
    expect(whatsappLink("9717075751", "Ready & waiting")).toBe("https://wa.me/919717075751?text=Ready%20%26%20waiting");
    expect(telLink("97170 75751")).toBe("tel:9717075751");
  });
});
