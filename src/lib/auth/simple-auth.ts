export const STAFF_USERNAME = "saif";
export const AUTH_COOKIE_NAME = "fd_staff_session";

const STAFF_PASSWORD = "feminine@222";
const AUTH_COOKIE_VALUE = "fd_staff_saif_authenticated_v1";

export function validateStaffCredentials(username: string, password: string) {
  return username === STAFF_USERNAME && password === STAFF_PASSWORD;
}

export function createStaffSessionValue() {
  return AUTH_COOKIE_VALUE;
}

export function isStaffSession(value: string | undefined) {
  return value === AUTH_COOKIE_VALUE;
}

export function safeNextPath(value: string | undefined | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}
