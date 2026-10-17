import { NextResponse } from "next/server";
import { tomorrowOf } from "@/lib/reminders/due-reminders";
import { todayISO } from "@/lib/utils/date";
import { listOrdersDueOn } from "@/services/orders/order-service";

/**
 * Staff-only (middleware): open shop orders due for delivery tomorrow (India date).
 * `?date=YYYY-MM-DD` overrides the date, which is handy for checking the stack.
 */
export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get("date");
  const date = requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : tomorrowOf(todayISO());
  const orders = await listOrdersDueOn(date);
  return NextResponse.json({ date, orders }, { headers: { "Cache-Control": "no-store" } });
}
