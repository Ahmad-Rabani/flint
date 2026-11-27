import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";
import { PERMISSIONS, USER_ROLES } from "@/constants";
import { softDeleteFields } from "./shared";

const RoleSchema = new Schema(
  {
    key: { type: String, enum: USER_ROLES, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    permissions: [{ type: String, enum: PERMISSIONS }],
    isSystem: { type: Boolean, default: true },
    ...softDeleteFields,
  },
  { timestamps: true },
);

export type RoleDocument = InferSchemaType<typeof RoleSchema> & { _id: Schema.Types.ObjectId };

export const Role: Model<RoleDocument> =
  (models.Role as Model<RoleDocument>) || model<RoleDocument>("Role", RoleSchema);
