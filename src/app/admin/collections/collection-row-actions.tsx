"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function CollectionRowActions({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete collection "${name}"?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/collections/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Collection deleted");
      router.refresh();
    } catch {
      toast.error("Delete failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50">
      {loading ? "…" : "Delete"}
    </button>
  );
}
