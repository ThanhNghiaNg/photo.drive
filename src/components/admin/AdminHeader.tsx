"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (pathname === "/admin/login") return null;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="container-page flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin/events" className="font-black text-slate-900">BIBPIX Admin</Link>
          <Link href="/" target="_blank" className="text-sm font-semibold text-slate-500 hover:text-blue-600">Xem website ↗</Link>
        </div>
        <button onClick={logout} disabled={loading} className="text-sm font-semibold text-slate-500 hover:text-red-600">Đăng xuất</button>
      </div>
    </header>
  );
}
