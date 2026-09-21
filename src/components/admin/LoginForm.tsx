"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Đăng nhập thất bại");
      const next = search.get("next");
      router.push(next && next.startsWith("/admin") ? next : "/admin/events");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="card w-full max-w-md p-7">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Admin login</h1>
        <p className="mt-1 text-sm text-slate-500">Quản lý event và đồng bộ Google Drive.</p>
      </div>
      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <label className="label">Username</label>
      <input className="input mb-4" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
      <label className="label">Password</label>
      <input className="input mb-5" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      <button className="btn-primary w-full" disabled={loading}>{loading ? "Đang đăng nhập..." : "Đăng nhập"}</button>
    </form>
  );
}
