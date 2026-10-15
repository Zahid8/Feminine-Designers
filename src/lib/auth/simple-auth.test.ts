import { describe, expect, it, vi } from "vitest";
import { AUTH_COOKIE_NAME, createStaffSessionValue, isStaffSession, validateStaffCredentials } from "./simple-auth";

describe("simple staff auth", () => {
  it("accepts only the hardcoded staff credentials", () => {
    expect(validateStaffCredentials("saif", "feminine@222")).toBe(true);
    expect(validateStaffCredentials("Saif", "feminine@222")).toBe(false);
    expect(validateStaffCredentials("saif", "wrong-password")).toBe(false);
  });

  it("recognizes only the issued staff session cookie", () => {
    const sessionValue = createStaffSessionValue();

    expect(AUTH_COOKIE_NAME).toBe("fd_staff_session");
    expect(isStaffSession(sessionValue)).toBe(true);
    expect(isStaffSession("")).toBe(false);
    expect(isStaffSession("fd_staff_session")).toBe(false);
  });
});

describe("simple staff auth with environment overrides", () => {
  it("uses STAFF_PASSWORD and STAFF_SESSION_SECRET when configured", () => {
    vi.stubEnv("STAFF_PASSWORD", "env-password");
    vi.stubEnv("STAFF_SESSION_SECRET", "env-session-secret");

    expect(validateStaffCredentials("saif", "env-password")).toBe(true);
    expect(validateStaffCredentials("saif", "feminine@222")).toBe(false);
    expect(createStaffSessionValue()).toBe("env-session-secret");
    expect(isStaffSession("fd_staff_saif_authenticated_v1")).toBe(false);

    vi.unstubAllEnvs();
  });
});
