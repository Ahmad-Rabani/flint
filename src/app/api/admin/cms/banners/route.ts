import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Banner } from "@/models/CMS";
import { writeAuditLog } from "@/lib/auth/audit";
import { jsonOk, jsonCreated, handleRouteError } from "@/lib/api";

const schema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
  placement: z.enum(["home_hero", "home_secondary", "catalogue", "custom"]).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
});

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAdminApi("cms.manage");
    void session;
    await connectToDatabase();
    const docs = await Banner.find({ deletedAt: null }).sort({ sortOrder: 1, createdAt: -1 }).lean();
    return jsonOk(docs.map((d) => ({
      id: String(d._id),
      title: d.title,
      subtitle: d.subtitle ?? null,
      placement: d.placement,
      ctaLabel: d.ctaLabel ?? null,
      ctaHref: d.ctaHref ?? null,
      isActive: d.isActive,
      sortOrder: d.sortOrder ?? 0,
      startsAt: d.startsAt ? new Date(String(d.startsAt)).toISOString() : null,
      endsAt: d.endsAt ? new Date(String(d.endsAt)).toISOString() : null,
    })));
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminApi("cms.manage");
    const body = await req.json();
    const data = schema.parse(body);
    await connectToDatabase();
    const banner = await Banner.create({ ...data, isActive: data.isActive ?? true, sortOrder: data.sortOrder ?? 0 });
    await writeAuditLog({ actor: session, action: "banner.create", entityType: "Banner", entityId: String(banner._id), summary: `Created banner "${data.title}"` });
    return jsonCreated({ id: String(banner._id) });
  } catch (err) {
    return handleRouteError(err);
  }
}
