import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import Event from "@/models/Event";
import { eventToDTO } from "@/lib/dto";
import { formatDate, formatNumber } from "@/lib/format";
import DeleteEventButton from "@/components/admin/DeleteEventButton";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  await requireAdminPage();
  await connectMongo();
  const events = (await Event.find().sort({ eventDate: -1, createdAt: -1 }).lean()).map(eventToDTO);

  return <main className="container-page py-8">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-black">Events</h1><p className="mt-1 text-sm text-slate-500">Quản lý giải chạy và photo index.</p></div><Link href="/admin/events/new" className="btn-primary">+ Tạo event</Link></div>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
      <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Event</th><th className="px-4 py-3">Ngày</th><th className="px-4 py-3">Ảnh</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Sync</th><th className="px-4 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{events.map((event) => <tr key={event.id} className="hover:bg-slate-50"><td className="px-4 py-4"><div className="font-bold text-slate-800">{event.name}</div><div className="mt-1 text-xs text-slate-400">/{event.slug}</div></td><td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatDate(event.eventDate)}</td><td className="px-4 py-4 font-semibold">{formatNumber(event.photoCount)}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${event.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{event.status}</span>{event.featured && <span className="ml-2 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">featured</span>}</td><td className="px-4 py-4 text-xs text-slate-500">{event.syncStatus}{event.lastSyncedAt ? <div>{new Date(event.lastSyncedAt).toLocaleString("vi-VN")}</div> : null}</td><td className="whitespace-nowrap px-4 py-4 text-right"><Link href={`/admin/events/${event.id}`} className="rounded-lg px-3 py-2 font-semibold text-blue-600 hover:bg-blue-50">Sửa</Link><DeleteEventButton id={event.id} name={event.name} /></td></tr>)}</tbody></table></div>
      {!events.length && <div className="p-10 text-center text-slate-500">Chưa có event. Tạo event đầu tiên để bắt đầu.</div>}
    </div>
  </main>;
}
