import Link from "next/link";
import mongoose from "mongoose";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import Event from "@/models/Event";
import { eventToDTO } from "@/lib/dto";
import EventForm from "@/components/admin/EventForm";
import ThumbnailPicker from "@/components/admin/ThumbnailPicker";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) notFound();
  await connectMongo();
  const doc = await Event.findById(id).lean();
  if (!doc) notFound();
  const event = eventToDTO(doc);

  return <main className="container-page py-8"><div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><Link href="/admin/events" className="text-sm font-semibold text-slate-500 hover:text-blue-600">← Events</Link><h1 className="mt-2 text-2xl font-black">{event.name}</h1><p className="mt-1 text-sm text-slate-500">{formatNumber(event.photoCount)} ảnh • {event.status} • sync: {event.syncStatus}</p></div>{event.status === "published" && <Link href={`/events/${event.slug}`} target="_blank" className="btn-secondary">Mở gallery ↗</Link>}</div><EventForm mode="edit" event={event} /><div className="mt-6"><ThumbnailPicker eventId={event.id} selected={event.thumbnailFileId} /></div></main>;
}
