import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-ink text-ivory [color-scheme:dark]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(184,115,79,0.14),transparent_52%)]"
      />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 lg:px-10">
        <header className="mb-12 flex items-center justify-between">
          <Link href="/" className="font-heading text-2xl tracking-[0.2em] text-ivory">
            FLINT
          </Link>
          <Link
            href="/catalogue"
            className="text-xs uppercase tracking-[0.2em] text-ivory/80 transition-colors hover:text-copper"
          >
            Back to shop
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center pb-16">{children}</main>
      </div>
    </div>
  );
}
