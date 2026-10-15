import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShellFrame } from "@/components/layout/app-shell-frame";

vi.mock("next/navigation", () => ({
  usePathname: () => "/orders",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() })
}));

describe("AppShellFrame", () => {
  it("starts with the sidebar expanded and toggles it with the hamburger button", () => {
    render(
      <AppShellFrame logoutAction={vi.fn()}>
        <p>Page content</p>
      </AppShellFrame>
    );

    const sidebar = screen.getByLabelText(/primary navigation/i);
    const toggle = screen.getByRole("button", { name: /hide sidebar/i });

    expect(sidebar.className).toContain("shadow-raised");
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

  it("offers a bottom tab bar with the current page marked for phones and tablets", () => {
    render(
      <AppShellFrame logoutAction={vi.fn()}>
        <p>Page content</p>
      </AppShellFrame>
    );

    const mobileNav = screen.getByRole("navigation", { name: /mobile navigation/i });
    expect(mobileNav.className).toContain("lg:hidden");
    expect(mobileNav.querySelectorAll("a")).toHaveLength(5);
    expect(mobileNav.querySelector('[aria-current="page"]')?.textContent).toBe("Orders");
    expect([...mobileNav.querySelectorAll("a")].map((link) => link.textContent)).toEqual(["Dashboard", "Orders", "New Order", "Customers", "Reports"]);
    expect(screen.getAllByRole("link", { name: "Settings" }).every((link) => link.getAttribute("href") === "/settings")).toBe(true);
  });
});
