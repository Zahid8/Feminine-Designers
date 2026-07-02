import { describe, expect, it } from "vitest";
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
