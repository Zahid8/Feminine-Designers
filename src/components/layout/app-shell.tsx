import { AppShellFrame } from "@/components/layout/app-shell-frame";
import { logoutAction } from "@/app/(auth)/login/actions";

export async function AppShell({ children }: { children: React.ReactNode }) {
  return <AppShellFrame logoutAction={logoutAction}>{children}</AppShellFrame>;
}
