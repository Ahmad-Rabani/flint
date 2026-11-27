import { connectToDatabase } from "@/lib/mongodb/connection";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { Coupon } from "@/models";
import { z } from "zod";

const schema = z.object({
  code: z.string().min(2),
  subtotal: z.number().min(0),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    await connectToDatabase();

    const coupon = await Coupon.findOne({
      code: body.code.toUpperCase(),
      isActive: true,
      deletedAt: null,
    });

    if (!coupon) return jsonError("Invalid coupon code", 404);

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) return jsonError("Coupon is not active yet");
    if (coupon.endsAt && coupon.endsAt < now) return jsonError("Coupon has expired");
    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
      return jsonError("Coupon usage limit reached");
    }
    if (body.subtotal < (coupon.minOrderAmount ?? 0)) {
      return jsonError(`Minimum order amount is ${coupon.minOrderAmount}`);
    }

    let discount =
      coupon.type === "percentage"
        ? (body.subtotal * coupon.value) / 100
        : coupon.value;

    if (coupon.maxDiscountAmount != null) {
      discount = Math.min(discount, coupon.maxDiscountAmount);
    }
    discount = Math.min(discount, body.subtotal);

    return jsonOk({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount: Math.round(discount * 100) / 100,
      description: coupon.description,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
