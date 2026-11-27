"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ReviewActions({
  id,
  isApproved,
  isFeatured,
}: {
  id: string;
  isApproved: boolean;
  isFeatured: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function patch(data: { isApproved?: boolean; isFeatured?: boolean }) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success("Review updated");
      router.refresh();
    } catch {
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this review?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Review deleted");
      router.refresh();
    } catch {
      toast.error("Delete failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {!isApproved && (
        <button
          onClick={() => patch({ isApproved: true })}
          disabled={loading}
          className="text-xs text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
        >
          Approve
        </button>
      )}
      <button
        onClick={() => patch({ isFeatured: !isFeatured })}
        disabled={loading}
        className={`text-xs transition-colors disabled:opacity-50 ${isFeatured ? "text-copper" : "text-[#171717]/40 hover:text-copper"}`}
      >
        {isFeatured ? "Unfeature" : "Feature"}
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
