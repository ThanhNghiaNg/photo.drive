"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { PhotoDTO } from "@/types";

export default function PhotoGallery({ photos }: { photos: PhotoDTO[] }) {
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
      if (e.key === "ArrowRight") setActive((v) => (v === null ? null : Math.min(photos.length - 1, v + 1)));
      if (e.key === "ArrowLeft") setActive((v) => (v === null ? null : Math.max(0, v - 1)));
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [active, photos.length]);

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5 xl:grid-cols-6">
        {photos.map((photo, index) => (
          <button key={photo.id} onClick={() => setActive(index)} className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100 text-left">
            <Image src={`/api/images/${photo.driveFileId}?variant=thumb`} alt={photo.fileName} fill className="object-cover transition group-hover:scale-[1.03]" sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 17vw" />
          </button>
        ))}
      </div>

      {active !== null && photos[active] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setActive(null)}>
          <button className="absolute right-4 top-4 rounded-full bg-white/10 px-4 py-2 text-2xl text-white" onClick={() => setActive(null)}>×</button>
          <button disabled={active === 0} onClick={(e) => { e.stopPropagation(); setActive((v) => (v === null ? null : Math.max(0, v - 1))); }} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-2xl text-white disabled:opacity-30 sm:left-5">‹</button>
          <div className="relative h-[82vh] w-[88vw]" onClick={(e) => e.stopPropagation()}>
            <Image src={`/api/images/${photos[active].driveFileId}?variant=full`} alt={photos[active].fileName} fill className="object-contain" sizes="90vw" priority />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">{photos[active].fileName}</div>
          </div>
          <button disabled={active === photos.length - 1} onClick={(e) => { e.stopPropagation(); setActive((v) => (v === null ? null : Math.min(photos.length - 1, v + 1))); }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-2xl text-white disabled:opacity-30 sm:right-5">›</button>
        </div>
      )}
    </>
  );
}
