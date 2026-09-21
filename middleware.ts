import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = "bib_admin_session";

async function validSession(request: NextRequest) {
  const token = request.cookies.get(COOKIE)?.value;
  const secret = process.env.SESSION_SECRET;
  if (!token || !secret) return false;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isLogin = path === "/admin/login" || path === "/api/admin/login";
  const isAdminPath = path.startsWith("/admin") || path.startsWith("/api/admin");

  if (!isAdminPath || isLogin) return NextResponse.next();
  if (await validSession(request)) return NextResponse.next();

  if (path.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", path);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
