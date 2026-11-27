import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, clearSessionCookie } from "@/lib/auth/session";

// Account pages are user-specific and require blocking IO
export const instant = false;

const links = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/custom-orders", label: "Custom orders" },
];

async function logoutAction() {
  "use server";
  await clearSessionCookie();
  redirect("/");
}

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/account");

  return (
    <div className="bg-background">
      <div className="border-b border-border/70 bg-ivory">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
          <p className="text-xs uppercase tracking-[0.25em] text-copper">Account</p>
          <h1 className="mt-2 font-heading text-4xl text-ink">
            Hello, {session.name.split(" ")[0]}
          </h1>
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[220px_1fr] lg:px-10">
        <nav className="space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
          <form action={logoutAction} className="pt-4">
            <button type="submit" className="px-3 py-2 text-sm text-copper hover:underline">
              Sign out
            </button>
          </form>
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
