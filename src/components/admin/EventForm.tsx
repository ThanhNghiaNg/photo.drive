"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { EventDTO } from "@/types";

type Props = { mode: "create" | "edit"; event?: EventDTO };

export async function syncEvent(eventId: string, onProgress?: (processed: number) => void) {
  let runId = "";
  let pageToken = "";
  let basePosition = 0;
  for (;;) {
    const response = await fetch(`/api/admin/events/${eventId}/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId: runId || undefined, pageToken: pageToken || undefined, basePosition }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Sync failed");
    onProgress?.(Number(data.processed || 0));
    if (data.done) return data;
    runId = data.runId;
    pageToken = data.nextPageToken;
    basePosition = data.basePosition;
  }
}

export default function EventForm({ mode, event }: Props) {
  const router = useRouter();
  const [name, setName] = useState(event?.name || "");
  const [slug, setSlug] = useState(event?.slug || "");
  const [description, setDescription] = useState(event?.description || "");
  const [eventDate, setEventDate] = useState(event?.eventDate.slice(0, 10) || "");
  const [location, setLocation] = useState(event?.location || "");
  const [driveFolder, setDriveFolder] = useState(event?.driveFolderId || "");
  const [featured, setFeatured] = useState(event?.featured || false);
  const [sortOrder, setSortOrder] = useState(String(event?.sortOrder || 0));
  const [status, setStatus] = useState<"draft" | "published">(event?.status || "draft");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncCount, setSyncCount] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const payload = { name, slug, description, eventDate, location, driveFolder, featured, sortOrder: Number(sortOrder || 0), status };

  async function save(e?: FormEvent) {
    e?.preventDefault();
    setError(""); setMessage(""); setLoading(true);
    try {
      const url = mode === "create" ? "/api/admin/events" : `/api/admin/events/${event!.id}`;
      const response = await fetch(url, { method: mode === "create" ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể lưu event.");
      setMessage("Đã lưu event.");
      if (mode === "create") {
        setSyncing(true);
        await syncEvent(data.event.id, setSyncCount);
        router.push(`/admin/events/${data.event.id}`);
      } else {
        router.refresh();
      }
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); setSyncing(false); }
  }

  async function runSync() {
    if (!event) return;
    setError(""); setMessage(""); setSyncing(true); setSyncCount(0);
    try {
      // Save the current form first so a newly pasted Drive folder is used by this sync.
      const saveResponse = await fetch(`/api/admin/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const saveData = await saveResponse.json();
      if (!saveResponse.ok) throw new Error(saveData.error || "Không thể lưu event trước khi sync.");

      const result = await syncEvent(event.id, setSyncCount);
      setMessage(`Sync hoàn tất: ${result.total.toLocaleString("vi-VN")} ảnh${result.removed ? `, xoá ${result.removed} index cũ` : ""}.`);
      router.refresh();
    } catch (err: any) { setError(err.message); }
    finally { setSyncing(false); }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      {(error || message || syncing) && <div className={`rounded-xl border p-4 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}>{error || (syncing ? `Đang sync Google Drive… đã xử lý ${syncCount.toLocaleString("vi-VN")} ảnh` : message)}</div>}
      <div className="card p-6">
        <h2 className="mb-5 text-lg font-bold">Thông tin giải chạy</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2"><label className="label">Tên giải *</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div><label className="label">Slug {mode === "create" && <span className="font-normal text-slate-400">(để trống sẽ tự tạo)</span>}</label><input className="input" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="world-entrepreneur-tournament-2026" /></div>
          <div><label className="label">Ngày diễn ra *</label><input type="date" className="input" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required /></div>
          <div><label className="label">Địa điểm</label><input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Hà Nội" /></div>
          <div><label className="label">Sort order</label><input type="number" className="input" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} /></div>
          <div className="md:col-span-2"><label className="label">Mô tả</label><textarea className="input min-h-28" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-2 text-lg font-bold">Google Drive</h2>
        <p className="mb-4 text-sm text-slate-500">Paste URL folder hoặc folder ID. Folder phải được share Viewer cho Service Account.</p>
        <label className="label">Google Drive Folder *</label>
        <input className="input" value={driveFolder} onChange={(e) => setDriveFolder(e.target.value)} required placeholder="https://drive.google.com/drive/folders/..." />
        {mode === "edit" && <div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" onClick={runSync} disabled={syncing || loading} className="btn-secondary">{syncing ? "Đang sync..." : "Sync Google Drive"}</button><span className="text-xs text-slate-500">Sync chạy tuần tự từng batch 500 file để phù hợp Vercel serverless.</span></div>}
      </div>

      <div className="card p-6">
        <div className="grid gap-5 sm:grid-cols-3">
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4"><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4" /><span><b className="block text-sm">Sự kiện nổi bật</b><span className="text-xs text-slate-500">Hiện ở khu vực featured trên trang chủ</span></span></label>
          <div><label className="label">Trạng thái</label><select className="input" value={status} onChange={(e) => setStatus(e.target.value as any)}><option value="draft">Draft</option><option value="published">Published</option></select></div>
          <div className="flex items-end"><button type="submit" disabled={loading || syncing} className="btn-primary w-full">{loading ? (syncing ? `Đang sync ${syncCount.toLocaleString("vi-VN")} ảnh…` : "Đang lưu...") : mode === "create" ? "Tạo event & sync Drive" : "Lưu thay đổi"}</button></div>
        </div>
      </div>
    </form>
  );
}
