import { Schema, models, model, Types, type InferSchemaType, type Model } from "mongoose";
import { PRODUCT_STATUSES } from "@/constants";
import { MediaRefSchema, softDeleteFields } from "./shared";

const VariantSchema = new Schema(
  {
    name: { type: String, required: true },
    sku: { type: String, required: true },
    barcode: String,
    options: { type: Map, of: String },
    price: { type: Number, required: true },
    compareAtPrice: Number,
    costPrice: Number,
    stock: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: true },
);

const SpecSchema = new Schema(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false },
);

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: "text" },
    slug: { type: String, required: true, unique: true, index: true },
    sku: { type: String, required: true, unique: true, index: true },
    barcode: { type: String, index: true },
    description: { type: String, required: true },
    shortDescription: String,
    categoryIds: [{ type: Schema.Types.ObjectId, ref: "Category", index: true }],
    collectionIds: [{ type: Schema.Types.ObjectId, ref: "Collection" }],
    images: [MediaRefSchema],
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: Number,
    costPrice: { type: Number, default: 0 },
    stock: { type: Number, default: 0, min: 0 },
    minStockLevel: { type: Number, default: 5 },
    status: { type: String, enum: PRODUCT_STATUSES, default: "draft", index: true },
    badges: [String],
    materials: [String],
    specifications: [SpecSchema],
    variants: [VariantSchema],
    customizationOptionIds: [{ type: Schema.Types.ObjectId, ref: "CustomizationOption" }],
    isCustomizable: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isBestseller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    taxRate: { type: Number, default: 0 },
    weightGrams: Number,
    ageRestriction: { type: Number, default: 0 },
    restrictedDestinations: [String],
    soldCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    seoTitle: String,
    seoDescription: String,
    ...softDeleteFields,
  },
  { timestamps: true },
);

ProductSchema.index({ status: 1, price: 1 });
ProductSchema.index({ isFeatured: 1, status: 1 });
ProductSchema.index({ stock: 1, minStockLevel: 1 });

export type ProductDocument = InferSchemaType<typeof ProductSchema> & {
  _id: Types.ObjectId;
};

export const Product: Model<ProductDocument> =
  (models.Product as Model<any>) ||
  model<ProductDocument>("Product", ProductSchema);
