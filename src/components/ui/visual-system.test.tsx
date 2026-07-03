import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

describe("Boutique Ledger visual system", () => {
  it("applies premium boutique styling to shared surfaces", () => {
    render(
      <>
        <PageHeading title="Orders" description="Manage orders" />
        <Card data-testid="card">
          <CardContent>Card content</CardContent>
        </Card>
        <Button>Save</Button>
        <Input aria-label="Customer name" />
      </>
    );

    expect(screen.getByRole("heading", { name: "Orders" }).className).toContain("text-[#3f0f20]");
    expect(screen.getByTestId("card").className).toContain("shadow-[0_18px_45px_rgba(76,21,37,0.08)]");
    expect(screen.getByRole("button", { name: "Save" }).className).toContain("bg-gradient-to-r");
    expect(screen.getByLabelText("Customer name").className).toContain("focus:ring-[#d99a62]/30");
  });
});
