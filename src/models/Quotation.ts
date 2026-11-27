import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";
import { softDeleteFields } from "./shared";

const QuotationSchema = new Schema(
  {
    quotationNumber: { type: String, required: true, unique: true, index: true },
    customOrderId: {
      type: Schema.Types.ObjectId,
      ref: "CustomOrder",
      required: true,
      index: true,
    },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD" },
    depositAmount: { type: Number, default: 0 },
    validUntil: Date,
    estimatedDays: Number,
    message: String,
    lineItems: [
      {
        label: String,
        amount: Number,
      },
    ],
    status: {
      type: String,
      enum: ["draft", "sent", "accepted", "rejected", "expired"],
      default: "draft",
      index: true,
    },
    sentAt: Date,
    respondedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    ...softDeleteFields,
  },
  { timestamps: true },
);

export type QuotationDocument = InferSchemaType<typeof QuotationSchema> & {
  _id: Schema.Types.ObjectId;
};

export const Quotation: Model<QuotationDocument> =
  (models.Quotation as Model<QuotationDocument>) ||
  model<QuotationDocument>("Quotation", QuotationSchema);
