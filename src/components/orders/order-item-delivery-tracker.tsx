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
      <label className="flex items-center justify-between rounded-md border border-[#dfc5a8] bg-[#fff7ec] px-3 py-2 text-sm font-semibold shadow-inner shadow-[#f5e3cf]/50">
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
            <label key={item.id} className="flex items-start justify-between gap-3 rounded-md border border-[#ead8c3] bg-white/95 p-3 text-sm shadow-sm">
              <span>
                <strong className="text-[#4c1525]">{item.garmentType}</strong>
                <span className="block text-xs text-[#7c6d66]">
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
