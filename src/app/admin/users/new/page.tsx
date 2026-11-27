export const instant = false;

import Link from "next/link";
import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { ensureStaffRoles } from "@/lib/auth/roles";
import { UserForm } from "../user-form";

export default async function NewStaffUserPage() {
  const session = await requireAdminSession("users.manage");
  await connection();
  const roles = await ensureStaffRoles();

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-copper/70">Settings</p>
      <h1 className="mt-1 font-heading text-4xl text-[#1B365D]">New user</h1>
      <p className="mt-2 text-sm text-[#1B365D]/50">
        <Link href="/admin/users" className="underline decoration-[#1B365D]/25 underline-offset-4 hover:text-copper">
          Back to users
        </Link>
      </p>
      <UserForm
        mode="create"
        roles={roles.map((role) => ({ key: role.key, name: role.name, permissions: role.permissions }))}
        isSelf={false}
        canManageSuperAdmin={session.role === "super_admin"}
      />
    </div>
  );
}
