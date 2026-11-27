import { clearSessionCookie, getSession } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/auth/audit";
import { jsonOk } from "@/lib/api";

export async function POST() {
  const session = await getSession();
  await clearSessionCookie();

  if (session) {
    await writeAuditLog({
      actor: session,
      action: "auth.logout",
      entityType: "User",
      entityId: session.id,
      summary: "User signed out",
    });
  }

  return jsonOk({ success: true });
}
