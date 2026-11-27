import { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { writeAuditLog } from "@/lib/auth/audit";
import { isStaffRoleKey } from "@/lib/auth/roles";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { sanitizePermissions } from "@/lib/permissions";
import { jsonError, jsonOk, handleRouteError } from "@/lib/api";
import { updateRoleSchema } from "@/lib/validation/staff";
import { Role } from "@/models/Role";
import { User } from "@/models/User";

type Params = { params: Promise<{ key: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminApi("roles.manage");
    const { key } = await params;
    if (!isStaffRoleKey(key)) return jsonError("Unknown role", 404);
    const data = updateRoleSchema.parse(await req.json());
    const permissions = sanitizePermissions(data.permissions);
    if (key === "super_admin" && permissions.length === 0) {
      throw new Error("The super admin role cannot have empty permissions");
    }

    await connectToDatabase();
    const role = await Role.findOne({ key, deletedAt: null });
    if (!role) return jsonError("Role not found", 404);

    role.permissions = permissions;
    role.markModified("permissions");
    if (data.description !== undefined) role.description = data.description;
    await role.save();

    const updatedUsers = await User.updateMany(
      { role: key, deletedAt: null },
      { $set: { permissions } },
    );

    await writeAuditLog({
      actor: session,
      action: "roles.update",
      entityType: "Role",
      entityId: key,
      summary: `Updated ${role.name} permissions and applied them to ${updatedUsers.modifiedCount} users`,
      changes: { permissions, description: role.description ?? "" },
    });

    return jsonOk({
      key,
      permissions,
      usersUpdated: updatedUsers.modifiedCount,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
