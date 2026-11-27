import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/admin";
import { clearSessionCookie } from "@/lib/auth/session";
import { Toaster } from "@/components/ui/sonner";
import { AdminNav } from "./_components/admin-nav";
import { AdminShell } from "./_components/admin-shell";

// Allow blocking IO in all admin routes — admin is staff-only, not public-facing
export const instant = false;

async function signOutAction() {
  "use server";
  await clearSessionCookie();
  redirect("/login");
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession();

  return (
    <AdminShell
      nav={
        <AdminNav
          permissions={session.permissions}
          isSuperAdmin={session.role === "super_admin"}
          userName={session.name}
          userRole={session.role}
          signOut={signOutAction}
        />
      }
      toaster={<Toaster position="bottom-right" richColors />}
    >
      {children}
    </AdminShell>
  );
}
