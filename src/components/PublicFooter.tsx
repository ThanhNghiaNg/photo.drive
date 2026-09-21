export default function PublicFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="container-page py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} {process.env.NEXT_PUBLIC_SITE_NAME || "BIBPIX"}. Photo gallery for running events.
      </div>
    </footer>
  );
}
