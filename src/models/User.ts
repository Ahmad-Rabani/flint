import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";
import { USER_ROLES } from "@/constants";
import { softDeleteFields } from "./shared";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: USER_ROLES, required: true, default: "customer", index: true },
    permissions: [{ type: String }],
    phone: String,
    avatar: String,
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", index: true },
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
    ...softDeleteFields,
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof UserSchema> & { _id: Schema.Types.ObjectId };

export const User: Model<UserDocument> =
  (models.User as Model<UserDocument>) || model<UserDocument>("User", UserSchema);
