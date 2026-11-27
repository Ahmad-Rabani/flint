export const instant = false;

import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Coupon } from "@/models/Coupon";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CouponManager } from "./coupon-manager";

export default async function AdminCouponsPage() {
  await requireAdminSession("marketing.manage");
  await connection();
  await connectToDatabase();
  const docs = await Coupon.find({ deletedAt: null }).sort({ createdAt: -1 }).lean();
  const coupons = docs.map((d) => ({
    id: String(d._id),
    code: d.code,
    description: d.description ?? null,
    type: d.type as "percentage" | "fixed",
    value: d.value,
    minOrderAmount: d.minOrderAmount ?? 0,
    usageLimit: d.usageLimit ?? null,
    usedCount: d.usedCount ?? 0,
    isActive: d.isActive ?? true,
    startsAt: d.startsAt ? new Date(String(d.startsAt)).toISOString() : null,
    endsAt: d.endsAt ? new Date(String(d.endsAt)).toISOString() : null,
  }));

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-copper/70">Marketing</p>
      <h1 className="mt-1 font-heading text-4xl text-[#1B365D]">Coupons</h1>
      <CouponManager coupons={coupons} />
    </div>
  );
}
