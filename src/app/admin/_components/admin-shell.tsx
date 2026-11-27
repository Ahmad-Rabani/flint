"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Props = {
  nav: React.ReactNode;
  children: React.ReactNode;
  toaster: React.ReactNode;
};

/** Locks the admin chrome to the viewport so only the content pane scrolls. */
export function AdminShell({ nav, children, toaster }: Props) {
  const pathname = usePathname();
  const isPosRegister = pathname === "/admin/pos";

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

  return (
    <div className="flex h-dvh max-h-dvh overflow-hidden bg-[#171717]">
      {nav}
      <main
        className={cn(
          "mt-14 flex min-h-0 min-w-0 flex-1 flex-col overscroll-contain bg-[#f6f3ee] lg:mt-0",
          isPosRegister
            ? "overflow-hidden p-0"
            : "overflow-y-auto px-6 py-8 lg:px-10 lg:py-10",
        )}
      >
        {children}
      </main>
      {toaster}
    </div>
  );
}
