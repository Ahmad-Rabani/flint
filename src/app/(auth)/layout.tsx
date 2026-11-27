import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink text-ivory surface-grain">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 lg:px-10">
        <header className="mb-12 flex items-center justify-between">
          <Link href="/" className="font-heading text-2xl tracking-[0.2em]">
            FLINT
          </Link>
          <Link
            href="/catalogue"
            className="text-xs uppercase tracking-[0.2em] text-ivory/50 transition-colors hover:text-copper"
          >
            Back to shop
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center pb-16">{children}</main>
      </div>
    </div>
  );
}
