import { Schema } from "mongoose";

export const MediaRefSchema = new Schema(
  {
    key: { type: String, required: true },
    url: { type: String, required: true },
    alt: String,
    width: Number,
    height: Number,
    mimeType: String,
    size: Number,
  },
  { _id: false },
);

export const AddressSchema = new Schema(
  {
    label: { type: String, default: "Home" },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: String,
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const softDeleteFields = {
  deletedAt: { type: Date, default: null, index: true },
};
