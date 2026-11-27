export const instant = false;

import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { CMSPage } from "@/models/CMS";
import { CMSPageForm } from "../cms-page-form";

type Props = { params: Promise<{ id: string }> };

export default async function EditCMSPagePage({ params }: Props) {
  await requireAdminSession("cms.manage");
  const { id } = await params;
  await connection();
  await connectToDatabase();
  const doc = await CMSPage.findOne({ _id: id, deletedAt: null }).lean();
  if (!doc) notFound();

  const page = {
    id: String(doc._id),
    title: doc.title,
    slug: doc.slug,
    content: doc.content,
    seoTitle: doc.seoTitle ?? null,
    seoDescription: doc.seoDescription ?? null,
    isPublished: doc.isPublished ?? false,
  };

  return (
    <div>
      <Link href="/admin/cms/pages" className="text-xs uppercase tracking-widest text-copper/60 hover:text-copper transition-colors">← Pages</Link>
      <p className="mt-4 text-xs uppercase tracking-[0.3em] text-copper/70">CMS</p>
      <h1 className="mt-1 font-heading text-4xl text-[#1B365D]">{page.title}</h1>
      <CMSPageForm page={page} />
    </div>
  );
}
