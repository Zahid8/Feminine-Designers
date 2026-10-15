import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

describe("Soft boutique visual system", () => {
  it("applies neumorphic tokens to shared surfaces", () => {
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

    expect(screen.getByRole("heading", { name: "Orders" }).className).toContain("text-wine-deep");
    expect(screen.getByTestId("card").className).toContain("shadow-raised");
    expect(screen.getByRole("button", { name: "Save" }).className).toContain("shadow-brand");
    expect(screen.getByLabelText("Customer name").className).toContain("shadow-pressed");
    expect(screen.getByLabelText("Customer name").className).toContain("focus:ring-gold/30");
  });
});
