"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PhotoDTO } from "@/types";

export default function ThumbnailPicker({ eventId, selected }: { eventId: string; selected: string }) {
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoDTO[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [current, setCurrent] = useState(selected);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError("");
    fetch(`/api/admin/events/${eventId}/photos?page=${page}&limit=40`)
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "Không tải được ảnh"); return d; })
      .then((d) => { if (!cancelled) { setPhotos(d.photos); setTotalPages(d.totalPages); } })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [eventId, page]);

  async function choose(fileId: string) {
    setCurrent(fileId); setSaving(true); setError("");
    try {
      const r = await fetch(`/api/admin/events/${eventId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ thumbnailFileId: fileId }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Không lưu được thumbnail");
      router.refresh();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Chọn thumbnail</h2><p className="text-sm text-slate-500">Click một ảnh để dùng làm thumbnail/hero.</p></div><span className="text-xs text-slate-500">Trang {page}/{totalPages} {saving && "• Đang lưu..."}</span></div>
      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading ? <div className="py-10 text-center text-sm text-slate-500">Đang tải ảnh...</div> : photos.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8">{photos.map((photo) => <button type="button" key={photo.id} onClick={() => choose(photo.driveFileId)} className={`relative aspect-[4/3] overflow-hidden rounded-lg border-2 bg-slate-100 ${current === photo.driveFileId ? "border-amber-400 ring-2 ring-amber-200" : "border-transparent"}`}><img src={`/api/images/${photo.driveFileId}?variant=thumb`} alt={photo.fileName} className="h-full w-full object-cover" loading="lazy" />{current === photo.driveFileId && <span className="absolute right-1 top-1 rounded-full bg-amber-400 px-2 py-1 text-xs font-black text-slate-900">✓</span>}</button>)}</div> : <div className="py-10 text-center text-sm text-slate-500">Chưa có ảnh. Hãy Sync Google Drive trước.</div>}
      <div className="mt-5 flex items-center justify-center gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary disabled:opacity-40">← Trước</button><input aria-label="Trang thumbnail" type="number" min={1} max={totalPages} value={page} onChange={(e) => setPage(Math.min(totalPages, Math.max(1, Number(e.target.value) || 1)))} className="w-20 rounded-lg border border-slate-300 px-3 py-2.5 text-center" /><button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="btn-secondary disabled:opacity-40">Sau →</button></div>
    </div>
  );
}
