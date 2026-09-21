import { NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE, adminCookieOptions, createAdminToken, verifyAdminCredentials } from "@/lib/auth";

const schema = z.object({ username: z.string().min(1), password: z.string().min(1) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Thiếu tài khoản hoặc mật khẩu." }, { status: 400 });

  const ok = await verifyAdminCredentials(parsed.data.username, parsed.data.password);
  if (!ok) return NextResponse.json({ error: "Tài khoản hoặc mật khẩu không đúng." }, { status: 401 });

  const token = await createAdminToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, token, adminCookieOptions);
  return response;
}
