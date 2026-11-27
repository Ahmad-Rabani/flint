export const instant = false;

import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Banner } from "@/models/CMS";
import { formatDate } from "@/lib/utils";
import { BannerManager } from "./banner-manager";

export default async function AdminBannersPage() {
  await requireAdminSession("cms.manage");
  await connection();
  await connectToDatabase();
  const docs = await Banner.find({ deletedAt: null }).sort({ sortOrder: 1, createdAt: -1 }).lean();
  const banners = docs.map((d) => ({
    id: String(d._id),
    title: d.title,
    subtitle: d.subtitle ?? null,
    placement: d.placement ?? "home_hero",
    ctaLabel: d.ctaLabel ?? null,
    ctaHref: d.ctaHref ?? null,
    isActive: d.isActive ?? true,
    sortOrder: d.sortOrder ?? 0,
    startsAt: d.startsAt ? new Date(String(d.startsAt)).toISOString() : null,
    endsAt: d.endsAt ? new Date(String(d.endsAt)).toISOString() : null,
  }));

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-copper/70">CMS</p>
      <h1 className="mt-1 font-heading text-4xl text-[#171717]">Banners</h1>
      <BannerManager banners={banners} />
    </div>
  );
}
