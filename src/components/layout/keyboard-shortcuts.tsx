"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { Keyboard, X } from "lucide-react";
import { useEffect, useState } from "react";
import { isPlainShortcut } from "@/lib/ui/keyboard";

const SHORTCUTS: [string, string][] = [
  ["Ctrl/⌘ K  or  /", "Search orders and customers"],
  ["N", "New order"],
  ["B", "Workshop board (dashboard)"],
  ["D", "Dashboard"],
  ["?", "Show this list"],
  ["Esc", "Close search or dialogs"]
];

/** Global single-key shortcuts plus a "?" help dialog. Ignored while typing or with modifier keys. */
export function KeyboardShortcuts() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!isPlainShortcut(event)) return;
      const key = event.key.toLowerCase();
      if (event.key === "?") setOpen(true);
      else if (key === "n") router.push("/orders/new");
      else if (key === "b") router.push("/dashboard?view=board#work-area");
      else if (key === "d") router.push("/dashboard");
      else return;
      event.preventDefault();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Keyboard shortcuts"
          className="hidden h-11 w-11 items-center justify-center rounded-xl bg-surface text-muted-strong shadow-raised-sm transition hover:text-wine lg:inline-flex"
        >
          <Keyboard className="h-4 w-4" aria-hidden />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-wine-deep/30 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-surface p-5 shadow-raised-lg">
          <div className="mb-3 flex items-center justify-between">
            <Dialog.Title className="font-serif text-2xl font-semibold text-wine-deep">Keyboard shortcuts</Dialog.Title>
            <Dialog.Close aria-label="Close" className="rounded-lg p-1.5 text-muted hover:bg-surface-sunken hover:text-wine">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mb-3 text-sm text-muted">Work faster at the counter with these keys.</Dialog.Description>
          <dl className="grid gap-2">
            {SHORTCUTS.map(([keys, action]) => (
              <div key={keys} className="flex items-center justify-between gap-3 rounded-xl bg-surface-sunken px-3 py-2 shadow-pressed">
                <dt className="text-sm text-ink-soft">{action}</dt>
                <dd>
                  <kbd className="rounded-md border border-line-strong bg-surface px-2 py-0.5 text-xs font-semibold text-wine-ink shadow-raised-sm">{keys}</kbd>
                </dd>
              </div>
            ))}
          </dl>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
