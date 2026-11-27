import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const AuditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    actorEmail: String,
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: String,
    summary: String,
    changes: Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: true },
);

AuditLogSchema.index({ createdAt: -1 });

export type AuditLogDocument = InferSchemaType<typeof AuditLogSchema> & {
  _id: Schema.Types.ObjectId;
};

export const AuditLog: Model<AuditLogDocument> =
  (models.AuditLog as Model<AuditLogDocument>) ||
  model<AuditLogDocument>("AuditLog", AuditLogSchema);
