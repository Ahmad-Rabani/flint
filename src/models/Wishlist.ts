import { Schema, models, model, Types, type InferSchemaType, type Model } from "mongoose";

const WishlistSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    productIds: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  },
  { timestamps: true },
);

export type WishlistDocument = InferSchemaType<typeof WishlistSchema> & {
  _id: Types.ObjectId;
};

export const Wishlist: Model<WishlistDocument> =
  (models.Wishlist as Model<any>) ||
  model<WishlistDocument>("Wishlist", WishlistSchema);
