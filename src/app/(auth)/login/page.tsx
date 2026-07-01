import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { LogoMark } from "@/components/shared/logo-mark";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <LogoMark compact />
          <CardTitle>Staff Login</CardTitle>
          <p className="text-sm text-[#7c6d66]">Supabase Auth protects operational screens when credentials are configured.</p>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field label="Email">
            <Input type="email" placeholder="staff@example.com" />
          </Field>
          <Field label="Password">
            <Input type="password" />
          </Field>
          <Button>Sign in</Button>
        </CardContent>
      </Card>
    </main>
  );
}
