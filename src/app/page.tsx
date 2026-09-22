import Image from "next/image";
import Link from "next/link";
import { connectMongo } from "@/lib/mongodb";
import Event from "@/models/Event";
import { eventToDTO } from "@/lib/dto";
import EventCard from "@/components/EventCard";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import Pagination from "@/components/Pagination";
import { formatDate, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await connectMongo();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || 1));
  const limit = 12;
  const filter = { status: "published" } as const;
  const [heroDoc, featuredDocs, eventDocs, total] = await Promise.all([
    Event.findOne(filter).sort({ eventDate: -1, createdAt: -1 }).lean(),
    Event.find({ ...filter, featured: true }).sort({ sortOrder: 1, eventDate: -1 }).limit(4).lean(),
    Event.find(filter).sort({ sortOrder: 1, eventDate: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Event.countDocuments(filter),
  ]);
  const hero = heroDoc ? eventToDTO(heroDoc) : null;
  const featured = featuredDocs.map(eventToDTO);
  const events = eventDocs.map(eventToDTO);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return <>
    <PublicHeader />
    <main>
      {hero && (
        <section className="relative overflow-hidden bg-slate-900">
          <div className="relative h-[360px] sm:h-[430px] lg:h-[500px]">
            {hero.thumbnailFileId && <Image src={`/api/images/${hero.thumbnailFileId}`} alt={hero.name} fill priority unoptimized className="object-cover opacity-70" sizes="100vw" />}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="container-page relative flex h-full items-end pb-10 sm:pb-14">
              <div className="max-w-3xl text-white">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Sự kiện mới nhất</p>
                <h1 className="text-3xl font-black sm:text-5xl">{hero.name}</h1>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/90"><span>📅 {formatDate(hero.eventDate)}</span>{hero.location && <span>📍 {hero.location}</span>}<span>📷 {formatNumber(hero.photoCount)} ảnh</span></div>
                <Link href={`/events/${hero.slug}`} className="mt-6 inline-flex rounded-lg bg-amber-400 px-5 py-3 font-bold text-slate-950 hover:bg-amber-300">Xem tất cả ảnh →</Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="container-page py-10">
        {featured.length > 0 && <section>
          <h2 className="mb-6 text-center text-3xl font-bold text-blue-600">Sự kiện nổi bật</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{featured.map((event) => <EventCard key={event.id} event={event} />)}</div>
        </section>}

        <section className="mt-12">
          <h2 className="mb-6 text-center text-3xl font-bold text-blue-600">Danh sách sự kiện</h2>
          {events.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{events.map((event) => <EventCard key={event.id} event={event} />)}</div> : <div className="card p-10 text-center text-slate-500">Chưa có sự kiện được publish.</div>}
          <Pagination currentPage={Math.min(page, totalPages)} totalPages={totalPages} basePath="/" />
        </section>
      </div>
    </main>
    <PublicFooter />
  </>;
}
