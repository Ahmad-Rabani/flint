import { Schema, models, model, Types, type InferSchemaType, type Model } from "mongoose";
import { INVENTORY_MOVEMENT_TYPES } from "@/constants";

const InventoryMovementSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    variantId: Schema.Types.ObjectId,
    sku: { type: String, required: true, index: true },
    type: { type: String, enum: INVENTORY_MOVEMENT_TYPES, required: true, index: true },
    quantityChange: { type: Number, required: true },
    quantityBefore: { type: Number, required: true },
    quantityAfter: { type: Number, required: true },
    reason: String,
    referenceType: {
      type: String,
      enum: ["order", "pos", "adjustment", "return", "custom"],
    },
    referenceId: Schema.Types.ObjectId,
    performedBy: { type: Schema.Types.ObjectId, ref: "User" },
    notes: String,
  },
  { timestamps: true },
);

InventoryMovementSchema.index({ createdAt: -1 });

export type InventoryMovementDocument = InferSchemaType<typeof InventoryMovementSchema> & {
  _id: Types.ObjectId;
};

export const InventoryMovement: Model<InventoryMovementDocument> =
  (models.InventoryMovement as Model<any>) ||
  model<InventoryMovementDocument>("InventoryMovement", InventoryMovementSchema);
