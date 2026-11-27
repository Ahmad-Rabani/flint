export const instant = false;

import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { HomepageSection } from "@/models/CMS";
import { HomepageSectionForm } from "./homepage-section-form";

export default async function AdminHomepagePage() {
  await requireAdminSession("cms.manage");
  await connection();
  await connectToDatabase();

  const docs = await HomepageSection.find({}).sort({ sortOrder: 1 }).lean();
  const sections = docs.map((s) => ({
    id: String(s._id),
    key: s.key,
    title: s.title ?? "",
    subtitle: s.subtitle ?? "",
    body: s.body ?? "",
    ctaLabel: s.ctaLabel ?? "",
    ctaHref: s.ctaHref ?? "",
    isActive: s.isActive ?? true,
    sortOrder: s.sortOrder ?? 0,
  }));

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-copper/70">CMS</p>
      <h1 className="mt-1 font-heading text-4xl text-[#171717]">Homepage Sections</h1>
      <p className="mt-2 text-sm text-[#171717]/50">Edit the content blocks shown on the homepage.</p>

      {sections.length === 0 ? (
        <div className="mt-8 border border-[#171717]/10 bg-white p-12 text-center text-sm text-[#171717]/30">
          No homepage sections found. Run the seed script to initialise them.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {sections.map((section) => (
            <HomepageSectionForm key={section.id} section={section} />
          ))}
        </div>
      )}
    </div>
  );
}
