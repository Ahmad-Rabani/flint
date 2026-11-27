import Link from "next/link";
import { cn } from "@/lib/utils";
import { reportHref, type ReportRange } from "@/features/reports/range";

const LINKS = [
  { href: "/admin/reports", label: "Overview" },
  { href: "/admin/reports/orders", label: "Orders" },
  { href: "/admin/reports/inventory", label: "Inventory" },
  { href: "/admin/reports/pos", label: "POS" },
];

const inputCls =
  "border border-[#171717]/20 bg-white px-3 py-2 text-sm text-[#171717] focus:border-copper focus:outline-none";

export function ReportShell({
  title,
  description,
  current,
  range,
  showRange = true,
  children,
}: {
  title: string;
  description?: string;
  current: string;
  range: ReportRange;
  showRange?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-copper/70">Reports</p>
      <h1 className="mt-1 font-heading text-4xl text-[#171717]">{title}</h1>
      {description ? <p className="mt-2 max-w-2xl text-sm text-[#171717]/55">{description}</p> : null}

      <nav className="mt-5 flex flex-wrap gap-2">
        {LINKS.map((link) => {
          const active = link.href === current;
          return (
            <Link
              key={link.href}
              href={reportHref(link.href, range)}
              className={cn(
                "border px-3 py-1.5 text-sm transition-colors",
                active
                  ? "border-[#171717] bg-[#171717] text-ivory"
                  : "border-[#171717]/20 text-[#171717]/70 hover:border-copper hover:text-copper",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {showRange ? (
        <form method="GET" className="mt-5 flex flex-wrap items-end gap-3">
          <label className="text-sm text-[#171717]">
            <span className="mb-1.5 block text-xs uppercase tracking-widest text-[#171717]/50">From</span>
            <input type="date" name="from" defaultValue={range.fromInput} className={inputCls} />
          </label>
          <label className="text-sm text-[#171717]">
            <span className="mb-1.5 block text-xs uppercase tracking-widest text-[#171717]/50">To</span>
            <input type="date" name="to" defaultValue={range.toInput} className={inputCls} />
          </label>
          <button
            type="submit"
            className="border border-[#171717]/20 px-4 py-2 text-sm text-[#171717]/70 transition-colors hover:border-copper hover:text-copper"
          >
            Apply
          </button>
        </form>
      ) : null}

      {children}
    </div>
  );
}

export function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border border-[#171717]/10 bg-white px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#171717]/40">{label}</p>
      <p className="mt-1 font-heading text-3xl text-[#171717]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[#171717]/45">{hint}</p> : null}
    </div>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return <div className="mt-5 border border-[#171717]/10 bg-white p-12 text-center text-sm text-[#171717]/45">{children}</div>;
}
