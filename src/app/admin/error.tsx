"use client";

import Link from "next/link";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-copper">Admin</p>
      <h1 className="mt-3 font-heading text-4xl text-[#171717]">This page failed to load</h1>
      <p className="mt-3 text-sm leading-relaxed text-[#171717]/55">
        The request did not finish. You can try again or go back to the dashboard.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="border border-[#171717] bg-[#171717] px-5 py-2.5 text-sm text-ivory transition-colors hover:bg-[#171717]/90"
        >
          Try again
        </button>
        <Link
          href="/admin"
          className="border border-[#171717]/20 px-5 py-2.5 text-sm text-[#171717] transition-colors hover:border-copper hover:text-copper"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
