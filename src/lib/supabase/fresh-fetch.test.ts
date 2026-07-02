import { afterEach, describe, expect, it, vi } from "vitest";
import { freshSupabaseFetch } from "@/lib/supabase/fresh-fetch";

describe("freshSupabaseFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forces no-store on Supabase requests", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetchSpy);

    await freshSupabaseFetch("https://example.supabase.co/rest/v1/orders", {
      headers: { accept: "application/json" }
    });

    expect(fetchSpy).toHaveBeenCalledWith("https://example.supabase.co/rest/v1/orders", {
      headers: { accept: "application/json" },
      cache: "no-store"
    });
  });
});
