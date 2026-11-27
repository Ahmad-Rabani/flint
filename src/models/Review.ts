import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";
import { MediaRefSchema, softDeleteFields } from "./shared";

const ReviewSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: String,
    body: { type: String, required: true },
    images: [MediaRefSchema],
    isApproved: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false },
    ...softDeleteFields,
  },
  { timestamps: true },
);

export type ReviewDocument = InferSchemaType<typeof ReviewSchema> & {
  _id: Schema.Types.ObjectId;
};

export const Review: Model<ReviewDocument> =
  (models.Review as Model<ReviewDocument>) ||
  model<ReviewDocument>("Review", ReviewSchema);
