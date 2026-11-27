"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function RowDeleteAction({
  id,
  name,
  endpoint,
  confirmMessage,
}: {
  id: string;
  name: string;
  endpoint: string;
  confirmMessage?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const msg = confirmMessage ?? `Delete "${name}"? This cannot be undone.`;
    if (!confirm(msg)) return;
    setLoading(true);
    try {
      const res = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Delete failed");
      }
      toast.success(`"${name}" deleted`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
    >
      {loading ? "…" : "Delete"}
    </button>
  );
}
