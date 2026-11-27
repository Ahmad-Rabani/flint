export const instant = false;

import Link from "next/link";
import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Customer } from "@/models/Customer";
import { formatCurrency, formatDate } from "@/lib/utils";

type Props = { searchParams: Promise<{ q?: string; page?: string }> };

export default async function AdminCustomersPage({ searchParams }: Props) {
  await requireAdminSession("customers.view");
  const sp = await searchParams;
  const q = sp.q ?? "";
  const page = Number(sp.page ?? "1");
  const pageSize = 30;

  await connection();
  await connectToDatabase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = { deletedAt: null };
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ];
  }

  const skip = (page - 1) * pageSize;
  const [docs, total] = await Promise.all([
    Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
    Customer.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  const items = docs.map((c) => ({
    id: String(c._id),
    name: c.name,
    email: c.email,
    phone: c.phone ?? null,
    orderCount: c.orderCount ?? 0,
    totalSpent: c.totalSpent ?? 0,
    createdAt: c.createdAt ? new Date(String(c.createdAt)).toISOString() : "",
  }));

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-copper/70">Customers</p>
          <h1 className="mt-1 font-heading text-4xl text-[#171717]">Directory</h1>
          <p className="mt-1 text-sm text-[#171717]/50">{total} customers</p>
        </div>
      </div>

      <form method="GET" className="mt-6 flex gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or email…"
          className="border border-[#171717]/20 bg-white px-3 py-2 text-sm text-[#171717] placeholder:text-[#171717]/30 focus:border-copper focus:outline-none w-72"
        />
        <button type="submit" className="border border-[#171717]/20 px-4 py-2 text-sm text-[#171717]/60 hover:border-copper hover:text-copper transition-colors">
          Search
        </button>
        {q && <Link href="/admin/customers" className="px-4 py-2 text-sm text-[#171717]/40 hover:text-[#171717] transition-colors">Clear</Link>}
      </form>

      <div className="mt-5 border border-[#171717]/10 bg-white overflow-x-auto">
        {items.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#171717]/30">
            {q ? "No customers match your search." : "No customers yet."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#171717]/10">
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Customer</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Orders</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs uppercase tracking-widest font-normal text-[#171717]/40">Total Spent</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Joined</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs uppercase tracking-widest font-normal text-[#171717]/40" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171717]/5">
              {items.map((c) => (
                <tr key={c.id} className="hover:bg-[#171717]/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#171717]">{c.name}</p>
                    <p className="text-xs text-[#171717]/50">{c.email}</p>
                    {c.phone && <p className="text-xs text-[#171717]/40">{c.phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-[#171717]/60">{c.orderCount}</td>
                  <td className="px-4 py-3 text-right text-[#171717] font-medium">{formatCurrency(c.totalSpent)}</td>
                  <td className="px-4 py-3 text-xs text-[#171717]/40">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/customers/${c.id}`} className="text-xs text-copper/60 hover:text-copper transition-colors">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-5 flex gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/customers?${new URLSearchParams({ ...(q && { q }), page: String(p) })}`}
              className={`border px-3 py-1.5 text-sm transition-colors ${p === page ? "border-[#171717] bg-[#171717] text-ivory" : "border-[#171717]/20 text-[#171717]/60 hover:border-copper hover:text-copper"}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
