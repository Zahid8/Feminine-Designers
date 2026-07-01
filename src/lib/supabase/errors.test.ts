import { describe, expect, it } from "vitest";
import { isMissingSupabaseSchemaError } from "@/lib/supabase/errors";

describe("isMissingSupabaseSchemaError", () => {
  it("detects missing Supabase table/schema-cache errors", () => {
    expect(
      isMissingSupabaseSchemaError({
        code: "PGRST205",
        message: "Could not find the table 'public.orders' in the schema cache"
      })
    ).toBe(true);
  });

  it("detects missing Supabase rpc function/schema-cache errors", () => {
    expect(
      isMissingSupabaseSchemaError({
        code: "PGRST202",
        message: "Could not find the function public.create_order_from_payload(p_payload) in the schema cache"
      })
    ).toBe(true);
  });

  it("does not hide unrelated Supabase errors", () => {
    expect(isMissingSupabaseSchemaError({ code: "42501", message: "permission denied for table orders" })).toBe(false);
  });
});
