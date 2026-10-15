import type { MouseEvent } from "react";

const INTERACTIVE_SELECTOR = "a, button, input, label, select, textarea, summary, [role='button'], [data-no-card-nav]";

/**
 * Click handler that opens `href` when a card or table row is clicked anywhere
 * except on its own controls (checkboxes, buttons, links, form fields).
 * Ctrl/Cmd/middle-click open a new tab like a normal link. Keyboard users keep
 * using the real link inside the card.
 */
export function cardNavigationHandler(navigate: (href: string) => void, href: string) {
  return (event: MouseEvent<HTMLElement>) => {
    if (event.defaultPrevented || event.button > 1) return;
    const target = event.target as HTMLElement;
    if (target.closest(INTERACTIVE_SELECTOR)) return;
    if (window.getSelection()?.toString()) return;
    if (event.metaKey || event.ctrlKey || event.button === 1) {
      window.open(href, "_blank", "noopener");
      return;
    }
    navigate(href);
  };
}
