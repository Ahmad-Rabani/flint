import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { CustomizationOption } from "@/models/CustomizationOption";
import { writeAuditLog } from "@/lib/auth/audit";
import { jsonOk, jsonCreated, jsonError, handleRouteError } from "@/lib/api";

const valueSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  priceDelta: z.number().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const schema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  productTypes: z.array(z.string()).optional(),
  inputType: z.enum(["select", "color", "text", "number", "boolean"]).optional(),
  values: z.array(valueSchema).optional(),
  isRequired: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAdminApi("customization.manage");
    void session;
    await connectToDatabase();
    const docs = await CustomizationOption.find({ deletedAt: null }).sort({ sortOrder: 1, name: 1 }).lean();
    return jsonOk(docs.map((d) => ({
      id: String(d._id),
      key: d.key,
      name: d.name,
      inputType: d.inputType,
      productTypes: d.productTypes ?? [],
      isRequired: d.isRequired,
      isActive: d.isActive,
      sortOrder: d.sortOrder ?? 0,
      valueCount: (d.values ?? []).length,
    })));
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminApi("customization.manage");
    const body = await req.json();
    const data = schema.parse(body);
    await connectToDatabase();
    const existing = await CustomizationOption.findOne({ key: data.key });
    if (existing) return jsonError("Key already exists", 409);
    const opt = await CustomizationOption.create({ ...data, isActive: data.isActive ?? true, sortOrder: data.sortOrder ?? 0 });
    await writeAuditLog({ actor: session, action: "customization_option.create", entityType: "CustomizationOption", entityId: String(opt._id), summary: `Created option "${data.name}"` });
    return jsonCreated({ id: String(opt._id) });
  } catch (err) {
    return handleRouteError(err);
  }
}
