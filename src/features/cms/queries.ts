import "server-only";
import { connection } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Banner, CMSPage, FAQ, Testimonial, Navigation, HomepageSection } from "@/models/CMS";

// ─── Plain types ──────────────────────────────────────────────────────────────
export type PlainBanner = {
  _id: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  image?: { key: string; url: string; alt?: string };
  placement: string;
  sortOrder: number;
};

export type PlainFAQ = {
  _id: string;
  question: string;
  answer: string;
  category?: string;
  sortOrder: number;
};

export type PlainTestimonial = {
  _id: string;
  authorName: string;
  authorTitle?: string;
  quote: string;
  rating: number;
  avatar?: { key: string; url: string; alt?: string };
  sortOrder: number;
};

export type PlainNavItem = {
  label?: string;
  href?: string;
  children?: { label?: string; href?: string }[];
};

export type PlainNavigation = {
  _id: string;
  key: string;
  label: string;
  items: PlainNavItem[];
};

export type PlainHomepageSection = {
  _id: string;
  key: string;
  title?: string;
  subtitle?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  image?: { key: string; url: string; alt?: string };
  config?: Record<string, unknown>;
  sortOrder: number;
};

export type PlainCMSPage = {
  _id: string;
  title: string;
  slug: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
};

export type HomeContent = {
  banners: PlainBanner[];
  sections: PlainHomepageSection[];
  faqs: PlainFAQ[];
  testimonials: PlainTestimonial[];
  navigation?: PlainNavigation;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mediaRef(img: any) {
  if (!img) return undefined;
  return { key: img.key, url: img.url, alt: img.alt };
}

// ─── Queries ──────────────────────────────────────────────────────────────────
export async function getHomeContent(): Promise<HomeContent> {
  await connection();
  await connectToDatabase();

  const now = new Date();

  const [bannerDocs, sectionDocs, faqDocs, testimonialDocs, navDoc] = await Promise.all([
    Banner.find({
      isActive: true,
      deletedAt: null,
      $or: [{ startsAt: { $lte: now } }, { startsAt: null }],
      $and: [{ $or: [{ endsAt: { $gte: now } }, { endsAt: null }] }],
    })
      .sort({ sortOrder: 1 })
      .lean(),
    HomepageSection.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
    FAQ.find({ isActive: true, deletedAt: null }).sort({ sortOrder: 1 }).lean(),
    Testimonial.find({ isActive: true, isFeatured: true, deletedAt: null })
      .sort({ sortOrder: 1 })
      .lean(),
    Navigation.findOne({ key: "main", isActive: true }).lean(),
  ]);

  const banners: PlainBanner[] = bannerDocs.map((b) => ({
    _id: String(b._id),
    title: b.title,
    subtitle: b.subtitle ?? undefined,
    ctaLabel: b.ctaLabel ?? undefined,
    ctaHref: b.ctaHref ?? undefined,
    image: mediaRef(b.image),
    placement: b.placement,
    sortOrder: b.sortOrder,
  }));

  const sections: PlainHomepageSection[] = sectionDocs.map((s) => ({
    _id: String(s._id),
    key: s.key,
    title: s.title ?? undefined,
    subtitle: s.subtitle ?? undefined,
    body: s.body ?? undefined,
    ctaLabel: s.ctaLabel ?? undefined,
    ctaHref: s.ctaHref ?? undefined,
    image: mediaRef(s.image),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config: s.config as Record<string, unknown> | undefined,
    sortOrder: s.sortOrder,
  }));

  const faqs: PlainFAQ[] = faqDocs.map((f) => ({
    _id: String(f._id),
    question: f.question,
    answer: f.answer,
    category: f.category ?? undefined,
    sortOrder: f.sortOrder,
  }));

  const testimonials: PlainTestimonial[] = testimonialDocs.map((t) => ({
    _id: String(t._id),
    authorName: t.authorName,
    authorTitle: t.authorTitle ?? undefined,
    quote: t.quote,
    rating: t.rating ?? 5,
    avatar: mediaRef(t.avatar),
    sortOrder: t.sortOrder,
  }));

  const navigation: PlainNavigation | undefined = navDoc
    ? {
        _id: String(navDoc._id),
        key: navDoc.key,
        label: navDoc.label,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: (navDoc.items ?? []).map((item: any) => ({
          label: item.label,
          href: item.href,
          children: (item.children ?? []).map((c: any) => ({ label: c.label, href: c.href })),
        })),
      }
    : undefined;

  return { banners, sections, faqs, testimonials, navigation };
}

export async function getPageBySlug(slug: string): Promise<PlainCMSPage | null> {
  await connectToDatabase();
  const doc = await CMSPage.findOne({ slug, isPublished: true, deletedAt: null }).lean();
  if (!doc) return null;
  return {
    _id: String(doc._id),
    title: doc.title,
    slug: doc.slug,
    content: doc.content,
    seoTitle: doc.seoTitle ?? undefined,
    seoDescription: doc.seoDescription ?? undefined,
  };
}
