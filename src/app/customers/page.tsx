import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { CustomerTable } from "@/components/customers/customer-table";
import { listCustomers } from "@/services/customers/customer-service";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const customers = await listCustomers(params.q);
  return (
    <AppShell>
      <PageHeading
        title="Customers"
        description="Customer profiles preserve contact information, order history, balances, notes, and reusable measurement snapshots."
        action={
          <Link href="/orders/new">
            <Button>New Customer Order</Button>
          </Link>
        }
      />
      <Card className="mb-5">
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[1fr_auto]">
            <Field label="Search customers">
              <Input name="q" placeholder="Name, phone, or customer code" defaultValue={params.q ?? ""} />
            </Field>
            <div className="flex items-end">
              <Button type="submit">Search</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <CustomerTable customers={customers} />
    </AppShell>
  );
}
