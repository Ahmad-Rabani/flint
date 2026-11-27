import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";
import { MediaRefSchema, softDeleteFields } from "./shared";

const CollectionSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: String,
    image: MediaRefSchema,
    productIds: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    isFeatured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    seoTitle: String,
    seoDescription: String,
    ...softDeleteFields,
  },
  { timestamps: true },
);

export type CollectionDocument = InferSchemaType<typeof CollectionSchema> & {
  _id: Schema.Types.ObjectId;
};

export const Collection: Model<CollectionDocument> =
  (models.Collection as Model<CollectionDocument>) ||
  model<CollectionDocument>("Collection", CollectionSchema);
