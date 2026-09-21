import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { getServerEnv } from "@/lib/env";

export const ADMIN_COOKIE = "bib_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function secret() {
  return new TextEncoder().encode(getServerEnv().SESSION_SECRET);
}

export async function verifyAdminCredentials(username: string, password: string) {
  const env = getServerEnv();
  if (username !== env.ADMIN_USERNAME) return false;
  if (env.ADMIN_PASSWORD_HASH) return bcrypt.compare(password, env.ADMIN_PASSWORD_HASH);
  return password === env.ADMIN_PASSWORD;
}

export async function createAdminToken() {
  const env = getServerEnv();
  return new SignJWT({ role: "admin", username: env.ADMIN_USERNAME })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifyAdminToken(token?: string | null) {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function isAdminRequest(request: NextRequest) {
  return verifyAdminToken(request.cookies.get(ADMIN_COOKIE)?.value);
}

export async function requireAdminPage() {
  const store = await cookies();
  const ok = await verifyAdminToken(store.get(ADMIN_COOKIE)?.value);
  if (!ok) redirect("/admin/login");
}

export async function hasAdminSession() {
  const store = await cookies();
  return verifyAdminToken(store.get(ADMIN_COOKIE)?.value);
}

export const adminCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
};
