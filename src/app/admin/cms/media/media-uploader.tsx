"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function MediaUploader() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("files", f));
      fd.append("folder", "general");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      toast.success(`${files.length} file(s) uploaded`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <label className="cursor-pointer inline-block border border-[#1B365D] bg-[#1B365D] px-4 py-2 text-sm text-ivory hover:bg-[#1B365D]/90 transition-colors">
      {uploading ? "Uploading…" : "+ Upload Media"}
      <input
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => handleUpload(e.target.files)}
        disabled={uploading}
      />
    </label>
  );
}
