import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { CustomizationOption } from "@/models/CustomizationOption";
import { writeAuditLog } from "@/lib/auth/audit";
import { jsonOk, jsonError, handleRouteError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

const valueSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  priceDelta: z.number().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const updateSchema = z.object({
  key: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  productTypes: z.array(z.string()).optional(),
  inputType: z.enum(["select", "color", "text", "number", "boolean"]).optional(),
  values: z.array(valueSchema).optional(),
  isRequired: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession("customization.manage");
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);
    await connectToDatabase();
    const opt = await CustomizationOption.findOne({ _id: id, deletedAt: null });
    if (!opt) return jsonError("Not found", 404);
    Object.assign(opt, data);
    await opt.save();
    await writeAuditLog({ actor: session, action: "customization_option.update", entityType: "CustomizationOption", entityId: id, summary: `Updated option "${opt.name}"` });
    return jsonOk({ id });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession("customization.manage");
    const { id } = await params;
    await connectToDatabase();
    const opt = await CustomizationOption.findOne({ _id: id, deletedAt: null });
    if (!opt) return jsonError("Not found", 404);
    opt.deletedAt = new Date();
    await opt.save();
    await writeAuditLog({ actor: session, action: "customization_option.delete", entityType: "CustomizationOption", entityId: id, summary: `Deleted option "${opt.name}"` });
    return jsonOk({ id });
  } catch (err) {
    return handleRouteError(err);
  }
}
