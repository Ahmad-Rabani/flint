import { PERMISSIONS, type Permission } from "@/constants";

const GROUP_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  products: "Products",
  categories: "Categories",
  collections: "Collections",
  customization: "Customization",
  reviews: "Reviews",
  orders: "Orders",
  custom_orders: "Custom orders",
  quotations: "Quotations",
  returns: "Returns",
  inventory: "Inventory",
  pos: "Point of sale",
  customers: "Customers",
  cms: "Content",
  marketing: "Marketing",
  reports: "Reports",
  settings: "Settings",
  users: "Users",
  roles: "Roles",
  audit: "Audit",
};

export type PermissionGroup = {
  key: string;
  label: string;
  permissions: Permission[];
};

export function permissionGroups(): PermissionGroup[] {
  const groups = new Map<string, Permission[]>();
  for (const permission of PERMISSIONS) {
    const key = permission.split(".")[0] ?? "other";
    const list = groups.get(key) ?? [];
    list.push(permission);
    groups.set(key, list);
  }
  return [...groups.entries()].map(([key, permissions]) => ({
    key,
    label: GROUP_LABELS[key] ?? key.replace(/_/g, " "),
    permissions,
  }));
}

export function permissionLabel(permission: string) {
  const action = permission.split(".").slice(1).join(".");
  if (!action) return permission;
  return action.replace(/_/g, " ");
}

export function samePermissions(a: readonly string[], b: readonly string[]) {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((permission) => set.has(permission));
}
