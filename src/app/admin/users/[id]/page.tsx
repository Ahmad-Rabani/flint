export const instant = false;

import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { ensureStaffRoles } from "@/lib/auth/roles";
import { roleLabel } from "@/lib/auth/role-label";
import { getStaffUser } from "@/features/access/users";
import { UserForm } from "../user-form";

type Props = { params: Promise<{ id: string }> };

export default async function EditStaffUserPage({ params }: Props) {
  const session = await requireAdminSession("users.manage");
  const { id } = await params;
  await connection();
  const [user, roles] = await Promise.all([getStaffUser(id), ensureStaffRoles()]);
  if (!user) notFound();

  const canManageSuperAdmin = session.role === "super_admin";
  const locked = user.role === "super_admin" && !canManageSuperAdmin;

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-copper/70">Settings</p>
      <h1 className="mt-1 font-heading text-4xl text-[#1B365D]">{user.name}</h1>
      <p className="mt-2 text-sm text-[#1B365D]/50">
        <Link href="/admin/users" className="underline decoration-[#1B365D]/25 underline-offset-4 hover:text-copper">
          Back to users
        </Link>
      </p>
      {locked ? (
        <div className="mt-8 max-w-xl border border-[#1B365D]/10 bg-white p-5 text-sm text-[#1B365D]/70">
          <p>{user.email}</p>
          <p className="mt-1">{roleLabel(user.role)}</p>
          <p className="mt-4 text-[#1B365D]">Only a super admin can edit this account.</p>
        </div>
      ) : (
        <UserForm
          mode="edit"
          roles={roles.map((role) => ({ key: role.key, name: role.name, permissions: [...role.permissions] }))}
          user={user}
          isSelf={session.id === user.id}
          canManageSuperAdmin={canManageSuperAdmin}
        />
      )}
    </div>
  );
}
