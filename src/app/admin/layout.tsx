import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/admin";
import { clearSessionCookie } from "@/lib/auth/session";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "◇" },
  { href: "/admin/custom-orders", label: "Custom Orders", icon: "⚙" },
];

async function logoutAction() {
  "use server";
  await clearSessionCookie();
  redirect("/login");
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession();

  return (
    <div className="flex min-h-screen bg-[#171717]">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-white/10 lg:flex">
        <div className="border-b border-white/10 px-6 py-6">
          <span className="font-heading text-xl tracking-widest text-ivory">FLINT</span>
          <span className="ml-2 text-xs text-copper">Atelier</span>
        </div>

        <nav className="flex-1 px-3 py-6">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white"
            >
              <span className="text-xs text-copper/70">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/10 px-6 py-5">
          <p className="text-xs text-white/40">{session.name}</p>
          <p className="mt-0.5 text-xs capitalize text-white/25">{session.role.replace(/_/g, " ")}</p>
          <form action={logoutAction} className="mt-3">
            <button type="submit" className="text-xs text-copper/60 hover:text-copper transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 border-b border-white/10 bg-[#171717] px-6 py-4 flex items-center justify-between">
        <span className="font-heading text-lg text-ivory">FLINT Admin</span>
        <div className="flex gap-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs text-white/50 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto px-6 py-8 lg:py-10 lg:px-10 mt-14 lg:mt-0">
        {children}
      </main>
    </div>
  );
}
