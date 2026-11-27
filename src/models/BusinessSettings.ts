import { Schema, models, model, Types, type InferSchemaType, type Model } from "mongoose";

const BusinessSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    businessName: { type: String, default: "FLINT" },
    legalName: String,
    email: String,
    phone: String,
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    currency: { type: String, default: "USD" },
    taxRate: { type: Number, default: 0 },
    taxInclusive: { type: Boolean, default: false },
    paymentMethods: [
      {
        id: String,
        label: String,
        enabled: Boolean,
      },
    ],
    shipping: {
      flatRate: { type: Number, default: 15 },
      freeOver: { type: Number, default: 250 },
      restrictedCountries: [String],
      estimatedDaysMin: { type: Number, default: 7 },
      estimatedDaysMax: { type: Number, default: 21 },
    },
    ageRequirementDefault: { type: Number, default: 18 },
    notifications: {
      orderEmail: { type: Boolean, default: true },
      lowStockEmail: { type: Boolean, default: true },
      customOrderEmail: { type: Boolean, default: true },
    },
    seo: {
      defaultTitle: String,
      defaultDescription: String,
    },
    setupCompleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type BusinessSettingsDocument = InferSchemaType<typeof BusinessSettingsSchema> & {
  _id: Types.ObjectId;
};

export const BusinessSettings: Model<BusinessSettingsDocument> =
  (models.BusinessSettings as Model<any>) ||
  model<BusinessSettingsDocument>("BusinessSettings", BusinessSettingsSchema);
