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
                ? "border-[#171717] bg-[#171717] text-ivory"
                : "border-[#171717]/20 text-[#171717]/70 hover:border-copper hover:text-copper",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
