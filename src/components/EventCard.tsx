import Image from "next/image";
import Link from "next/link";
import type { EventDTO } from "@/types";
import { formatDate, formatNumber } from "@/lib/format";

export default function EventCard({ event }: { event: EventDTO }) {
  return (
    <Link href={`/events/${event.slug}`} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {event.thumbnailFileId ? (
          <Image
            src={`/api/images/${event.thumbnailFileId}?variant=thumb`}
            alt={event.name}
            fill
            unoptimized
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">Chưa chọn thumbnail</div>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 min-h-12 font-bold leading-6 text-slate-800 group-hover:text-blue-600">{event.name}</h3>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <span>📅 {formatDate(event.eventDate)}</span>
          <span>📷 {formatNumber(event.photoCount)} ảnh</span>
        </div>
        {event.location && <p className="mt-2 truncate text-xs text-slate-500">📍 {event.location}</p>}
      </div>
    </Link>
  );
}
