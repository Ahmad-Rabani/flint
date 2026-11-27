import { Schema, models, model, Types, type InferSchemaType, type Model } from "mongoose";

const CartItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: Schema.Types.ObjectId,
    quantity: { type: Number, required: true, min: 1 },
    customization: { type: Map, of: String },
  },
  { _id: true },
);

const CartSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    sessionId: { type: String, index: true },
    items: [CartItemSchema],
    couponCode: String,
  },
  { timestamps: true },
);

CartSchema.index({ userId: 1 }, { unique: true, sparse: true });

export type CartDocument = InferSchemaType<typeof CartSchema> & {
  _id: Types.ObjectId;
};

export const Cart = (models.Cart || model("Cart", CartSchema)) as Model<any>;
