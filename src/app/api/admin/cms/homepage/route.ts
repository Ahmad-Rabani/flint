import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { HomepageSection } from "@/models/CMS";
import { writeAuditLog } from "@/lib/auth/audit";
import { jsonOk, jsonError, handleRouteError } from "@/lib/api";

const schema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  body: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdminApi("cms.manage");
    const body = await req.json();
    const data = schema.parse(body);
    await connectToDatabase();
    const section = await HomepageSection.findById(data.id);
    if (!section) return jsonError("Not found", 404);
    const { id: _, ...updates } = data;
    Object.assign(section, updates);
    await section.save();
    await writeAuditLog({ actor: session, action: "homepage_section.update", entityType: "HomepageSection", entityId: data.id, summary: `Updated homepage section "${section.key}"` });
    return jsonOk({ id: data.id });
  } catch (err) {
    return handleRouteError(err);
  }
}
