"use client";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-11 items-center border border-[#1B365D] bg-[#1B365D] px-5 text-sm text-ivory transition-colors hover:bg-[#1B365D]/90"
    >
      {label}
    </button>
  );
}
