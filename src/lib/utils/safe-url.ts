/** The URL if it is a plain http(s) link, otherwise undefined (blocks javascript:, data:, etc.). */
export function safeHttpUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** True for a same-site absolute path like "/admin/orders/" (not "//host", not a backslash trick). */
export function isSafeInternalPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") && !/[\\\u0000-\u001f]/.test(value);
}
