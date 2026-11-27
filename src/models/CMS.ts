import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";
import { MediaRefSchema, softDeleteFields } from "./shared";

const BannerSchema = new Schema(
  {
    title: { type: String, required: true },
    subtitle: String,
    ctaLabel: String,
    ctaHref: String,
    image: MediaRefSchema,
    placement: {
      type: String,
      enum: ["home_hero", "home_secondary", "catalogue", "custom"],
      default: "home_hero",
    },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startsAt: Date,
    endsAt: Date,
    ...softDeleteFields,
  },
  { timestamps: true },
);

const CMSPageSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    content: { type: String, required: true },
    seoTitle: String,
    seoDescription: String,
    isPublished: { type: Boolean, default: false },
    ...softDeleteFields,
  },
  { timestamps: true },
);

const FAQSchema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: String,
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    ...softDeleteFields,
  },
  { timestamps: true },
);

const TestimonialSchema = new Schema(
  {
    authorName: { type: String, required: true },
    authorTitle: String,
    quote: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    avatar: MediaRefSchema,
    isFeatured: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    ...softDeleteFields,
  },
  { timestamps: true },
);

const NavigationSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    items: [
      {
        label: String,
        href: String,
        children: [
          {
            label: String,
            href: String,
          },
        ],
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const HomepageSectionSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    title: String,
    subtitle: String,
    body: String,
    ctaLabel: String,
    ctaHref: String,
    image: MediaRefSchema,
    config: Schema.Types.Mixed,
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type BannerDocument = InferSchemaType<typeof BannerSchema> & {
  _id: Schema.Types.ObjectId;
};
export type CMSPageDocument = InferSchemaType<typeof CMSPageSchema> & {
  _id: Schema.Types.ObjectId;
};
export type FAQDocument = InferSchemaType<typeof FAQSchema> & {
  _id: Schema.Types.ObjectId;
};
export type TestimonialDocument = InferSchemaType<typeof TestimonialSchema> & {
  _id: Schema.Types.ObjectId;
};
export type NavigationDocument = InferSchemaType<typeof NavigationSchema> & {
  _id: Schema.Types.ObjectId;
};
export type HomepageSectionDocument = InferSchemaType<typeof HomepageSectionSchema> & {
  _id: Schema.Types.ObjectId;
};

export const Banner: Model<BannerDocument> =
  (models.Banner as Model<BannerDocument>) || model<BannerDocument>("Banner", BannerSchema);

export const CMSPage: Model<CMSPageDocument> =
  (models.CMSPage as Model<CMSPageDocument>) ||
  model<CMSPageDocument>("CMSPage", CMSPageSchema);

export const FAQ: Model<FAQDocument> =
  (models.FAQ as Model<FAQDocument>) || model<FAQDocument>("FAQ", FAQSchema);

export const Testimonial: Model<TestimonialDocument> =
  (models.Testimonial as Model<TestimonialDocument>) ||
  model<TestimonialDocument>("Testimonial", TestimonialSchema);

export const Navigation: Model<NavigationDocument> =
  (models.Navigation as Model<NavigationDocument>) ||
  model<NavigationDocument>("Navigation", NavigationSchema);

export const HomepageSection: Model<HomepageSectionDocument> =
  (models.HomepageSection as Model<HomepageSectionDocument>) ||
  model<HomepageSectionDocument>("HomepageSection", HomepageSectionSchema);
