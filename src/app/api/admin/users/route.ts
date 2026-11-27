import { NextRequest } from "next/server";
import type { Permission } from "@/constants";
import { requireAdminApi } from "@/lib/auth/admin";
import { writeAuditLog } from "@/lib/auth/audit";
import { hashPassword } from "@/lib/auth/password";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { hasPermission, loadRolePermissions, sanitizePermissions } from "@/lib/permissions";
import { jsonCreated, jsonOk, handleRouteError } from "@/lib/api";
import { createStaffSchema } from "@/lib/validation/staff";
import { listStaffUsers } from "@/features/access/users";
import { User } from "@/models/User";
import type { SessionUser } from "@/types";

function duplicateEmail(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: number }).code === 11000);
}

function assertCanGrant(session: SessionUser, permissions: Permission[]) {
  if (session.role === "super_admin") return;
  if (permissions.some((permission) => !hasPermission(session, permission))) {
    throw new Error("You cannot grant permissions you do not have");
  }
}

function assertCanManageRole(session: SessionUser, role: string) {
  if (session.role === "super_admin") return;
  if (role === "super_admin") {
    throw new Error("Only a super admin can create or edit super admin accounts");
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireAdminApi("users.manage");
    const q = req.nextUrl.searchParams.get("q") ?? undefined;
    const users = await listStaffUsers(q);
    return jsonOk({ users });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminApi("users.manage");
    const data = createStaffSchema.parse(await req.json());
    assertCanManageRole(session, data.role);
    await connectToDatabase();

    const custom = data.customPermissions === true;
    const permissions = custom
      ? sanitizePermissions(data.permissions ?? [])
      : await loadRolePermissions(data.role);
    if (custom && permissions.length === 0) {
      throw new Error("Choose at least one permission, or turn off custom permissions to use the role default");
    }
    assertCanGrant(session, permissions);

    let user;
    try {
      user = await User.create({
        name: data.name.trim(),
        email: data.email.toLowerCase(),
        passwordHash: await hashPassword(data.password),
        role: data.role,
        permissions,
        isActive: data.isActive !== false,
      });
    } catch (error) {
      if (duplicateEmail(error)) throw new Error("A user with that email already exists");
      throw error;
    }

    await writeAuditLog({
      actor: session,
      action: "users.create",
      entityType: "User",
      entityId: String(user._id),
      summary: `Created staff user ${user.email} (${user.role})`,
      changes: { role: user.role, isActive: user.isActive, customPermissions: custom },
    });

    return jsonCreated({
      id: String(user._id),
      permissions: sanitizePermissions(user.permissions),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
