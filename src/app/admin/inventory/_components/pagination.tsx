import Link from "next/link";
import { cn } from "@/lib/utils";

export function withQuery(
  path: string,
  params: Record<string, string | number | undefined | null>,
  page?: number,
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  if (page && page > 1) search.set("page", String(page));
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

export function InventoryPagination({
  page,
  totalPages,
  makeHref,
}: {
  page: number;
  totalPages: number;
  makeHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  const pages: number[] = [];
  for (let current = start; current <= end; current += 1) pages.push(current);

  const linkClass = (active: boolean) =>
    cn(
      "border px-3 py-1.5 text-sm transition-colors",
      active
        ? "border-[#1B365D] bg-[#1B365D] text-ivory"
        : "border-[#1B365D]/20 text-[#1B365D]/60 hover:border-copper hover:text-copper",
    );

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      {page > 1 && (
        <Link href={makeHref(page - 1)} className={linkClass(false)}>
          Previous
        </Link>
      )}
      {start > 1 && <span className="px-1 text-sm text-[#1B365D]/30">…</span>}
      {pages.map((item) => (
        <Link key={item} href={makeHref(item)} className={linkClass(item === page)}>
          {item}
        </Link>
      ))}
      {end < totalPages && <span className="px-1 text-sm text-[#1B365D]/30">…</span>}
      {page < totalPages && (
        <Link href={makeHref(page + 1)} className={linkClass(false)}>
          Next
        </Link>
      )}
    </div>
  );
}
