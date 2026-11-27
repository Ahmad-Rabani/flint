import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { CMSPage } from "@/models/CMS";
import { writeAuditLog } from "@/lib/auth/audit";
import { slugify } from "@/lib/utils";
import { jsonOk, jsonCreated, jsonError, handleRouteError } from "@/lib/api";

const schema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  content: z.string().min(1),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  isPublished: z.boolean().optional(),
});

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAdminApi("cms.manage"); void session;
    await connectToDatabase();
    const docs = await CMSPage.find({ deletedAt: null }).sort({ title: 1 }).lean();
    return jsonOk(docs.map((d) => ({ id: String(d._id), title: d.title, slug: d.slug, isPublished: d.isPublished ?? false })));
  } catch (err) { return handleRouteError(err); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminApi("cms.manage");
    const data = schema.parse(await req.json());
    await connectToDatabase();
    const slug = data.slug ?? slugify(data.title);
    const existing = await CMSPage.findOne({ slug, deletedAt: null });
    if (existing) return jsonError("Slug already exists", 409);
    const doc = await CMSPage.create({ ...data, slug, isPublished: data.isPublished ?? false });
    await writeAuditLog({ actor: session, action: "cms_page.create", entityType: "CMSPage", entityId: String(doc._id), summary: `Created page "${data.title}"` });
    return jsonCreated({ id: String(doc._id) });
  } catch (err) { return handleRouteError(err); }
}
