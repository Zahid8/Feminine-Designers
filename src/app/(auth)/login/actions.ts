"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, createStaffSessionValue, safeNextPath, validateStaffCredentials } from "@/lib/auth/simple-auth";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function loginAction(formData: FormData) {
  const username = formValue(formData, "username");
  const password = formValue(formData, "password");
  const nextPath = safeNextPath(formValue(formData, "next"));

  if (!validateStaffCredentials(username, password)) {
    redirect(`/login?error=1&next=${encodeURIComponent(nextPath)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, createStaffSessionValue(), {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  redirect(nextPath);
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  redirect("/login");
}
