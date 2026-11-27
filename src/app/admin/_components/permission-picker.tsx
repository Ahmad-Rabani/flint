"use client";

import { permissionGroups, permissionLabel } from "@/features/access/permission-groups";

const GROUPS = permissionGroups();

export function PermissionPicker({
  selected,
  disabled,
  onChange,
}: {
  selected: string[];
  disabled?: boolean;
  onChange: (next: string[]) => void;
}) {
  const selectedSet = new Set(selected);

  function toggle(permission: string) {
    if (disabled) return;
    const next = new Set(selectedSet);
    if (next.has(permission)) next.delete(permission);
    else next.add(permission);
    onChange([...next]);
  }

  function setGroup(permissions: string[], enabled: boolean) {
    if (disabled) return;
    const next = new Set(selectedSet);
    for (const permission of permissions) {
      if (enabled) next.add(permission);
      else next.delete(permission);
    }
    onChange([...next]);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {GROUPS.map((group) => {
        const allOn = group.permissions.every((permission) => selectedSet.has(permission));
        return (
          <fieldset key={group.key} className="border border-[#1B365D]/10 p-3" disabled={disabled}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <legend className="text-xs uppercase tracking-widest text-[#1B365D]/50">{group.label}</legend>
              <button
                type="button"
                onClick={() => setGroup(group.permissions, !allOn)}
                className="text-xs text-[#1B365D]/50 hover:text-copper disabled:opacity-40"
              >
                {allOn ? "Clear" : "All"}
              </button>
            </div>
            <div className="space-y-1.5">
              {group.permissions.map((permission) => (
                <label key={permission} className="flex items-center gap-2 text-sm text-[#1B365D]">
                  <input
                    type="checkbox"
                    className="accent-[#1B365D]"
                    checked={selectedSet.has(permission)}
                    onChange={() => toggle(permission)}
                  />
                  <span className="capitalize">{permissionLabel(permission)}</span>
                  <span className="text-xs text-[#1B365D]/35">{permission}</span>
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
