import { Schema, models, model, Types, type InferSchemaType, type Model } from "mongoose";
import { ORDER_STATUSES, PAYMENT_METHODS } from "@/constants";
import { AddressSchema, softDeleteFields } from "./shared";

const OrderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: Schema.Types.ObjectId,
    sku: { type: String, required: true },
    name: { type: String, required: true },
    imageUrl: String,
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    taxRate: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    lineTotal: { type: Number, required: true },
    customization: { type: Map, of: String },
  },
  { _id: true },
);

const OrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    source: { type: String, enum: ["online", "pos", "custom"], default: "online", index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    guestEmail: String,
    items: [OrderItemSchema],
    shippingAddress: AddressSchema,
    billingAddress: AddressSchema,
    subtotal: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    shippingAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    couponCode: String,
    status: { type: String, enum: ORDER_STATUSES, default: "pending", index: true },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending", "paid", "partially_refunded", "refunded", "failed"],
      default: "unpaid",
      index: true,
    },
    paymentMethod: { type: String, enum: [...PAYMENT_METHODS, ""] },
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },
    customOrderId: { type: Schema.Types.ObjectId, ref: "CustomOrder" },
    notes: String,
    internalNotes: String,
    placedAt: { type: Date, default: Date.now },
    ...softDeleteFields,
  },
  { timestamps: true },
);

OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ customerId: 1, createdAt: -1 });

export type OrderDocument = InferSchemaType<typeof OrderSchema> & {
  _id: Types.ObjectId;
};

export const Order = (models.Order || model("Order", OrderSchema)) as Model<any>;
