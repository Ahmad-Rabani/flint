import Link from "next/link";
import { BrandLogo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-ink text-ivory [color-scheme:dark]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255, 107, 0,0.14),transparent_52%)]"
      />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 lg:px-10">
        <header className="mb-12 flex items-center justify-between">
          <BrandLogo variant="wordmark" tone="orange" priority />
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
