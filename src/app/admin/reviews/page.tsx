export const instant = false;

import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Review } from "@/models/Review";
import { Product } from "@/models/Product";
import { formatDate } from "@/lib/utils";
import { ReviewActions } from "./review-actions";

type Props = { searchParams: Promise<{ filter?: string }> };

export default async function AdminReviewsPage({ searchParams }: Props) {
  await requireAdminSession("reviews.manage");
  const { filter = "pending" } = await searchParams;
  await connection();
  await connectToDatabase();

  const query =
    filter === "approved"
      ? { isApproved: true, deletedAt: null }
      : filter === "featured"
      ? { isFeatured: true, isApproved: true, deletedAt: null }
      : { isApproved: false, deletedAt: null };

  const docs = await Review.find(query).sort({ createdAt: -1 }).lean();

  // Grab product names
  const productIds = [...new Set(docs.map((d) => String(d.productId)))];
  const products = await Product.find({ _id: { $in: productIds } }).select("_id name").lean();
  const productMap: Record<string, string> = {};
  products.forEach((p) => { productMap[String(p._id)] = p.name; });

  const items = docs.map((d) => ({
    id: String(d._id),
    productId: String(d.productId),
    productName: productMap[String(d.productId)] ?? "Unknown",
    rating: d.rating,
    title: d.title ?? null,
    body: d.body,
    isApproved: d.isApproved ?? false,
    isFeatured: d.isFeatured ?? false,
    createdAt: d.createdAt ? new Date(String(d.createdAt)).toISOString() : "",
  }));

  const filters = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "featured", label: "Featured" },
  ];

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-copper/70">Catalogue</p>
      <h1 className="mt-1 font-heading text-4xl text-[#1B365D]">Reviews</h1>

      <div className="mt-5 flex gap-2">
        {filters.map((f) => (
          <a
            key={f.value}
            href={`/admin/reviews?filter=${f.value}`}
            className={`border px-3 py-1.5 text-sm transition-colors ${
              filter === f.value
                ? "border-[#1B365D] bg-[#1B365D] text-ivory"
                : "border-[#1B365D]/20 text-[#1B365D]/60 hover:border-copper hover:text-copper"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      <div className="mt-6 border border-[#1B365D]/10 bg-white overflow-x-auto">
        {items.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#1B365D]/30">
            No {filter} reviews.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1B365D]/10">
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#1B365D]/40">Product</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#1B365D]/40">Rating</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#1B365D]/40">Review</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#1B365D]/40">Date</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs uppercase tracking-widest font-normal text-[#1B365D]/40">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1B365D]/5">
              {items.map((r) => (
                <tr key={r.id} className="hover:bg-[#1B365D]/[0.02] transition-colors">
                  <td className="px-4 py-3 text-[#1B365D] font-medium max-w-[200px]">{r.productName}</td>
                  <td className="px-4 py-3">
                    <span className="text-copper">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    {r.title && <p className="font-medium text-[#1B365D]">{r.title}</p>}
                    <p className="text-[#1B365D]/60 text-xs line-clamp-2">{r.body}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#1B365D]/40 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <ReviewActions
                      id={r.id}
                      isApproved={r.isApproved}
                      isFeatured={r.isFeatured}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
