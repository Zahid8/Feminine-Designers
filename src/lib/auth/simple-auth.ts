export const STAFF_USERNAME = "saif";
export const AUTH_COOKIE_NAME = "fd_staff_session";

// Legacy values are kept only so existing deployments keep working until
// STAFF_PASSWORD and STAFF_SESSION_SECRET are configured in the environment.
// They are public in git history, so set both env vars in production.
const LEGACY_STAFF_PASSWORD = "feminine@222";
const LEGACY_AUTH_COOKIE_VALUE = "fd_staff_saif_authenticated_v1";

function staffPassword() {
  return process.env.STAFF_PASSWORD || LEGACY_STAFF_PASSWORD;
}

function staffSessionValue() {
  return process.env.STAFF_SESSION_SECRET || LEGACY_AUTH_COOKIE_VALUE;
}

export function validateStaffCredentials(username: string, password: string) {
  return username === STAFF_USERNAME && password === staffPassword();
}

export function createStaffSessionValue() {
  return staffSessionValue();
}

export function isStaffSession(value: string | undefined) {
  return value === staffSessionValue();
}

export function safeNextPath(value: string | undefined | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}
