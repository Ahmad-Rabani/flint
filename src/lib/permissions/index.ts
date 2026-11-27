import type { Permission, SessionUser, UserRole } from "@/types";
import { PERMISSIONS, ROLE_PERMISSIONS } from "@/constants";

const PERMISSION_SET = new Set<string>(PERMISSIONS);

export function sanitizePermissions(values: readonly string[] | null | undefined): Permission[] {
  if (!values?.length) return [];
  const seen = new Set<string>();
  const out: Permission[] = [];
  for (const value of values) {
    const key = String(value);
    if (!PERMISSION_SET.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(key as Permission);
  }
  return out;
}

export function permissionsForRole(role: UserRole): Permission[] {
  if (role === "customer") return [];
  return ROLE_PERMISSIONS[role] ?? [];
}

async function findRolePermissions(role: UserRole): Promise<Permission[] | null> {
  if (role === "customer") return [];
  const { connectToDatabase } = await import("@/lib/mongodb/connection");
  const { Role } = await import("@/models/Role");
  await connectToDatabase();
  const doc = await Role.findOne({ key: role, deletedAt: null }).select("permissions").lean();
  if (!doc) return null;
  return sanitizePermissions(doc.permissions as string[] | undefined);
}

/** Permissions stored on the Role document, or the constant map when that role has not been seeded. */
export async function loadRolePermissions(role: UserRole): Promise<Permission[]> {
  const stored = await findRolePermissions(role);
  if (stored !== null) return stored;
  return permissionsForRole(role);
}

/**
 * 1. Non-empty user.permissions
 * 2. Role document for user.role (including an intentional empty list)
 * 3. Constant ROLE_PERMISSIONS fallback
 */
export async function resolvePermissionsForUser(user: {
  role: UserRole;
  permissions?: readonly string[] | null;
}): Promise<Permission[]> {
  const stored = sanitizePermissions(user.permissions);
  if (stored.length > 0) return stored;
  const fromRole = await findRolePermissions(user.role);
  if (fromRole !== null) return fromRole;
  return permissionsForRole(user.role);
}

export function hasPermission(user: SessionUser | null | undefined, permission: Permission): boolean {
  if (!user) return false;
  if (user.role === "super_admin") return true;
  return user.permissions.includes(permission);
}

export function hasAnyPermission(
  user: SessionUser | null | undefined,
  permissions: Permission[],
): boolean {
  return permissions.some((permission) => hasPermission(user, permission));
}

export function requirePermission(user: SessionUser, permission: Permission) {
  if (!hasPermission(user, permission)) {
    throw new Error("FORBIDDEN");
  }
}

export function isStaffRole(role: UserRole) {
  return role !== "customer";
}
