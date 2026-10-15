"use client";

import { startTransition, useState } from "react";
import type { OrderItem } from "@/types/domain";
import { setAllOrderItemsDeliveredAction, setOrderItemDeliveredAction } from "@/app/orders/[id]/actions";
import { formatFabricLengthDisplay } from "@/lib/utils/fabric-length-display";

export function OrderItemDeliveryTracker({ orderId, items }: { orderId: string; items: OrderItem[] }) {
  const [localItems, setLocalItems] = useState(items);
  const allDelivered = localItems.length > 0 && localItems.every((item) => item.delivered);

  function setItemDelivered(itemId: string, delivered: boolean) {
    setLocalItems((current) => current.map((item) => (item.id === itemId ? { ...item, delivered } : item)));
    startTransition(() => {
      void setOrderItemDeliveredAction(orderId, itemId, delivered);
    });
  }

  function setAllDelivered(delivered: boolean) {
    setLocalItems((current) => current.map((item) => ({ ...item, delivered })));
    startTransition(() => {
      void setAllOrderItemsDeliveredAction(orderId, delivered);
    });
  }

  return (
    <div className="grid gap-3">
      <label className="flex items-center justify-between rounded-xl border border-line-strong bg-cream px-3 py-2 text-sm font-semibold shadow-pressed">
        <span>All dresses delivered</span>
        <input
          type="checkbox"
          className="h-5 w-5"
          checked={allDelivered}
          onChange={(event) => setAllDelivered(event.target.checked)}
        />
      </label>
      <div className="grid gap-2">
        {localItems.map((item) => {
          const fabricLength = formatFabricLengthDisplay(item.fabricLength);

          return (
            <label key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-line bg-surface p-3 text-sm shadow-raised-sm">
              <span>
                <strong className="text-wine-ink">{item.garmentType}</strong>
                <span className="block text-xs text-muted">
                  Qty {item.quantity}
                  {fabricLength ? ` · Fabric ${fabricLength}` : ""}
                </span>
              </span>
              <input
                type="checkbox"
                className="mt-1 h-5 w-5"
                checked={Boolean(item.delivered)}
                onChange={(event) => setItemDelivered(item.id, event.target.checked)}
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}
