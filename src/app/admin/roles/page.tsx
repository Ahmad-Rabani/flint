export const instant = false;

import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { ensureStaffRoles } from "@/lib/auth/roles";
import { RolesEditor } from "./roles-editor";

export default async function AdminRolesPage() {
  await requireAdminSession("roles.manage");
  await connection();
  const roles = await ensureStaffRoles();

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-copper/70">Settings</p>
      <h1 className="mt-1 font-heading text-4xl text-[#1B365D]">Roles & Permissions</h1>
      <p className="mt-2 max-w-2xl text-sm text-[#1B365D]/55">
        Saving a role replaces its permissions and overwrites the permission list on every staff user with that role, including accounts that had a custom set. Users pick up the change the next time they sign in.
      </p>
      <RolesEditor
        roles={roles.map((role) => ({
          key: role.key,
          name: role.name,
          description: role.description,
          permissions: [...role.permissions],
        }))}
      />
    </div>
  );
}
