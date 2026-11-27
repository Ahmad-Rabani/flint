import { Schema, models, model, Types, type InferSchemaType, type Model } from "mongoose";
import { MediaRefSchema, softDeleteFields } from "./shared";

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: String,
    parentId: { type: Schema.Types.ObjectId, ref: "Category", default: null, index: true },
    image: MediaRefSchema,
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    seoTitle: String,
    seoDescription: String,
    ...softDeleteFields,
  },
  { timestamps: true },
);

export type CategoryDocument = InferSchemaType<typeof CategorySchema> & {
  _id: Types.ObjectId;
};

export const Category: Model<CategoryDocument> =
  (models.Category as Model<any>) ||
  model<CategoryDocument>("Category", CategorySchema);
