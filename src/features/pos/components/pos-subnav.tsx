import Link from "next/link";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin/pos", label: "Checkout" },
  { href: "/admin/pos/sales", label: "Sales History" },
  { href: "/admin/pos/refunds", label: "Refunds" },
];

export function PosSubnav({ current }: { current: string }) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {LINKS.map((link) => {
        const active = current === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "inline-flex min-h-11 items-center border px-4 text-sm transition-colors",
              active
                ? "border-[#1B365D] bg-[#1B365D] text-ivory"
                : "border-[#1B365D]/20 text-[#1B365D]/70 hover:border-copper hover:text-copper",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
