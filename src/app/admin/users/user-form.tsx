"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { samePermissions } from "@/features/access/permission-groups";
import { roleLabel } from "@/lib/auth/role-label";
import { PermissionPicker } from "../_components/permission-picker";

export type RoleOption = {
  key: string;
  name: string;
  permissions: string[];
};

export type StaffFormUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  permissions: string[];
};

const inputCls =
  "w-full border border-[#1B365D]/20 bg-white px-3 py-2 text-sm text-[#1B365D] placeholder:text-[#1B365D]/30 focus:border-copper focus:outline-none disabled:bg-[#1B365D]/5";
const labelCls = "mb-1.5 block text-xs uppercase tracking-widest text-[#1B365D]/50";

export function UserForm({
  mode,
  roles,
  user,
  isSelf,
  canManageSuperAdmin,
}: {
  mode: "create" | "edit";
  roles: RoleOption[];
  user?: StaffFormUser;
  isSelf: boolean;
  canManageSuperAdmin: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const options = roles.filter((role) => canManageSuperAdmin || role.key !== "super_admin");
  const startingRole =
    user?.role && options.some((role) => role.key === user.role)
      ? user.role
      : (options.find((role) => role.key === "cashier")?.key ?? options[0]?.key ?? "");

  const defaultsFor = (roleKey: string) => options.find((role) => role.key === roleKey)?.permissions ?? [];
  const initialCustom = Boolean(
    user && user.permissions.length > 0 && !samePermissions(user.permissions, defaultsFor(user.role)),
  );

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(startingRole);
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [custom, setCustom] = useState(initialCustom);
  const [selected, setSelected] = useState<string[]>(initialCustom ? (user?.permissions ?? []) : defaultsFor(startingRole));

  const roleName = useMemo(() => options.find((item) => item.key === role)?.name ?? roleLabel(role), [options, role]);

  function chooseRole(next: string) {
    setRole(next);
    if (!custom) setSelected(defaultsFor(next));
  }

  function toggleCustom(enabled: boolean) {
    setCustom(enabled);
    if (!enabled) setSelected(defaultsFor(role));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      toast.error("Enter a name");
      return;
    }
    if (mode === "create" && password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password && password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (!isSelf && custom && selected.length === 0) {
      toast.error("Choose at least one permission, or use the role default");
      return;
    }

    const payload: Record<string, unknown> = isSelf
      ? { name: name.trim(), ...(password ? { password } : {}) }
      : {
          name: name.trim(),
          role,
          isActive,
          customPermissions: custom,
          ...(custom ? { permissions: selected } : {}),
          ...(password ? { password } : {}),
        };
    if (mode === "create") {
      payload.email = email.trim().toLowerCase();
      payload.password = password;
    }

    startTransition(async () => {
      try {
        const res = await fetch(mode === "create" ? "/api/admin/users" : `/api/admin/users/${user?.id}`, {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Save failed");
        toast.success(mode === "create" ? "User created" : "User saved");
        if (mode === "create") router.push("/admin/users");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Save failed");
      }
    });
  }

  function removeUser() {
    if (!user || isSelf) return;
    if (!window.confirm(`Remove ${user.email}? They will lose access. The record stays for the audit log.`)) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deletedAt: true }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not remove user");
        toast.success("User removed");
        router.push("/admin/users");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not remove user");
      }
    });
  }

  if (options.length === 0) {
    return <p className="mt-6 text-sm text-[#1B365D]/55">No roles are available for you to assign.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-4xl space-y-6">
      <div className="border border-[#1B365D]/10 bg-white p-5">
        <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-[#1B365D]/40">Account</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="staff-name">Name</label>
            <input id="staff-name" className={inputCls} value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="staff-email">Email</label>
            <input
              id="staff-email"
              type="email"
              required
              disabled={mode === "edit"}
              className={inputCls}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="staff-password">
              {mode === "create" ? "Password" : "New password"}
            </label>
            <input
              id="staff-password"
              type="password"
              autoComplete="new-password"
              placeholder={mode === "edit" ? "Leave blank to keep the current password" : ""}
              className={inputCls}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="staff-role">Role</label>
            <select
              id="staff-role"
              className={inputCls}
              value={role}
              disabled={isSelf}
              onChange={(event) => chooseRole(event.target.value)}
            >
              {options.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.name || roleLabel(option.key)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm text-[#1B365D]">
          <input
            type="checkbox"
            className="accent-[#1B365D]"
            checked={isActive}
            disabled={isSelf}
            onChange={(event) => setIsActive(event.target.checked)}
          />
          Active — inactive users cannot sign in
        </label>
        {isSelf ? (
          <p className="mt-3 text-sm text-[#1B365D]/50">
            You can update your name and password here. Another super admin has to change your role or access.
          </p>
        ) : null}
      </div>

      <div className="border border-[#1B365D]/10 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xs uppercase tracking-[0.2em] text-[#1B365D]/40">Permissions</h2>
            <p className="mt-2 max-w-xl text-sm text-[#1B365D]/55">
              {custom
                ? "This exact set is stored on the user."
                : `${roleName} permissions will be copied onto the user.`}
              {" "}
              Saving the role later overwrites every user on that role, including custom sets.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-[#1B365D]">
            <input
              type="checkbox"
              className="accent-[#1B365D]"
              checked={custom}
              disabled={isSelf}
              onChange={(event) => toggleCustom(event.target.checked)}
            />
            Custom permissions
          </label>
        </div>
        <PermissionPicker selected={selected} disabled={isSelf || !custom} onChange={setSelected} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="border border-[#1B365D] bg-[#1B365D] px-5 py-2.5 text-sm text-ivory transition-colors hover:bg-[#1B365D]/90 disabled:opacity-60"
        >
          {isPending ? "Saving…" : mode === "create" ? "Create user" : "Save user"}
        </button>
        {mode === "edit" && !isSelf ? (
          <button
            type="button"
            onClick={removeUser}
            disabled={isPending}
            className="border border-red-200 px-5 py-2.5 text-sm text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60"
          >
            Remove user
          </button>
        ) : null}
      </div>
    </form>
  );
}
