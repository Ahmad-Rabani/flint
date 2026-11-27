import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const NotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: {
      type: String,
      enum: ["info", "order", "custom_order", "inventory", "system"],
      default: "info",
    },
    href: String,
    isRead: { type: Boolean, default: false, index: true },
    meta: Schema.Types.Mixed,
  },
  { timestamps: true },
);

export type NotificationDocument = InferSchemaType<typeof NotificationSchema> & {
  _id: Schema.Types.ObjectId;
};

export const Notification: Model<NotificationDocument> =
  (models.Notification as Model<NotificationDocument>) ||
  model<NotificationDocument>("Notification", NotificationSchema);
