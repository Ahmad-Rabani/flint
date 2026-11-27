import type { Permission, SessionUser, UserRole } from "@/types";
import { ROLE_PERMISSIONS } from "@/constants";

export function permissionsForRole(role: UserRole): Permission[] {
  if (role === "customer") return [];
  return ROLE_PERMISSIONS[role] ?? [];
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
