"use client";

import { useRouter } from "next/navigation";
import { Bell, BellRing, ChevronDown, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { playChime } from "@/lib/reminders/chime";
import { reminderBook, type DueReminder } from "@/lib/reminders/due-reminders";
import { cardNavigationHandler } from "@/lib/ui/card-navigation";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/date";

const CACHE_KEY = "fd-reminders-cache";
const CACHE_MS = 5 * 60 * 1000;
const REFRESH_MS = 15 * 60 * 1000;
const MUTE_KEY = "fd-reminders-muted";
const ANIMATED_KEY = "fd-reminders-animated";

type Payload = { date: string; orders: DueReminder[] };

function cached(): Payload | undefined {
  try {
    const value = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? "null") as { at: number; payload: Payload } | null;
    return value && Date.now() - value.at < CACHE_MS ? value.payload : undefined;
  } catch {
    return undefined;
  }
}

async function load(force = false): Promise<Payload | undefined> {
  if (!force) {
    const hit = cached();
    if (hit) return hit;
  }
  if (typeof fetch !== "function") return undefined;
  try {
    const response = await fetch("/api/reminders/due-tomorrow", { cache: "no-store" });
    if (!response.ok) return undefined;
    const payload = (await response.json()) as Payload;
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), payload }));
    return payload;
  } catch {
    return undefined;
  }
}

/** Shows a system notification where the device allows it (desktop, Android, installed iPhone app). */
async function showSystemNotification(order: DueReminder) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const title = "Due tomorrow";
  const options: NotificationOptions = {
    body: `${order.receiptNumber ?? "Order"} · ${order.customerName}\n${order.garments}`,
    tag: `due-${order.id}`,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    requireInteraction: true,
    data: { url: `/orders/${order.id}` }
  };
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration) {
      await registration.showNotification(title, options);
      return;
    }
    new Notification(title, options);
  } catch {
    // Some browsers (e.g. Android without a service worker) refuse; the in-app card still shows.
  }
}

/**
 * macOS/iPhone-style reminder cards for open orders due tomorrow. They stay until
 * dismissed (remembered per device and per day), chime softly once for new orders,
 * and can also raise system notifications if the user allows them.
 */
export function DueTomorrowNotifier() {
  const router = useRouter();
  const [payload, setPayload] = useState<Payload>();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(false);
  // Phones show one card with the rest grouped (like iPhone); larger screens show three.
  const [visibleCount] = useState(() => (typeof window !== "undefined" && window.matchMedia?.("(min-width: 640px)").matches === false ? 1 : 3));
  // Read on the client only; the stack renders nothing until reminders arrive, so SSR and client agree.
  const [muted, setMuted] = useState(() => typeof localStorage !== "undefined" && localStorage.getItem(MUTE_KEY) === "1");
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() =>
    typeof Notification === "undefined" ? "unsupported" : Notification.permission
  );
  // Cards slide in only the first time they appear in this tab, not on every page change.
  const [animated] = useState<Set<string>>(() => {
    try {
      return new Set<string>(typeof sessionStorage === "undefined" ? [] : JSON.parse(sessionStorage.getItem(ANIMATED_KEY) ?? "[]"));
    } catch {
      return new Set<string>();
    }
  });

  useEffect(() => {
    if (!payload) return;
    const ids = new Set([...animated, ...payload.orders.map((order) => order.id)]);
    sessionStorage.setItem(ANIMATED_KEY, JSON.stringify([...ids]));
  }, [payload, animated]);

  const apply = useCallback((next: Payload | undefined) => {
    if (!next) return;
    setPayload(next);
    setDismissed(reminderBook(localStorage, next.date).dismissed());
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    void load().then(apply);
    const timer = window.setInterval(() => void load(true).then(apply), REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load().then(apply);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [apply]);

  const pending = useMemo(() => (payload?.orders ?? []).filter((order) => !dismissed.has(order.id)), [payload, dismissed]);

  // Chime and raise system notifications once per order per day, not on every page change.
  useEffect(() => {
    if (!payload || pending.length === 0) return;
    const book = reminderBook(localStorage, payload.date);
    const chimed = book.chimed();
    const fresh = pending.filter((order) => !chimed.has(order.id));
    if (fresh.length) {
      const quiet = muted || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (!quiet) playChime();
      book.markChimed(fresh.map((order) => order.id));
    }
    const notified = book.notified();
    const toNotify = pending.filter((order) => !notified.has(order.id));
    if (toNotify.length && typeof Notification !== "undefined" && Notification.permission === "granted") {
      toNotify.forEach((order) => void showSystemNotification(order));
      book.markNotified(toNotify.map((order) => order.id));
    }
  }, [payload, pending, muted]);

  // Esc closes the top card unless something else (search, a dialog) is open.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape" || !pending.length) return;
      if (document.querySelector('[role="dialog"], [role="listbox"]')) return;
      dismiss([pending[0].id]);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function dismiss(ids: string[]) {
    if (!payload) return;
    reminderBook(localStorage, payload.date).dismiss(ids);
    setDismissed((current) => new Set([...current, ...ids]));
  }

  function toggleMute() {
    setMuted((current) => {
      localStorage.setItem(MUTE_KEY, current ? "0" : "1");
      return !current;
    });
  }

  async function enableSystemAlerts() {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted" && payload) {
      pending.forEach((order) => void showSystemNotification(order));
      reminderBook(localStorage, payload.date).markNotified(pending.map((order) => order.id));
    }
  }

  if (!payload || pending.length === 0) return null;

  const shown = expanded ? pending : pending.slice(0, visibleCount);
  const hiddenCount = pending.length - shown.length;

  return (
    <section
      aria-label="Reminders"
      aria-live="polite"
      className="no-print fixed inset-x-3 top-[4.25rem] z-[60] mx-auto flex max-w-sm flex-col gap-2 sm:left-auto sm:right-4 sm:mx-0 sm:w-96 md:top-[4.75rem]"
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <p className="flex items-center gap-1.5 rounded-full bg-wine-deep/85 px-3 py-1 text-xs font-semibold text-white shadow-raised-sm backdrop-blur">
          <BellRing className="h-3.5 w-3.5" aria-hidden />
          {pending.length} due tomorrow · {formatDate(payload.date)}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Turn reminder sound on" : "Mute reminder sound"}
            title={muted ? "Sound off" : "Sound on"}
            className="rounded-full bg-surface/90 p-1.5 text-muted-strong shadow-raised-sm backdrop-blur hover:text-wine"
          >
            {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
          {pending.length > 1 ? (
            <button
              type="button"
              onClick={() => dismiss(pending.map((order) => order.id))}
              className="rounded-full bg-surface/90 px-2.5 py-1 text-xs font-semibold text-muted-strong shadow-raised-sm backdrop-blur hover:text-wine"
            >
              Dismiss all
            </button>
          ) : null}
        </div>
      </div>

      {shown.map((order) => (
        <article
          key={order.id}
          onClick={cardNavigationHandler(router.push, `/orders/${order.id}`)}
          className={cn(!animated.has(order.id) && "toast-enter", "flex cursor-pointer gap-3 rounded-2xl border border-white/60 bg-surface-strong/95 p-3 text-sm shadow-raised-lg backdrop-blur-xl")}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-wine to-rose text-white shadow-brand">
            <Bell className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-baseline justify-between gap-2">
              <span className="font-semibold text-wine-ink">Due tomorrow</span>
              <span className="shrink-0 text-[11px] text-muted">{order.status}</span>
            </p>
            <p className="truncate text-ink">
              {order.receiptNumber ?? "Order"} · {order.customerName}
            </p>
            <p className="truncate text-xs text-muted">{order.garments}</p>
          </div>
          <button
            type="button"
            onClick={() => dismiss([order.id])}
            aria-label={`Dismiss reminder for ${order.receiptNumber ?? order.customerName}`}
            className="self-start rounded-full p-1 text-muted hover:bg-surface-sunken hover:text-wine"
          >
            <X className="h-4 w-4" />
          </button>
        </article>
      ))}

      {hiddenCount > 0 || expanded ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="flex items-center justify-center gap-1 rounded-xl border border-white/60 bg-surface-strong/95 px-3 py-1.5 text-xs font-semibold text-muted-strong shadow-raised-sm backdrop-blur-xl hover:text-wine"
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition", expanded && "rotate-180")} aria-hidden />
          {expanded ? "Show fewer" : `${hiddenCount} more`}
        </button>
      ) : null}

      {permission === "default" ? (
        <button
          type="button"
          onClick={() => void enableSystemAlerts()}
          className="rounded-xl border border-white/60 bg-surface-strong/95 px-3 py-1.5 text-xs font-semibold text-wine shadow-raised-sm backdrop-blur-xl hover:bg-surface-strong"
        >
          Also show these as device notifications
        </button>
      ) : null}
    </section>
  );
}
