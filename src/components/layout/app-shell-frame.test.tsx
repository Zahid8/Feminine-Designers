import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShellFrame } from "@/components/layout/app-shell-frame";

describe("AppShellFrame", () => {
  it("starts with the sidebar expanded and toggles it with the hamburger button", () => {
    render(
      <AppShellFrame logoutAction={vi.fn()}>
        <p>Page content</p>
      </AppShellFrame>
    );

    const sidebar = screen.getByLabelText(/primary navigation/i);
    const toggle = screen.getByRole("button", { name: /hide sidebar/i });

    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(toggle.innerHTML).toContain("M4 12h16");
    expect(sidebar.className).not.toContain("w-0");

    fireEvent.click(toggle);

    const collapsedToggle = screen.getByRole("button", { name: /show sidebar/i });
    expect(collapsedToggle.getAttribute("aria-expanded")).toBe("false");
    expect(collapsedToggle.innerHTML).toContain("M4 12h16");
    expect(sidebar.className).toContain("w-0");

    fireEvent.click(screen.getByRole("button", { name: /show sidebar/i }));

    expect(screen.getByRole("button", { name: /hide sidebar/i }).getAttribute("aria-expanded")).toBe("true");
    expect(sidebar.className).not.toContain("w-0");
  });
});
