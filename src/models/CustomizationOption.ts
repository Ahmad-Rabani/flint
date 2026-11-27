import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";
import { MediaRefSchema, softDeleteFields } from "./shared";

const OptionValueSchema = new Schema(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
    priceDelta: { type: Number, default: 0 },
    image: MediaRefSchema,
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { _id: true },
);

const CustomizationOptionSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: String,
    productTypes: [{ type: String }], // knife | axe | utility
    inputType: {
      type: String,
      enum: ["select", "color", "text", "number", "boolean"],
      default: "select",
    },
    values: [OptionValueSchema],
    isRequired: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    ...softDeleteFields,
  },
  { timestamps: true },
);

export type CustomizationOptionDocument = InferSchemaType<typeof CustomizationOptionSchema> & {
  _id: Schema.Types.ObjectId;
};

export const CustomizationOption: Model<CustomizationOptionDocument> =
  (models.CustomizationOption as Model<CustomizationOptionDocument>) ||
  model<CustomizationOptionDocument>("CustomizationOption", CustomizationOptionSchema);
