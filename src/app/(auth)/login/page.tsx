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
      <Card className="w-full max-w-md shadow-raised-lg">
        <CardHeader className="grid gap-3">
          <LogoMark compact />
          <CardTitle className="mt-2">Staff Login</CardTitle>
          <p className="text-sm text-muted">Enter the staff password to manage orders, customers, settings, and receipts.</p>
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
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-danger">
                Incorrect password. Try again.
              </div>
            ) : null}
            <Button type="submit" className="mt-1">Sign in</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
