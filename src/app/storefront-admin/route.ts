import { NextResponse } from "next/server";
import { storefrontAdminUrl } from "@/lib/webstore/storefront-admin";
import { isSafeInternalPath } from "@/lib/utils/safe-url";

export const dynamic = "force-dynamic";

/** Staff-only (middleware): mint a fresh handoff link and send the manager to the webstore admin. */
export function GET(request: Request) {
  const next = new URL(request.url).searchParams.get("next") || "/admin/";
  // Only same-site paths; "//host" or backslash tricks fall back to the admin home.
  const target = storefrontAdminUrl(isSafeInternalPath(next) ? next : "/admin/");
  if (!target) return new NextResponse("Webstore is not configured (WEBSTORE_API_URL / WEBSTORE_API_TOKEN).", { status: 404 });
  return NextResponse.redirect(target, { status: 302, headers: { "Cache-Control": "no-store" } });
}
