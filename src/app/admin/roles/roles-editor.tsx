"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PermissionPicker } from "../_components/permission-picker";

type RoleDraft = {
  key: string;
  name: string;
  description: string;
  permissions: string[];
};

export function RolesEditor({ roles }: { roles: RoleDraft[] }) {
  const router = useRouter();
  const [drafts, setDrafts] = useState(roles);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function update(key: string, patch: Partial<RoleDraft>) {
    setDrafts((current) => current.map((role) => (role.key === key ? { ...role, ...patch } : role)));
  }

  function save(role: RoleDraft) {
    if (role.key === "super_admin" && role.permissions.length === 0) {
      toast.error("The super admin role cannot have empty permissions");
      return;
    }
    setPendingKey(role.key);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/roles/${role.key}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            permissions: role.permissions,
            description: role.description,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Save failed");
        toast.success(`Saved ${role.name}. Updated ${data.usersUpdated ?? 0} users.`);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Save failed");
      } finally {
        setPendingKey(null);
      }
    });
  }

  return (
    <div className="mt-8 space-y-8">
      {drafts.map((role) => (
        <section key={role.key} className="border border-[#171717]/10 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-2xl text-[#171717]">{role.name}</h2>
              <p className="mt-1 text-xs uppercase tracking-widest text-[#171717]/35">{role.key}</p>
            </div>
            <button
              type="button"
              onClick={() => save(role)}
              disabled={pendingKey === role.key}
              className="border border-[#171717] bg-[#171717] px-4 py-2 text-sm text-ivory transition-colors hover:bg-[#171717]/90 disabled:opacity-60"
            >
              {pendingKey === role.key ? "Saving…" : "Save role"}
            </button>
          </div>
          <label className="mt-4 block text-xs uppercase tracking-widest text-[#171717]/50">
            Description
            <input
              value={role.description}
              onChange={(event) => update(role.key, { description: event.target.value })}
              className="mt-1.5 w-full border border-[#171717]/20 bg-white px-3 py-2 text-sm normal-case tracking-normal text-[#171717] focus:border-copper focus:outline-none"
            />
          </label>
          <div className="mt-4">
            <PermissionPicker
              selected={role.permissions}
              onChange={(permissions) => update(role.key, { permissions })}
            />
          </div>
        </section>
      ))}
    </div>
  );
}
