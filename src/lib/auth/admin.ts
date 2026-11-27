import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import type { Permission } from "@/constants";
import type { SessionUser } from "@/types";

/** Require a staff session for Server Components / pages. Redirects on failure. */
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

/** Require a staff session for Route Handlers. Throws UNAUTHORIZED / FORBIDDEN (JSON-friendly). */
export async function requireAdminApi(permission?: Permission): Promise<SessionUser> {
  const session = await getSession();

  if (!session || session.role === "customer") {
    throw new Error("UNAUTHORIZED");
  }

  if (permission && !hasPermission(session, permission)) {
    throw new Error("FORBIDDEN");
  }

  return session;
}
