import { describe, expect, it, vi } from "vitest";
import { removeStoredClothSample, storeClothSample } from "./cloth-sample-storage";

function adminWithBucket(bucket: Record<string, unknown>) {
  return { storage: { from: vi.fn(() => bucket) } } as never;
}

describe("cloth-sample-storage", () => {
  it("uploads image data URLs and returns the public URL", async () => {
    const upload = vi.fn(async () => ({ data: { path: "x" }, error: null }));
    const getPublicUrl = vi.fn((path: string) => ({ data: { publicUrl: `https://cdn.test/cloth-samples/${path}` } }));

    const result = await storeClothSample(adminWithBucket({ upload, getPublicUrl }), "data:image/jpeg;base64,aGVsbG8=");

    expect(result).toMatch(/^https:\/\/cdn\.test\/cloth-samples\/\d{4}\/[0-9a-f-]{36}\.jpg$/);
    const [, body, options] = upload.mock.calls[0] as unknown as [string, Buffer, { contentType: string; upsert: boolean }];
    expect(body.toString()).toBe("hello");
    expect(options).toMatchObject({ contentType: "image/jpeg", upsert: false });
  });

  it("keeps the inline data URL when the upload fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const upload = vi.fn(async () => ({ data: null, error: new Error("Bucket not found") }));
    const dataUrl = "data:image/jpeg;base64,aGVsbG8=";

    await expect(storeClothSample(adminWithBucket({ upload, getPublicUrl: vi.fn() }), dataUrl)).resolves.toBe(dataUrl);
  });

  it("leaves existing URLs untouched", async () => {
    const upload = vi.fn();
    const url = "https://cdn.test/cloth-samples/2026/a.jpg";

    await expect(storeClothSample(adminWithBucket({ upload }), url)).resolves.toBe(url);
    expect(upload).not.toHaveBeenCalled();
  });

  it("removes only photos stored in the cloth-samples bucket", async () => {
    const remove = vi.fn(async () => ({ data: [], error: null }));
    const admin = adminWithBucket({ remove });

    await removeStoredClothSample(admin, "data:image/jpeg;base64,aGVsbG8=");
    await removeStoredClothSample(admin, "https://x.supabase.co/storage/v1/object/public/cloth-samples/2026/a%20b.jpg");

    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith(["2026/a b.jpg"]);
  });
});
