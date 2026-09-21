"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type Props = {
  currentPage: number;
  totalPages: number;
  basePath: string;
  pageParam?: string;
};

function pageHref(basePath: string, param: string, page: number) {
  const separator = basePath.includes("?") ? "&" : "?";
  return page <= 1 ? basePath : `${basePath}${separator}${param}=${page}`;
}

export default function Pagination({ currentPage, totalPages, basePath, pageParam = "page" }: Props) {
  const router = useRouter();
  const [jump, setJump] = useState(String(currentPage));

  const pages = useMemo(() => {
    const set = new Set<number>([1, totalPages]);
    for (let i = currentPage - 2; i <= currentPage + 2; i++) if (i >= 1 && i <= totalPages) set.add(i);
    return Array.from(set).sort((a, b) => a - b);
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  function submit(e: FormEvent) {
    e.preventDefault();
    const n = Math.min(totalPages, Math.max(1, Number(jump) || 1));
    router.push(pageHref(basePath, pageParam, n));
  }

  return (
    <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link className={`rounded-lg border px-3 py-2 text-sm ${currentPage <= 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-50"}`} href={pageHref(basePath, pageParam, currentPage - 1)}>←</Link>
        {pages.map((page, index) => {
          const prev = pages[index - 1];
          return (
            <span key={page} className="flex items-center gap-2">
              {prev && page - prev > 1 && <span className="text-slate-400">…</span>}
              <Link
                href={pageHref(basePath, pageParam, page)}
                className={`min-w-10 rounded-lg border px-3 py-2 text-center text-sm font-semibold ${page === currentPage ? "border-amber-400 bg-amber-400 text-slate-900" : "border-slate-200 bg-white hover:bg-slate-50"}`}
              >{page}</Link>
            </span>
          );
        })}
        <Link className={`rounded-lg border px-3 py-2 text-sm ${currentPage >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-slate-50"}`} href={pageHref(basePath, pageParam, currentPage + 1)}>→</Link>
      </div>
      <form onSubmit={submit} className="flex items-center gap-2 text-sm">
        <span className="text-slate-500">Đi đến trang</span>
        <input value={jump} onChange={(e) => setJump(e.target.value)} inputMode="numeric" className="w-20 rounded-lg border border-slate-300 px-3 py-2" />
        <button className="rounded-lg bg-slate-900 px-3 py-2 font-semibold text-white">Đi</button>
      </form>
    </div>
  );
}
