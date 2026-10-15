"use client";

import { useRouter } from "next/navigation";
import { Banknote, Plus, Smartphone, Trash2 } from "lucide-react";
import { useState } from "react";
import { recordPaymentAction, removePaymentAction } from "@/app/orders/[id]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";
import { formatDateTime } from "@/lib/utils/date";
import { formatINR, paiseToRupees } from "@/lib/utils/money";
import type { Payment } from "@/types/domain";

/**
 * Payment log for one order. Customers pay at the counter in cash or UPI;
 * this only records what was received so the balance stays correct.
 */
export function PaymentsPanel({ orderId, payments, balanceDuePaise }: { orderId: string; payments: Payment[]; balanceDuePaise: number }) {
  const router = useRouter();
  const toast = useToast();
  const [amount, setAmount] = useState(balanceDuePaise > 0 ? String(paiseToRupees(balanceDuePaise)) : "");
  const [method, setMethod] = useState<"Cash" | "UPI">("Cash");
  const [busy, setBusy] = useState(false);
  const sorted = [...payments].sort((a, b) => b.paidAt.localeCompare(a.paidAt));

  async function addPayment(event: React.FormEvent) {
    event.preventDefault();
    const rupees = Number(amount);
    if (!Number.isFinite(rupees) || rupees <= 0) {
      toast.show({ tone: "error", message: "Enter the amount received." });
      return;
    }
    setBusy(true);
    try {
      const paymentId = await recordPaymentAction(orderId, rupees, method);
      router.refresh();
      setAmount("");
      toast.show({
        message: `${formatINR(Math.round(rupees * 100))} received by ${method} recorded.`,
        action: { label: "Undo", onAction: () => removePaymentAction(orderId, paymentId).then(() => router.refresh()) }
      });
    } catch (error) {
      toast.show({ tone: "error", message: error instanceof Error ? error.message : "Could not record the payment." });
    } finally {
      setBusy(false);
    }
  }

  async function removePayment(payment: Payment) {
    if (!window.confirm(`Remove the ${formatINR(payment.amountPaise)} payment from ${formatDateTime(payment.paidAt)}?`)) return;
    try {
      await removePaymentAction(orderId, payment.id);
      router.refresh();
      toast.show({ message: "Payment removed; the balance is due again." });
    } catch (error) {
      toast.show({ tone: "error", message: error instanceof Error ? error.message : "Could not remove the payment." });
    }
  }

  return (
    <div className="grid gap-4">
      <form onSubmit={addPayment} className="grid gap-3 rounded-2xl bg-surface-sunken p-3 shadow-pressed">
        <p className="text-sm font-semibold text-wine-ink">
          Record money received
          {balanceDuePaise > 0 ? <span className="ml-1 font-normal text-muted">· {formatINR(balanceDuePaise)} still due</span> : <span className="ml-1 font-normal text-success">· fully paid</span>}
        </p>
        <div className="flex flex-wrap gap-2">
          <label className="relative min-w-32 flex-1">
            <span className="sr-only">Amount received in rupees</span>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">₹</span>
            <Input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Amount" className="bg-surface-strong pl-7" />
          </label>
          <div role="radiogroup" aria-label="Paid by" className="flex gap-1 rounded-xl bg-surface p-1 shadow-raised-sm">
            {(["Cash", "UPI"] as const).map((option) => {
              const Icon = option === "Cash" ? Banknote : Smartphone;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={method === option}
                  onClick={() => setMethod(option)}
                  className={cn(
                    "inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition",
                    method === option ? "bg-gradient-to-br from-wine to-rose text-white shadow-brand" : "text-muted-strong hover:text-wine"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {option}
                </button>
              );
            })}
          </div>
          <Button type="submit" disabled={busy}>
            <Plus className="h-4 w-4" aria-hidden />
            Add
          </Button>
        </div>
      </form>
      {sorted.length === 0 ? (
        <p className="text-sm text-muted">No payments recorded yet.</p>
      ) : (
        <ul className="grid gap-2">
          {sorted.map((payment) => (
            <li key={payment.id} className="flex items-center gap-3 rounded-xl border border-white/70 bg-surface px-3 py-2 shadow-raised-sm">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                {payment.method === "UPI" ? <Smartphone className="h-4 w-4" aria-hidden /> : <Banknote className="h-4 w-4" aria-hidden />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold tabular-nums text-wine-ink">{formatINR(payment.amountPaise)}</span>
                <span className="block truncate text-xs text-muted">
                  {payment.method} · {formatDateTime(payment.paidAt)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => void removePayment(payment)}
                aria-label={`Remove payment of ${formatINR(payment.amountPaise)}`}
                className="rounded-lg p-2 text-muted transition hover:bg-red-50 hover:text-danger"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
