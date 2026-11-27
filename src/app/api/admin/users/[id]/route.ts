import { NextRequest } from "next/server";
import type { Permission } from "@/constants";
import { requireAdminApi } from "@/lib/auth/admin";
import { writeAuditLog } from "@/lib/auth/audit";
import { hashPassword } from "@/lib/auth/password";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { hasPermission, loadRolePermissions, sanitizePermissions } from "@/lib/permissions";
import { jsonError, jsonOk, handleRouteError } from "@/lib/api";
import { updateStaffSchema } from "@/lib/validation/staff";
import { getStaffUser } from "@/features/access/users";
import { User } from "@/models/User";
import type { SessionUser } from "@/types";

type Params = { params: Promise<{ id: string }> };

function assertCanGrant(session: SessionUser, permissions: Permission[]) {
  if (session.role === "super_admin") return;
  if (permissions.some((permission) => !hasPermission(session, permission))) {
    throw new Error("You cannot grant permissions you do not have");
  }
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireAdminApi("users.manage");
    const { id } = await params;
    const user = await getStaffUser(id);
    if (!user) return jsonError("Not found", 404);
    return jsonOk({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminApi("users.manage");
    const { id } = await params;
    if (!/^[a-f\d]{24}$/i.test(id)) return jsonError("Not found", 404);
    const data = updateStaffSchema.parse(await req.json());
    await connectToDatabase();

    const user = await User.findOne({ _id: id, role: { $ne: "customer" }, deletedAt: null });
    if (!user) return jsonError("Not found", 404);

    const isSelf = String(user._id) === session.id;
    const nextRole = data.role ?? user.role;

    if (session.role !== "super_admin" && (user.role === "super_admin" || nextRole === "super_admin")) {
      throw new Error("Only a super admin can edit super admin accounts");
    }

    if (isSelf) {
      if (data.deletedAt) throw new Error("You cannot remove your own account");
      if (data.isActive === false) throw new Error("You cannot deactivate your own account");
      if (data.role && data.role !== user.role) throw new Error("You cannot change your own role");
      if (data.customPermissions !== undefined || (data.permissions && data.permissions.length > 0)) {
        throw new Error("You cannot change your own permissions");
      }
    }

    if (data.deletedAt) {
      user.deletedAt = new Date();
      user.isActive = false;
      await user.save();
      await writeAuditLog({
        actor: session,
        action: "users.delete",
        entityType: "User",
        entityId: id,
        summary: `Removed staff user ${user.email}`,
      });
      return jsonOk({ id });
    }

    const before = {
      name: user.name,
      role: user.role,
      isActive: user.isActive !== false,
    };

    if (data.name) user.name = data.name.trim();
    if (typeof data.isActive === "boolean") user.isActive = data.isActive;

    if (!isSelf && (data.customPermissions !== undefined || (data.role && data.role !== user.role))) {
      const custom = data.customPermissions === true;
      const permissions = custom
        ? sanitizePermissions(data.permissions ?? [])
        : await loadRolePermissions(nextRole);
      if (custom && permissions.length === 0) {
        throw new Error("Choose at least one permission, or turn off custom permissions to use the role default");
      }
      assertCanGrant(session, permissions);
      user.permissions = permissions;
      user.markModified("permissions");
      if (data.role) user.role = data.role;
    }

    let passwordReset = false;
    if (data.password) {
      user.passwordHash = await hashPassword(data.password);
      passwordReset = true;
    }

    await user.save();
    await writeAuditLog({
      actor: session,
      action: user.isActive === false && before.isActive ? "users.deactivate" : "users.update",
      entityType: "User",
      entityId: id,
      summary: `Updated staff user ${user.email}`,
      changes: {
        before,
        after: { name: user.name, role: user.role, isActive: user.isActive !== false },
        passwordReset,
      },
    });

    return jsonOk({ id, permissions: sanitizePermissions(user.permissions) });
  } catch (error) {
    return handleRouteError(error);
  }
}
