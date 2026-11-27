export const instant = false;

import Link from "next/link";
import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { roleLabel } from "@/lib/auth/role-label";
import { formatDate } from "@/lib/utils";
import { listStaffUsers } from "@/features/access/users";

type Props = { searchParams: Promise<{ q?: string }> };

function formatWhen(value: string | null) {
  if (!value) return "Never";
  return formatDate(value);
}

export default async function AdminUsersPage({ searchParams }: Props) {
  await requireAdminSession("users.manage");
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  await connection();
  const users = await listStaffUsers(q);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-copper/70">Settings</p>
          <h1 className="mt-1 font-heading text-4xl text-[#171717]">Users</h1>
          <p className="mt-1 text-sm text-[#171717]/50">{users.length} staff accounts</p>
        </div>
        <Link
          href="/admin/users/new"
          className="border border-[#171717] bg-[#171717] px-4 py-2 text-sm text-ivory transition-colors hover:bg-[#171717]/90"
        >
          New user
        </Link>
      </div>

      <form method="GET" className="mt-6 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name or email"
          className="w-full border border-[#171717]/20 bg-white px-3 py-2 text-sm text-[#171717] placeholder:text-[#171717]/30 focus:border-copper focus:outline-none sm:w-72"
        />
        <button
          type="submit"
          className="border border-[#171717]/20 px-4 py-2 text-sm text-[#171717]/60 transition-colors hover:border-copper hover:text-copper"
        >
          Search
        </button>
        {q ? (
          <Link href="/admin/users" className="px-4 py-2 text-sm text-[#171717]/40 hover:text-[#171717]">
            Clear
          </Link>
        ) : null}
      </form>

      <div className="mt-5 overflow-x-auto border border-[#171717]/10 bg-white">
        {users.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#171717]/45">
            {q ? "No staff users match this search." : "No staff users yet."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#171717]/10">
                <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#171717]/40">Name</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#171717]/40">Email</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#171717]/40">Role</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#171717]/40">Status</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#171717]/40">Last login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171717]/5">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${user.id}`} className="text-[#171717] hover:text-copper">
                      {user.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#171717]/70">{user.email}</td>
                  <td className="px-4 py-3 text-[#171717]/70">{roleLabel(user.role)}</td>
                  <td className="px-4 py-3">
                    <span className={user.isActive ? "bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800" : "bg-[#171717]/5 px-2 py-0.5 text-xs text-[#171717]/60"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#171717]/60">{formatWhen(user.lastLoginAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
