import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Banner } from "@/models/CMS";
import { writeAuditLog } from "@/lib/auth/audit";
import { jsonOk, jsonError, handleRouteError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  subtitle: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
  placement: z.enum(["home_hero", "home_secondary", "catalogue", "custom"]).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminApi("cms.manage");
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);
    await connectToDatabase();
    const banner = await Banner.findOne({ _id: id, deletedAt: null });
    if (!banner) return jsonError("Not found", 404);
    Object.assign(banner, data);
    await banner.save();
    await writeAuditLog({ actor: session, action: "banner.update", entityType: "Banner", entityId: id, summary: `Updated banner` });
    return jsonOk({ id });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminApi("cms.manage");
    const { id } = await params;
    await connectToDatabase();
    const banner = await Banner.findOne({ _id: id, deletedAt: null });
    if (!banner) return jsonError("Not found", 404);
    banner.deletedAt = new Date();
    await banner.save();
    await writeAuditLog({ actor: session, action: "banner.delete", entityType: "Banner", entityId: id, summary: `Deleted banner` });
    return jsonOk({ id });
  } catch (err) {
    return handleRouteError(err);
  }
}
