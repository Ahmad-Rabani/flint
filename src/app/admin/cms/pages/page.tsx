export const instant = false;

import Link from "next/link";
import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { CMSPage } from "@/models/CMS";
import { RowDeleteAction } from "../../_components/row-delete-action";

export default async function AdminCMSPagesPage() {
  await requireAdminSession("cms.manage");
  await connection();
  await connectToDatabase();
  const docs = await CMSPage.find({ deletedAt: null }).sort({ title: 1 }).lean();
  const pages = docs.map((d) => ({
    id: String(d._id),
    title: d.title,
    slug: d.slug,
    isPublished: d.isPublished ?? false,
  }));

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-copper/70">CMS</p>
          <h1 className="mt-1 font-heading text-4xl text-[#171717]">Pages</h1>
          <p className="mt-1 text-sm text-[#171717]/50">{pages.length} total</p>
        </div>
        <Link href="/admin/cms/pages/new" className="border border-[#171717] bg-[#171717] px-4 py-2 text-sm text-ivory hover:bg-[#171717]/90 transition-colors">
          + New Page
        </Link>
      </div>

      <div className="mt-6 border border-[#171717]/10 bg-white overflow-x-auto">
        {pages.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#171717]/30">No pages yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#171717]/10">
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Title</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Slug</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Published</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs uppercase tracking-widest font-normal text-[#171717]/40" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171717]/5">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-[#171717]/[0.02] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#171717]">{page.title}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#171717]/50">{page.slug}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${page.isPublished ? "text-green-600" : "text-[#171717]/30"}`}>
                      {page.isPublished ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right flex justify-end gap-3">
                    <Link href={`/admin/cms/pages/${page.id}`} className="text-xs text-copper/60 hover:text-copper transition-colors">Edit</Link>
                    <RowDeleteAction id={page.id} name={page.title} endpoint="/api/admin/cms/pages" />
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
