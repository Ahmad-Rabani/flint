export const instant = false;

import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Testimonial } from "@/models/CMS";
import { TestimonialManager } from "./testimonial-manager";

export default async function AdminTestimonialsPage() {
  await requireAdminSession("cms.manage");
  await connection();
  await connectToDatabase();
  const docs = await Testimonial.find({ deletedAt: null }).sort({ sortOrder: 1 }).lean();
  const testimonials = docs.map((d) => ({
    id: String(d._id),
    authorName: d.authorName,
    authorTitle: d.authorTitle ?? null,
    quote: d.quote,
    rating: d.rating ?? 5,
    isFeatured: !!d.isFeatured,
    isActive: !!d.isActive,
    sortOrder: d.sortOrder ?? 0,
  }));

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-copper/70">CMS</p>
      <h1 className="mt-1 font-heading text-4xl text-[#171717]">Testimonials</h1>
      <TestimonialManager testimonials={testimonials} />
    </div>
  );
}
