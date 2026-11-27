import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";
import { CUSTOM_ORDER_STATUSES } from "@/constants";
import { MediaRefSchema, softDeleteFields } from "./shared";

const StatusHistorySchema = new Schema(
  {
    status: { type: String, enum: CUSTOM_ORDER_STATUSES, required: true },
    note: String,
    changedBy: { type: Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const CustomOrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    productType: { type: String, enum: ["knife", "axe", "utility"], required: true },
    designStyle: { type: String, required: true },
    preferences: { type: Map, of: String },
    referenceImages: [MediaRefSchema],
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true, lowercase: true },
    customerPhone: String,
    description: { type: String, required: true },
    intendedUse: String,
    budgetMin: Number,
    budgetMax: Number,
    preferredDeliveryDate: Date,
    additionalComments: String,
    status: {
      type: String,
      enum: CUSTOM_ORDER_STATUSES,
      default: "submitted",
      index: true,
    },
    statusHistory: [StatusHistorySchema],
    internalNotes: [
      {
        note: String,
        authorId: { type: Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    quotationId: { type: Schema.Types.ObjectId, ref: "Quotation" },
    estimatedCompletionDate: Date,
    convertedOrderId: { type: Schema.Types.ObjectId, ref: "Order" },
    ...softDeleteFields,
  },
  { timestamps: true },
);

export type CustomOrderDocument = InferSchemaType<typeof CustomOrderSchema> & {
  _id: Schema.Types.ObjectId;
};

export const CustomOrder: Model<CustomOrderDocument> =
  (models.CustomOrder as Model<CustomOrderDocument>) ||
  model<CustomOrderDocument>("CustomOrder", CustomOrderSchema);
