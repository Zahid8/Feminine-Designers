"use server";

import { revalidatePath } from "next/cache";
import { archiveCustomerRecord } from "@/services/customers/customer-record-service";

export async function archiveCustomerAction(customerId: string) {
  await archiveCustomerRecord(customerId);
  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
}
