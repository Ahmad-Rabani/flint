"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, Loader2, X, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type ProductImageRef = {
  key: string;
  url: string;
  alt?: string;
};

type Props = {
  images: ProductImageRef[];
  onChange: (images: ProductImageRef[]) => void;
};

export function ProductImageUploader({ images, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
      if (files.length === 0) {
        toast.error("Please choose JPEG, PNG, WebP, or GIF images");
        return;
      }

      setUploading(true);
      try {
        const fd = new FormData();
        files.forEach((f) => fd.append("files", f));
        fd.append("folder", "products");

        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");

        const uploaded: ProductImageRef[] = (data.files ?? []).map(
          (f: { key: string; url: string; alt?: string }) => ({
            key: f.key,
            url: f.url,
            alt: f.alt,
          }),
        );

        if (uploaded.length === 0) throw new Error("No files returned from upload");
        onChange([...images, ...uploaded]);
        toast.success(`${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [images, onChange],
  );

  function removeAt(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) void uploadFiles(e.dataTransfer.files);
        }}
        className={cn(
          "border border-dashed px-6 py-10 text-center transition-colors",
          dragOver ? "border-copper bg-copper/5" : "border-[#1B365D]/25 bg-white",
        )}
      >
        <ImagePlus className="mx-auto mb-3 h-8 w-8 text-copper/70" strokeWidth={1.25} />
        <p className="text-sm text-[#1B365D]">
          Drag & drop product photos here, or{" "}
          <button
            type="button"
            className="text-copper underline-offset-2 hover:underline"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            browse files
          </button>
        </p>
        <p className="mt-2 text-xs text-[#1B365D]/45">
          JPEG, PNG, WebP or GIF · up to 8MB each · first image is the primary storefront photo
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="sr-only"
          disabled={uploading}
          onChange={(e) => e.target.files && void uploadFiles(e.target.files)}
        />
        {uploading && (
          <p className="mt-4 inline-flex items-center gap-2 text-xs text-copper">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Uploading…
          </p>
        )}
      </div>

      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img, i) => (
            <li
              key={`${img.key}-${i}`}
              className="group relative aspect-square overflow-hidden border border-[#1B365D]/10 bg-[#f0ece5]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt || `Product image ${i + 1}`} className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute left-2 top-2 bg-ink px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-ivory">
                  Primary
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-ink/70 px-1.5 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  aria-label="Move earlier"
                  className="p-1 text-ivory/80 hover:text-white"
                  onClick={() => move(i, i - 1)}
                >
                  <GripVertical className="h-3.5 w-3.5 rotate-90" />
                </button>
                <button
                  type="button"
                  aria-label="Remove image"
                  className="p-1 text-ivory/80 hover:text-red-300"
                  onClick={() => removeAt(i)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Move later"
                  className="p-1 text-ivory/80 hover:text-white"
                  onClick={() => move(i, i + 1)}
                >
                  <GripVertical className="h-3.5 w-3.5 -rotate-90" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div>
        <p className="mb-1.5 text-xs uppercase tracking-widest text-[#1B365D]/45">
          Or paste image URLs
        </p>
        <input
          className="w-full border border-[#1B365D]/20 bg-white px-3 py-2 text-sm text-[#1B365D] placeholder:text-[#1B365D]/30 focus:border-copper focus:outline-none"
          placeholder="https://example.com/photo.jpg"
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            const input = e.currentTarget;
            const url = input.value.trim();
            if (!url) return;
            onChange([...images, { key: url, url, alt: "Product image" }]);
            input.value = "";
          }}
        />
        <p className="mt-1 text-[11px] text-[#1B365D]/40">Press Enter to add a URL</p>
      </div>
    </div>
  );
}
