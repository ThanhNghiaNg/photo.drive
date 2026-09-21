import { notFound } from "next/navigation";
import { connectMongo } from "@/lib/mongodb";
import Event from "@/models/Event";
import Photo from "@/models/Photo";
import { eventToDTO, photoToDTO } from "@/lib/dto";
import { formatDate, formatNumber } from "@/lib/format";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import PhotoGallery from "@/components/PhotoGallery";
import Pagination from "@/components/Pagination";

export const dynamic = "force-dynamic";

export default async function EventPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  await connectMongo();
  const eventDoc = await Event.findOne({ slug, status: "published" }).lean();
  if (!eventDoc) notFound();
  const event = eventToDTO(eventDoc);
  const limit = 60;
  const requested = Math.max(1, Number(sp.page || 1));
  const totalPages = Math.max(1, Math.ceil(event.photoCount / limit));
  const page = Math.min(requested, totalPages);
  const photoDocs = await Photo.find({ eventId: event.id }).sort({ position: 1, _id: 1 }).skip((page - 1) * limit).limit(limit).lean();
  const photos = photoDocs.map(photoToDTO);

  return <>
    <PublicHeader />
    <main className="container-page py-8">
      <div className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-bold text-blue-600 sm:text-3xl">{event.name}</h1>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500"><span>📅 {formatDate(event.eventDate)}</span>{event.location && <span>📍 {event.location}</span>}<span>📷 {formatNumber(event.photoCount)} ảnh</span></div>
        {event.description && <p className="mt-4 max-w-4xl whitespace-pre-line text-sm leading-6 text-slate-600">{event.description}</p>}
      </div>

      <div className="mb-4 flex items-center justify-between gap-4"><p className="text-sm font-semibold text-slate-700">Trang {page}/{totalPages}</p><p className="text-xs text-slate-500">60 ảnh / trang</p></div>
      {photos.length ? <PhotoGallery photos={photos} /> : <div className="card p-10 text-center text-slate-500">Event này chưa có ảnh.</div>}
      <Pagination currentPage={page} totalPages={totalPages} basePath={`/events/${event.slug}`} />
    </main>
    <PublicFooter />
  </>;
}
