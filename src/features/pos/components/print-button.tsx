"use client";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-11 items-center border border-[#171717] bg-[#171717] px-5 text-sm text-ivory transition-colors hover:bg-[#171717]/90"
    >
      {label}
    </button>
  );
}
