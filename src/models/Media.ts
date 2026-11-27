import { Schema, models, model, Types, type InferSchemaType, type Model } from "mongoose";
import { softDeleteFields } from "./shared";

const MediaSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    url: { type: String, required: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    width: Number,
    height: Number,
    alt: String,
    folder: { type: String, default: "general", index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
    ...softDeleteFields,
  },
  { timestamps: true },
);

export type MediaDocument = InferSchemaType<typeof MediaSchema> & {
  _id: Types.ObjectId;
};

export const Media = (models.Media || model("Media", MediaSchema)) as Model<any>;
