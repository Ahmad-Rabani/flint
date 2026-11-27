export const instant = false;

import Link from "next/link";
import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { listAuditLogs } from "@/features/audit/queries";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ q?: string; action?: string; entityType?: string; page?: string }>;
};

function formatWhen(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function hrefFor(
  filters: { q: string; action: string; entityType: string },
  page: number,
) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.action) params.set("action", filters.action);
  if (filters.entityType) params.set("entityType", filters.entityType);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin/audit?${qs}` : "/admin/audit";
}

export default async function AdminAuditPage({ searchParams }: Props) {
  await requireAdminSession("audit.view");
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const action = sp.action?.trim() ?? "";
  const entityType = sp.entityType?.trim() ?? "";
  const page = Number(sp.page ?? "1");
  await connection();
  const result = await listAuditLogs({
    q,
    action,
    entityType,
    page: Number.isFinite(page) ? page : 1,
  });
  const filters = { q, action, entityType };
  const actions = action && !result.actions.includes(action) ? [action, ...result.actions] : result.actions;
  const entityTypes =
    entityType && !result.entityTypes.includes(entityType) ? [entityType, ...result.entityTypes] : result.entityTypes;
  const selectCls =
    "border border-[#1B365D]/20 bg-white px-3 py-2 text-sm text-[#1B365D] focus:border-copper focus:outline-none";

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-copper/70">Settings</p>
      <h1 className="mt-1 font-heading text-4xl text-[#1B365D]">Audit Log</h1>
      <p className="mt-1 text-sm text-[#1B365D]/50">{result.total} events</p>

      <form method="GET" className="mt-6 flex flex-wrap items-end gap-3">
        <label className="text-sm text-[#1B365D]">
          <span className="mb-1.5 block text-xs uppercase tracking-widest text-[#1B365D]/50">Search</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Actor email or summary"
            className="w-64 border border-[#1B365D]/20 bg-white px-3 py-2 text-sm text-[#1B365D] placeholder:text-[#1B365D]/30 focus:border-copper focus:outline-none"
          />
        </label>
        <label className="text-sm text-[#1B365D]">
          <span className="mb-1.5 block text-xs uppercase tracking-widest text-[#1B365D]/50">Action</span>
          <select name="action" defaultValue={action} className={selectCls}>
            <option value="">All actions</option>
            {actions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-[#1B365D]">
          <span className="mb-1.5 block text-xs uppercase tracking-widest text-[#1B365D]/50">Entity</span>
          <select name="entityType" defaultValue={entityType} className={selectCls}>
            <option value="">All entities</option>
            {entityTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="border border-[#1B365D]/20 px-4 py-2 text-sm text-[#1B365D]/70 transition-colors hover:border-copper hover:text-copper"
        >
          Filter
        </button>
        {(q || action || entityType) && (
          <Link href="/admin/audit" className="px-4 py-2 text-sm text-[#1B365D]/40 hover:text-[#1B365D]">
            Clear
          </Link>
        )}
      </form>

      <div className="mt-5 overflow-x-auto border border-[#1B365D]/10 bg-white">
        {result.items.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#1B365D]/45">
            {q || action || entityType ? "No audit events match these filters." : "No audit events yet."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1B365D]/10">
                <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">When</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">Actor</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">Action</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">Entity</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1B365D]/5">
              {result.items.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-[#1B365D]/70">{formatWhen(row.createdAt)}</td>
                  <td className="px-4 py-3 text-[#1B365D]">{row.actorEmail}</td>
                  <td className="px-4 py-3 text-[#1B365D]/80">{row.action}</td>
                  <td className="px-4 py-3 text-[#1B365D]/70" title={row.entityId || undefined}>
                    {row.entityType}
                    {row.entityId ? <span className="mt-0.5 block text-xs text-[#1B365D]/40">{row.entityId}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-[#1B365D]/80">{row.summary || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {result.totalPages > 1 ? (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {result.page > 1 ? (
            <Link href={hrefFor(filters, result.page - 1)} className="border border-[#1B365D]/20 px-3 py-1.5 text-sm text-[#1B365D]/70">
              Previous
            </Link>
          ) : null}
          {Array.from({ length: result.totalPages }, (_, index) => index + 1)
            .filter((item) => Math.abs(item - result.page) <= 2 || item === 1 || item === result.totalPages)
            .map((item, index, items) => {
              const prev = items[index - 1];
              return (
                <span key={item} className="flex items-center gap-2">
                  {prev && item - prev > 1 ? <span className="text-sm text-[#1B365D]/30">…</span> : null}
                  <Link
                    href={hrefFor(filters, item)}
                    className={cn(
                      "border px-3 py-1.5 text-sm",
                      item === result.page
                        ? "border-[#1B365D] bg-[#1B365D] text-ivory"
                        : "border-[#1B365D]/20 text-[#1B365D]/70",
                    )}
                  >
                    {item}
                  </Link>
                </span>
              );
            })}
          {result.page < result.totalPages ? (
            <Link href={hrefFor(filters, result.page + 1)} className="border border-[#1B365D]/20 px-3 py-1.5 text-sm text-[#1B365D]/70">
              Next
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
