import { describe, expect, it } from "vitest";
import { isSafeInternalPath, safeHttpUrl } from "./safe-url";

describe("safeHttpUrl", () => {
  it("keeps http and https links and drops everything else", () => {
    expect(safeHttpUrl("https://maps.app.goo.gl/AbC123")).toBe("https://maps.app.goo.gl/AbC123");
    expect(safeHttpUrl("http://example.com/track?id=1")).toBe("http://example.com/track?id=1");
    expect(safeHttpUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeHttpUrl("data:text/html,<script>1</script>")).toBeUndefined();
    expect(safeHttpUrl("not a url")).toBeUndefined();
    expect(safeHttpUrl(undefined)).toBeUndefined();
  });
});

describe("isSafeInternalPath", () => {
  it("accepts site paths and rejects protocol-relative or tricky ones", () => {
    expect(isSafeInternalPath("/admin/")).toBe(true);
    expect(isSafeInternalPath("/admin/store/order/12/change/?x=1")).toBe(true);
    expect(isSafeInternalPath("//evil.com")).toBe(false);
    expect(isSafeInternalPath("/\\evil.com")).toBe(false);
    expect(isSafeInternalPath("https://evil.com")).toBe(false);
    expect(isSafeInternalPath("/ok\nnext")).toBe(false);
  });
});
