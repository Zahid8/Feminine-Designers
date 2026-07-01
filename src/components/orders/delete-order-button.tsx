"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { deleteOrderAction } from "@/app/orders/[id]/actions";
import { Button } from "@/components/ui/button";

export function DeleteOrderButton({ orderId, receiptNumber }: { orderId: string; receiptNumber?: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  function deleteOrder() {
    const confirmed = window.confirm(
      `Are you sure you want to delete order ${receiptNumber ?? orderId}? This cannot be undone.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    startTransition(() => {
      void deleteOrderAction(orderId)
        .then((result) => {
          if (!result.ok) {
            setIsDeleting(false);
            window.alert(result.message);
            return;
          }
          router.push("/orders");
          router.refresh();
        })
        .catch((error) => {
          setIsDeleting(false);
          window.alert(error instanceof Error ? error.message : "Could not delete order.");
        });
    });
  }

  return (
    <Button type="button" variant="danger" onClick={deleteOrder} disabled={isDeleting}>
      {isDeleting ? "Deleting..." : "Delete Order"}
    </Button>
  );
}
