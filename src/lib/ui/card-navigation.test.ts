import { describe, expect, it, vi } from "vitest";
import { cardNavigationHandler } from "./card-navigation";

function clickOn(element: HTMLElement, init: Partial<{ ctrlKey: boolean; button: number }> = {}) {
  return { target: element, button: init.button ?? 0, ctrlKey: init.ctrlKey ?? false, metaKey: false, defaultPrevented: false } as never;
}

describe("cardNavigationHandler", () => {
  it("navigates when plain card content is clicked", () => {
    const navigate = vi.fn();
    const text = document.createElement("p");
    cardNavigationHandler(navigate, "/orders/1")(clickOn(text));
    expect(navigate).toHaveBeenCalledWith("/orders/1");
  });

  it("ignores clicks on controls inside the card", () => {
    const navigate = vi.fn();
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    label.append(checkbox);
    cardNavigationHandler(navigate, "/orders/1")(clickOn(checkbox));
    cardNavigationHandler(navigate, "/orders/1")(clickOn(document.createElement("button")));
    expect(navigate).not.toHaveBeenCalled();
  });

  it("opens a new tab for ctrl-click", () => {
    const navigate = vi.fn();
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    cardNavigationHandler(navigate, "/orders/1")(clickOn(document.createElement("div"), { ctrlKey: true }));
    expect(open).toHaveBeenCalledWith("/orders/1", "_blank", "noopener");
    expect(navigate).not.toHaveBeenCalled();
  });
});
