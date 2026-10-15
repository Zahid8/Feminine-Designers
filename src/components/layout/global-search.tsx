"use client";

import { useRouter } from "next/navigation";
import { Loader2, ReceiptText, Search, UserRound } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { isTypingTarget } from "@/lib/ui/keyboard";
import type { SearchResults } from "@/types/search";

type ResultItem = { key: string; href: string; title: string; subtitle: string; kind: "order" | "customer"; status?: SearchResults["orders"][number]["status"] };

function toItems(results: SearchResults): ResultItem[] {
  return [
    ...results.orders.map<ResultItem>((order) => ({
      key: `order-${order.id}`,
      href: `/orders/${order.id}`,
      title: order.customerName || (order.receiptNumber ?? "Draft order"),
      subtitle: `${order.receiptNumber ?? "Draft"} · Delivery ${formatDate(order.deliveryDate)}`,
      kind: "order",
      status: order.status
    })),
    ...results.customers.map<ResultItem>((customer) => ({
      key: `customer-${customer.id}`,
      href: `/customers/${customer.id}`,
      title: customer.fullName,
      subtitle: customer.phone,
      kind: "customer"
    }))
  ];
}

/** Header search with live suggestions. Enter without a selection searches the Orders page. */
export function GlobalSearch() {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ResultItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      const shortcut = (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) || (event.key === "/" && !isTypingTarget(event.target));
      if (!shortcut) return;
      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : { orders: [], customers: [] }))
        .then((results: SearchResults) => {
          setItems(toItems(results));
          setActiveIndex(-1);
          setOpen(true);
        })
        .catch(() => undefined)
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 220);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    setItems([]);
    inputRef.current?.blur();
    router.push(href);
  }

  const showPanel = open && query.trim().length >= 2;

  return (
    <form
      action="/orders"
      method="get"
      role="search"
      className="relative min-w-0 max-w-xl flex-1"
      onSubmit={(event) => {
        if (showPanel && activeIndex >= 0 && items[activeIndex]) {
          event.preventDefault();
          go(items[activeIndex].href);
        } else {
          setOpen(false);
        }
      }}
    >
      <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        ref={inputRef}
        type="search"
        name="q"
        value={query}
        autoComplete="off"
        role="combobox"
        aria-label="Search orders and customers"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        placeholder="Search receipt, phone, or customer"
        onChange={(event) => {
          setQuery(event.target.value);
          if (event.target.value.trim().length < 2) {
            setItems([]);
            setOpen(false);
          }
        }}
        onFocus={() => items.length && setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            return;
          }
          if (!showPanel || items.length === 0) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((index) => (index + 1) % items.length);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => (index <= 0 ? items.length - 1 : index - 1));
          }
        }}
        className="h-11 w-full rounded-2xl border border-transparent bg-surface-sunken pl-9 pr-16 text-sm text-ink shadow-pressed outline-none transition placeholder:text-muted-soft focus:border-gold focus:bg-surface-strong focus:ring-2 focus:ring-gold/30"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted" aria-hidden />
        ) : query ? null : (
          <kbd className="hidden rounded-md border border-line-strong bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-muted lg:inline">Ctrl K</kbd>
        )}
      </span>
      {showPanel ? (
        <div className="fixed inset-x-3 top-16 z-40 overflow-hidden rounded-2xl border border-white/70 bg-surface-strong shadow-raised-lg sm:absolute sm:inset-x-0 sm:top-full sm:mt-2">
          {items.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">{loading ? "Searching…" : "No matches. Press Enter to search all orders."}</p>
          ) : (
            <ul id={listId} role="listbox" aria-label="Search results" className="max-h-[60vh] overflow-y-auto p-1.5">
              {items.map((item, index) => {
                const Icon = item.kind === "order" ? ReceiptText : UserRound;
                return (
                  <li
                    key={item.key}
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => go(item.href)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5",
                      index === activeIndex ? "bg-surface-sunken shadow-pressed" : "hover:bg-surface"
                    )}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-peach text-wine">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-wine-ink">{item.title}</span>
                      <span className="block truncate text-xs text-muted">{item.subtitle}</span>
                    </span>
                    {item.status ? <StatusBadge status={item.status} /> : <span className="text-xs font-semibold text-muted">Customer</span>}
                  </li>
                );
              })}
            </ul>
          )}
          <p className="hidden border-t border-line-soft px-4 py-2 text-[11px] text-muted sm:block">
            ↑ ↓ to move · Enter to open · Esc to close
          </p>
        </div>
      ) : null}
    </form>
  );
}
