import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";
import { PAYMENT_METHODS } from "@/constants";

const PaymentSchema = new Schema(
  {
    paymentNumber: { type: String, required: true, unique: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", index: true },
    posTransactionId: { type: Schema.Types.ObjectId, ref: "POSTransaction", index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    method: { type: String, enum: PAYMENT_METHODS, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    reference: String,
    notes: String,
    receivedBy: { type: Schema.Types.ObjectId, ref: "User" },
    paidAt: Date,
  },
  { timestamps: true },
);

export type PaymentDocument = InferSchemaType<typeof PaymentSchema> & {
  _id: Schema.Types.ObjectId;
};

export const Payment: Model<PaymentDocument> =
  (models.Payment as Model<PaymentDocument>) ||
  model<PaymentDocument>("Payment", PaymentSchema);
