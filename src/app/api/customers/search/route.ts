import { NextResponse } from "next/server";
import { listCustomers } from "@/services/customers/customer-service";
import { getCustomerMeasurementProfiles } from "@/services/customers/customer-measurement-service";
import type { ReturningCustomerMatch } from "@/types/customer-search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ matches: [] });
  }

  const customers = (await listCustomers(query)).slice(0, 8);
  const profiles = await getCustomerMeasurementProfiles(customers);
  const matches = profiles.map<ReturningCustomerMatch>(({ customer, values }) => ({
    id: customer.id,
    customerCode: customer.customerCode,
    fullName: customer.fullName,
    phonePrimary: customer.phonePrimary,
    measurements: values
  }));

  return NextResponse.json({ matches });
}
