export const instant = false;

import Link from "next/link";
import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { CustomizationOption } from "@/models/CustomizationOption";
import { RowDeleteAction } from "../_components/row-delete-action";

export default async function CustomizationOptionsPage() {
  await requireAdminSession("customization.manage");
  await connection();
  await connectToDatabase();
  const docs = await CustomizationOption.find({ deletedAt: null }).sort({ sortOrder: 1, name: 1 }).lean();

  const items = docs.map((d) => ({
    id: String(d._id),
    key: d.key,
    name: d.name,
    inputType: d.inputType ?? "select",
    productTypes: (d.productTypes as string[]) ?? [],
    isRequired: d.isRequired ?? false,
    isActive: d.isActive ?? true,
    sortOrder: d.sortOrder ?? 0,
    valueCount: (d.values ?? []).length,
  }));

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-copper/70">Catalogue</p>
          <h1 className="mt-1 font-heading text-4xl text-[#171717]">Customization Options</h1>
          <p className="mt-1 text-sm text-[#171717]/50">{items.length} total</p>
        </div>
        <Link href="/admin/customization-options/new" className="border border-[#171717] bg-[#171717] px-4 py-2 text-sm text-ivory hover:bg-[#171717]/90 transition-colors">
          + New Option
        </Link>
      </div>

      <div className="mt-6 border border-[#171717]/10 bg-white overflow-x-auto">
        {items.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#171717]/30">No customization options yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#171717]/10">
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Name</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Key</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Type</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Products</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Values</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Active</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs uppercase tracking-widest font-normal text-[#171717]/40" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171717]/5">
              {items.map((opt) => (
                <tr key={opt.id} className="hover:bg-[#171717]/[0.02] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#171717]">{opt.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#171717]/50">{opt.key}</td>
                  <td className="px-4 py-3 capitalize text-[#171717]/60">{opt.inputType}</td>
                  <td className="px-4 py-3 text-[#171717]/60">{opt.productTypes.join(", ") || "—"}</td>
                  <td className="px-4 py-3 text-[#171717]/60">{opt.valueCount}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${opt.isActive ? "text-green-600" : "text-[#171717]/30"}`}>
                      {opt.isActive ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right flex justify-end gap-3">
                    <Link href={`/admin/customization-options/${opt.id}`} className="text-xs text-copper/60 hover:text-copper transition-colors">Edit</Link>
                    <RowDeleteAction id={opt.id} name={opt.name} endpoint="/api/admin/customization-options" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
