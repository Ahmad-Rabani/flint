"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlainTestimonial } from "@/features/cms/queries";

type Props = {
  testimonials: PlainTestimonial[];
};

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={cn("h-3.5 w-3.5", i < rating ? "text-copper" : "text-[#1B365D]/15")}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function useVisibleCount() {
  const [visible, setVisible] = useState(1);

  useEffect(() => {
    function update() {
      const width = window.innerWidth;
      if (width >= 1100) setVisible(3);
      else if (width >= 768) setVisible(2);
      else setVisible(1);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return visible;
}

export function TestimonialSlider({ testimonials }: Props) {
  const count = testimonials.length;
  const visible = useVisibleCount();
  const maxIndex = Math.max(0, count - visible);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setIndex((current) => Math.min(current, maxIndex));
  }, [maxIndex]);

  const prev = useCallback(() => {
    setIndex((current) => (current <= 0 ? maxIndex : current - 1));
  }, [maxIndex]);

  const next = useCallback(() => {
    setIndex((current) => (current >= maxIndex ? 0 : current + 1));
  }, [maxIndex]);

  useEffect(() => {
    if (paused || count <= visible) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current >= maxIndex ? 0 : current + 1));
    }, 5200);
    return () => window.clearInterval(id);
  }, [paused, count, visible, maxIndex]);

  if (count === 0) return null;

  const gapPx = 20;
  const slideBasis = `calc((100% - ${(visible - 1) * gapPx}px) / ${visible})`;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div className="flex items-center gap-3 md:gap-4">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous testimonials"
          disabled={count <= visible}
          className="hidden h-12 w-12 shrink-0 cursor-pointer place-items-center border border-[#1B365D]/15 bg-white text-[#1B365D] transition-colors hover:border-copper hover:text-copper disabled:cursor-not-allowed disabled:opacity-35 md:grid"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
        </button>

        <div
          className="min-w-0 flex-1 overflow-hidden"
          onTouchStart={(event) => {
            touchStartX.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            const start = touchStartX.current;
            const end = event.changedTouches[0]?.clientX;
            touchStartX.current = null;
            if (start == null || end == null) return;
            const delta = end - start;
            if (Math.abs(delta) < 48) return;
            if (delta > 0) prev();
            else next();
          }}
        >
          <div
            className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              gap: `${gapPx}px`,
              transform: `translateX(calc(-${index} * (${slideBasis} + ${gapPx}px)))`,
            }}
          >
            {testimonials.map((item, i) => {
              const inView = i >= index && i < index + visible;
              return (
                <figure
                  key={item._id}
                  className={cn(
                    "flex min-h-[16.5rem] shrink-0 flex-col border border-[#1B365D]/10 bg-white p-6 transition-all duration-500 sm:min-h-[18rem] sm:p-7 lg:min-h-[19rem] lg:p-8",
                    inView ? "opacity-100" : "opacity-50",
                  )}
                  style={{ flexBasis: slideBasis, width: slideBasis }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <Quote className="h-7 w-7 text-copper" strokeWidth={1.25} />
                    <RatingStars rating={item.rating} />
                  </div>

                  <blockquote className="mt-5 flex-1 font-heading text-[1.15rem] leading-[1.35] text-[#1B365D] sm:text-[1.3rem] lg:text-[1.4rem]">
                    &ldquo;{item.quote}&rdquo;
                  </blockquote>

                  <figcaption className="mt-6 flex items-center gap-3 border-t border-[#1B365D]/08 pt-5">
                    {item.avatar ? (
                      <Image
                        src={item.avatar.url}
                        alt={item.authorName}
                        width={44}
                        height={44}
                        className="h-11 w-11 object-cover"
                      />
                    ) : (
                      <div className="grid h-11 w-11 place-items-center bg-[#efeae2] font-heading text-base text-copper">
                        {item.authorName.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#1B365D]">{item.authorName}</p>
                      {item.authorTitle && (
                        <p className="mt-0.5 truncate text-xs text-[#1B365D]/45">{item.authorTitle}</p>
                      )}
                    </div>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={next}
          aria-label="Next testimonials"
          disabled={count <= visible}
          className="hidden h-12 w-12 shrink-0 cursor-pointer place-items-center border border-[#1B365D]/15 bg-white text-[#1B365D] transition-colors hover:border-copper hover:text-copper disabled:cursor-not-allowed disabled:opacity-35 md:grid"
        >
          <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>

      <div className="mt-7 flex items-center justify-between gap-4 md:mt-8">
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous testimonials"
            className="grid h-10 w-10 cursor-pointer place-items-center border border-[#1B365D]/15 bg-white text-[#1B365D] transition-colors hover:border-copper hover:text-copper"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next testimonials"
            className="grid h-10 w-10 cursor-pointer place-items-center border border-[#1B365D]/15 bg-white text-[#1B365D] transition-colors hover:border-copper hover:text-copper"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center gap-2">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide group ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1.5 cursor-pointer rounded-full transition-all duration-500",
                i === index ? "w-8 bg-copper" : "w-2 bg-[#1B365D]/20 hover:bg-[#1B365D]/40",
              )}
            />
          ))}
        </div>

        <p className="hidden text-[10px] uppercase tracking-[0.2em] text-[#1B365D]/40 sm:block">
          {String(index + 1).padStart(2, "0")} / {String(maxIndex + 1).padStart(2, "0")}
        </p>
      </div>
    </div>
  );
}
