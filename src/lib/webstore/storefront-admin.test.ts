import { afterEach, describe, expect, it, vi } from "vitest";
import { storefrontAdminToken, storefrontAdminUrl } from "./storefront-admin";

afterEach(() => vi.unstubAllEnvs());

describe("storefront admin handoff", () => {
  it("produces the token the webstore expects (shared vector with its Python tests)", () => {
    const token = storefrontAdminToken("test-token", { username: "manager", nonce: "fixed-nonce", ttlSeconds: 120, now: (4102444800 - 120) * 1000 });
    expect(token).toBe(
      "eyJleHAiOjQxMDI0NDQ4MDAsIm4iOiJmaXhlZC1ub25jZSIsIm5leHQiOiIvYWRtaW4vIiwidSI6Im1hbmFnZXIifQ.NEUKhIz_0hZ-AT481aJs0Cjh4QBWwxAXuNgL0jnuubQ"
    );
  });

  it("builds a handoff URL on the webstore, or nothing when unconfigured", () => {
    vi.stubEnv("WEBSTORE_API_URL", "https://shop.example.com/");
    vi.stubEnv("WEBSTORE_API_TOKEN", "secret");
    expect(storefrontAdminUrl()).toMatch(/^https:\/\/shop\.example\.com\/admin\/handoff\/\?t=[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    vi.stubEnv("WEBSTORE_API_TOKEN", "");
    expect(storefrontAdminUrl()).toBeUndefined();
  });
});
