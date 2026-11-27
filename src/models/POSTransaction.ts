import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";
import { PAYMENT_METHODS } from "@/constants";

const POSItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: Schema.Types.ObjectId,
    sku: { type: String, required: true },
    name: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    taxRate: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    lineTotal: { type: Number, required: true },
  },
  { _id: true },
);

const POSTransactionSchema = new Schema(
  {
    receiptNumber: { type: String, required: true, unique: true, index: true },
    cashierId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", index: true },
    items: [POSItemSchema],
    subtotal: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    discountReason: String,
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    amountTendered: Number,
    changeGiven: Number,
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    status: {
      type: String,
      enum: ["completed", "refunded", "voided"],
      default: "completed",
      index: true,
    },
    notes: String,
  },
  { timestamps: true },
);

POSTransactionSchema.index({ createdAt: -1 });

export type POSTransactionDocument = InferSchemaType<typeof POSTransactionSchema> & {
  _id: Schema.Types.ObjectId;
};

export const POSTransaction: Model<POSTransactionDocument> =
  (models.POSTransaction as Model<POSTransactionDocument>) ||
  model<POSTransactionDocument>("POSTransaction", POSTransactionSchema);
