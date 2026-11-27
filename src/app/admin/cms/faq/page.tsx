export const instant = false;

import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { FAQ } from "@/models/CMS";
import { FAQManager } from "./faq-manager";

export default async function AdminFAQPage() {
  await requireAdminSession("cms.manage");
  await connection();
  await connectToDatabase();
  const docs = await FAQ.find({ deletedAt: null }).sort({ sortOrder: 1 }).lean();
  const faqs = docs.map((d) => ({
    id: String(d._id),
    question: d.question,
    answer: d.answer,
    category: d.category ?? null,
    sortOrder: d.sortOrder ?? 0,
    isActive: d.isActive ?? true,
  }));

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-copper/70">CMS</p>
      <h1 className="mt-1 font-heading text-4xl text-[#171717]">FAQ</h1>
      <FAQManager faqs={faqs} />
    </div>
  );
}
