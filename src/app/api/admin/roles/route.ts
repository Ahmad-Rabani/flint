import { requireAdminApi } from "@/lib/auth/admin";
import { jsonOk, handleRouteError } from "@/lib/api";
import { ensureStaffRoles } from "@/lib/auth/roles";

export async function GET() {
  try {
    await requireAdminApi("roles.manage");
    const roles = await ensureStaffRoles();
    return jsonOk({ roles });
  } catch (error) {
    return handleRouteError(error);
  }
}
