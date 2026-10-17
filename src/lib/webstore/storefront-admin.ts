import { createHmac, randomBytes } from "node:crypto";
import { webstoreEnv } from "@/lib/webstore/env";

// Server-only. One-click "Edit storefront": a short-lived, single-use token the
// webstore verifies (store/views_sso.py) before signing the manager in as a superuser.
// Token = base64url(JSON payload, keys sorted) + "." + base64url(HMAC-SHA256(key, payload)),
// key = HMAC-SHA256(WEBSTORE_API_TOKEN, "feminine-designer/storefront-admin/v1").

const CONTEXT = "feminine-designer/storefront-admin/v1";
export const MANAGER_USERNAME = process.env.STOREFRONT_MANAGER_USERNAME || "manager";

function b64url(buffer: Buffer) {
  return buffer.toString("base64url");
}

export function storefrontAdminToken(
  secret: string,
  { username = MANAGER_USERNAME, next = "/admin/", ttlSeconds = 120, nonce, now = Date.now() }: { username?: string; next?: string; ttlSeconds?: number; nonce?: string; now?: number } = {}
) {
  const payload = { exp: Math.floor(now / 1000) + ttlSeconds, n: nonce ?? b64url(randomBytes(12)), next, u: username };
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  const key = createHmac("sha256", secret).update(CONTEXT).digest();
  const signature = b64url(createHmac("sha256", key).update(body).digest());
  return `${body}.${signature}`;
}

/** Absolute webstore URL that opens the admin signed in, or undefined when the webstore is not configured. */
export function storefrontAdminUrl(next = "/admin/") {
  const { url, token } = webstoreEnv();
  if (!url || !token) return undefined;
  return `${url}/admin/handoff/?t=${encodeURIComponent(storefrontAdminToken(token, { next }))}`;
}
