"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteEventButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function remove() {
    if (!confirm(`Xoá event “${name}” và toàn bộ photo index trong MongoDB? Ảnh trên Google Drive sẽ không bị xoá.`)) return;
    setLoading(true);
    const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) return alert("Không thể xoá event.");
    router.refresh();
  }
  return <button onClick={remove} disabled={loading} className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">{loading ? "Đang xoá..." : "Xoá"}</button>;
}
