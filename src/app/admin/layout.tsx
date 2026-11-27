import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/admin";
import { clearSessionCookie } from "@/lib/auth/session";
import { AdminNav } from "./_components/admin-nav";

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
    <div className="flex min-h-screen bg-[#171717]">
      <AdminNav
        permissions={session.permissions}
        isSuperAdmin={session.role === "super_admin"}
        userName={session.name}
        userRole={session.role}
        signOut={signOutAction}
      />

      {/* Content area */}
      <main className="flex-1 overflow-auto bg-[#f6f3ee] px-6 py-8 lg:py-10 lg:px-10 mt-14 lg:mt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}
