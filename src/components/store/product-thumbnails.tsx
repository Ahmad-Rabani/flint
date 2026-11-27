"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  images: { key: string; url: string; alt?: string }[];
  name: string;
};

export function ProductThumbnails({ images, name }: Props) {
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-3">
      {/* Large active preview */}
      <div className="relative aspect-square bg-muted overflow-hidden image-zoom">
        <Image
          src={images[active].url}
          alt={images[active].alt ?? name}
          fill
          className="object-cover transition-opacity duration-300"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>
      {/* Thumbnail strip */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((img, i) => (
          <button
            key={img.key}
            onClick={() => setActive(i)}
            aria-label={`Image ${i + 1}`}
            className={cn(
              "flex-shrink-0 w-16 h-16 relative overflow-hidden border-2 transition-all",
              active === i ? "border-copper" : "border-transparent opacity-60 hover:opacity-100",
            )}
          >
            <Image
              src={img.url}
              alt={img.alt ?? name}
              fill
              className="object-cover"
              sizes="64px"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
