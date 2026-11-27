import { NextRequest } from "next/server";
import { z } from "zod";
import { PAYMENT_METHODS } from "@/constants";
import { requireAdminApi } from "@/lib/auth/admin";
import { hasPermission } from "@/lib/permissions";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { checkoutPos } from "@/features/pos/service";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: objectId,
        variantId: objectId.nullable().optional(),
        quantity: z.number().int().min(1).max(9999),
      }),
    )
    .min(1, "Add at least one product")
    .max(100),
  customerId: objectId.nullable().optional(),
  guestName: z.string().trim().max(120).nullable().optional(),
  paymentMethod: z.enum(PAYMENT_METHODS),
  discountAmount: z.number().min(0).max(1_000_000).optional(),
  discountReason: z.string().trim().max(200).nullable().optional(),
  amountTendered: z.number().min(0).max(1_000_000).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminApi("pos.access");

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonError("Invalid JSON", 400);
    }

    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid sale", 422);
    }

    if ((parsed.data.discountAmount ?? 0) > 0 && !hasPermission(session, "pos.discount")) {
      return jsonError("You do not have permission to apply a discount", 403);
    }

    const result = await checkoutPos(parsed.data, session);
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
