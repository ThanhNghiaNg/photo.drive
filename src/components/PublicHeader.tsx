import Link from "next/link";

export default function PublicHeader() {
  const name = process.env.NEXT_PUBLIC_SITE_NAME || "BIBPIX";
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3 font-black tracking-tight text-slate-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-blue-600 text-lg text-white">B</span>
          <span className="text-xl">{name}</span>
        </Link>
        <nav className="text-sm font-semibold text-slate-600">
          <Link href="/" className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-blue-600">Sự kiện</Link>
        </nav>
      </div>
    </header>
  );
}
