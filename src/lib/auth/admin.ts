import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import type { Permission } from "@/constants";
import type { SessionUser } from "@/types";

/** Require a staff session (non-customer). Redirects to /login if not logged in,
 *  or returns a 403 response object if logged in but not staff. */
export async function requireAdminSession(permission?: Permission): Promise<SessionUser> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role === "customer") {
    redirect("/login?error=forbidden");
  }

  if (permission && !hasPermission(session, permission)) {
    redirect("/admin?error=forbidden");
  }

  return session;
}
