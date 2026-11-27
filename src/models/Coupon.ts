import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";
import { softDeleteFields } from "./shared";

const CouponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, index: true },
    description: String,
    type: { type: String, enum: ["percentage", "fixed"], required: true },
    value: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscountAmount: Number,
    usageLimit: Number,
    usedCount: { type: Number, default: 0 },
    startsAt: Date,
    endsAt: Date,
    isActive: { type: Boolean, default: true },
    ...softDeleteFields,
  },
  { timestamps: true },
);

export type CouponDocument = InferSchemaType<typeof CouponSchema> & {
  _id: Schema.Types.ObjectId;
};

export const Coupon: Model<CouponDocument> =
  (models.Coupon as Model<CouponDocument>) ||
  model<CouponDocument>("Coupon", CouponSchema);
