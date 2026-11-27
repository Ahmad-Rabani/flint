import "server-only";

import { ROLE_PERMISSIONS, type Permission, type UserRole } from "@/constants";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { sanitizePermissions } from "@/lib/permissions";
import { roleLabel } from "@/lib/auth/role-label";
import { Role } from "@/models/Role";

export const STAFF_ROLE_KEYS = [
  "super_admin",
  "admin",
  "manager",
  "cashier",
  "catalog_manager",
  "order_manager",
] as const satisfies readonly Exclude<UserRole, "customer">[];

export type StaffRoleKey = (typeof STAFF_ROLE_KEYS)[number];

const ROLE_COPY: Record<StaffRoleKey, string> = {
  super_admin: "Full access to every atelier function.",
  admin: "Operational access without changing role definitions.",
  manager: "Catalogue, orders, inventory, and day-to-day reports.",
  cashier: "Point of sale, customers, and a read-only catalogue.",
  catalog_manager: "Products, content, and merchandising.",
  order_manager: "Orders, custom work, and customer care.",
};

export type StaffRoleDto = {
  key: StaffRoleKey;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
};

export function isStaffRoleKey(value: string): value is StaffRoleKey {
  return (STAFF_ROLE_KEYS as readonly string[]).includes(value);
}

export { roleLabel };

/** Insert any staff roles that are missing so the permissions screen is never empty. */
export async function ensureStaffRoles(): Promise<StaffRoleDto[]> {
  await connectToDatabase();
  const existing = await Role.find({ key: { $in: [...STAFF_ROLE_KEYS] } })
    .select("key")
    .lean();
  const have = new Set(existing.map((doc: { key?: string }) => String(doc.key)));
  const missing = STAFF_ROLE_KEYS.filter((key) => !have.has(key));

  if (missing.length > 0) {
    await Role.insertMany(
      missing.map((key) => ({
        key,
        name: roleLabel(key),
        description: ROLE_COPY[key],
        permissions: ROLE_PERMISSIONS[key],
        isSystem: true,
      })),
    );
  }

  const docs = await Role.find({ key: { $in: [...STAFF_ROLE_KEYS] }, deletedAt: null }).lean();
  const order = new Map(STAFF_ROLE_KEYS.map((key, index) => [key, index]));
  docs.sort(
    (a: { key?: string }, b: { key?: string }) =>
      (order.get(String(a.key) as StaffRoleKey) ?? 99) - (order.get(String(b.key) as StaffRoleKey) ?? 99),
  );

  return docs
    .filter((doc: { key?: string }) => isStaffRoleKey(String(doc.key)))
    .map((doc: { key: string; name?: string; description?: string; permissions?: string[]; isSystem?: boolean }) => ({
      key: doc.key as StaffRoleKey,
      name: doc.name || roleLabel(doc.key),
      description: doc.description ?? "",
      permissions: sanitizePermissions(doc.permissions),
      isSystem: doc.isSystem !== false,
    }));
}
