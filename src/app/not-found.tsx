import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-ink px-6 py-24 text-center text-ivory">
      <p className="text-xs uppercase tracking-[0.35em] text-copper">404</p>
      <h1 className="mt-4 font-heading text-5xl text-ivory sm:text-6xl">Page not found</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-ivory/60">
        That page is not in the catalogue. The piece you want may have moved, or the link is out of date.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center bg-copper px-6 py-3 text-xs uppercase tracking-[0.2em] text-white transition-colors hover:bg-copper/90"
        >
          Back home
        </Link>
        <Link
          href="/catalogue"
          className="inline-flex items-center border border-ivory/25 px-6 py-3 text-xs uppercase tracking-[0.2em] text-ivory/80 transition-colors hover:border-ivory/50 hover:text-ivory"
        >
          Browse the shop
        </Link>
      </div>
    </div>
  );
}
