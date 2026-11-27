import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { CMSPage } from "@/models/CMS";
import { writeAuditLog } from "@/lib/auth/audit";
import { jsonOk, jsonError, handleRouteError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().optional(),
  content: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  isPublished: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession("cms.manage"); void session;
    const { id } = await params;
    await connectToDatabase();
    const doc = await CMSPage.findOne({ _id: id, deletedAt: null }).lean();
    if (!doc) return jsonError("Not found", 404);
    return jsonOk({ id: String(doc._id), title: doc.title, slug: doc.slug, content: doc.content, seoTitle: doc.seoTitle ?? null, seoDescription: doc.seoDescription ?? null, isPublished: doc.isPublished ?? false });
  } catch (err) { return handleRouteError(err); }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession("cms.manage");
    const { id } = await params;
    const data = schema.parse(await req.json());
    await connectToDatabase();
    const doc = await CMSPage.findOne({ _id: id, deletedAt: null });
    if (!doc) return jsonError("Not found", 404);
    Object.assign(doc, data);
    await doc.save();
    await writeAuditLog({ actor: session, action: "cms_page.update", entityType: "CMSPage", entityId: id, summary: `Updated page "${doc.title}"` });
    return jsonOk({ id });
  } catch (err) { return handleRouteError(err); }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession("cms.manage");
    const { id } = await params;
    await connectToDatabase();
    const doc = await CMSPage.findOne({ _id: id, deletedAt: null });
    if (!doc) return jsonError("Not found", 404);
    doc.deletedAt = new Date();
    await doc.save();
    await writeAuditLog({ actor: session, action: "cms_page.delete", entityType: "CMSPage", entityId: id, summary: `Deleted page "${doc.title}"` });
    return jsonOk({ id });
  } catch (err) { return handleRouteError(err); }
}
