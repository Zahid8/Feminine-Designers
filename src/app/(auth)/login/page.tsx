import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { LogoMark } from "@/components/shared/logo-mark";
import { STAFF_USERNAME, safeNextPath } from "@/lib/auth/simple-auth";
import { loginAction } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const query = await searchParams;
  const nextPath = safeNextPath(query.next);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <LogoMark compact />
          <CardTitle>Staff Login</CardTitle>
          <p className="text-sm text-[#7c6d66]">Enter the staff password to manage orders, customers, settings, and receipts.</p>
        </CardHeader>
        <CardContent>
          <form action={loginAction} className="grid gap-4">
            <input type="hidden" name="next" value={nextPath} />
            <Field label="Username">
              <Input name="username" value={STAFF_USERNAME} readOnly aria-readonly="true" />
            </Field>
            <Field label="Password">
              <Input name="password" type="password" autoComplete="current-password" autoFocus required />
            </Field>
            {query.error ? (
              <div className="rounded-md border border-[#f0c2c2] bg-[#fff5f5] px-3 py-2 text-sm font-semibold text-[#a83232]">
                Incorrect password. Try again.
              </div>
            ) : null}
            <Button type="submit">Sign in</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
