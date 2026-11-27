import { Schema, models, model, Types, type InferSchemaType, type Model } from "mongoose";
import { AddressSchema, softDeleteFields } from "./shared";

const CustomerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: String,
    addresses: [AddressSchema],
    notes: String,
    tags: [String],
    totalSpent: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0 },
    marketingOptIn: { type: Boolean, default: false },
    ...softDeleteFields,
  },
  { timestamps: true },
);

CustomerSchema.index({ email: 1, deletedAt: 1 });

export type CustomerDocument = InferSchemaType<typeof CustomerSchema> & {
  _id: Types.ObjectId;
};

export const Customer: Model<CustomerDocument> =
  (models.Customer as Model<any>) ||
  model<CustomerDocument>("Customer", CustomerSchema);
