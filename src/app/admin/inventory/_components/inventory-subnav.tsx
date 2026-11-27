import Link from "next/link";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin/inventory", label: "Stock Overview", exact: true },
  { href: "/admin/inventory/adjustments", label: "Adjustments", manage: true },
  { href: "/admin/inventory/movements", label: "Movements" },
  { href: "/admin/inventory/low-stock", label: "Low Stock Alerts" },
];

export function InventorySubnav({ current, canAdjust }: { current: string; canAdjust: boolean }) {
  const links = LINKS.filter((link) => !link.manage || canAdjust);

  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {links.map((link) => {
        const active = link.exact ? current === link.href : current.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "border px-3 py-1.5 text-sm transition-colors",
              active
                ? "border-[#1B365D] bg-[#1B365D] text-ivory"
                : "border-[#1B365D]/20 text-[#1B365D]/60 hover:border-copper hover:text-copper",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
