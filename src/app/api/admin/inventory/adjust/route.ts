import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { writeAuditLog } from "@/lib/auth/audit";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { adjustStock } from "@/features/inventory/service";
import { ADJUSTABLE_MOVEMENT_TYPES } from "@/features/inventory/types";

const schema = z.object({
  productId: z.string().regex(/^[a-f\d]{24}$/i, "Choose a product"),
  variantId: z.string().trim().max(32).optional().nullable(),
  quantityChange: z
    .number()
    .int("Enter a whole number")
    .refine((value) => value !== 0, "Enter a non-zero whole number"),
  type: z.enum(ADJUSTABLE_MOVEMENT_TYPES),
  reason: z.string().trim().min(2, "Add a short reason").max(500),
  notes: z.string().trim().max(2000).optional().nullable(),
  allowZeroWriteOff: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminApi("inventory.manage");

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonError("Invalid JSON", 400);
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid adjustment", 422);
    }

    const variantId = parsed.data.variantId?.trim() || undefined;
    if (variantId && !/^[a-f\d]{24}$/i.test(variantId)) {
      return jsonError("Invalid variant", 422);
    }
    if (Math.abs(parsed.data.quantityChange) > 1_000_000) {
      return jsonError("Quantity is too large", 422);
    }

    const result = await adjustStock({
      productId: parsed.data.productId,
      variantId,
      quantityChange: parsed.data.quantityChange,
      type: parsed.data.type,
      reason: parsed.data.reason,
      notes: parsed.data.notes?.trim() || undefined,
      performedBy: session.id,
      allowZeroWriteOff: parsed.data.type === "damage" && parsed.data.allowZeroWriteOff === true,
    });

    try {
      await writeAuditLog({
        actor: session,
        action: "inventory.adjust",
        entityType: "InventoryMovement",
        entityId: result.movementId,
        summary: `${result.productName} (${result.sku}) ${result.quantityChange > 0 ? "+" : ""}${result.quantityChange} via ${result.type}: ${result.quantityBefore} → ${result.quantityAfter}`,
        changes: result,
      });
    } catch (error) {
      console.error("Failed to write inventory audit log", error);
    }

    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
