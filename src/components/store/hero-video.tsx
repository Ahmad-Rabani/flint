"use client";

type Props = {
  poster?: string;
};

export function HeroVideo({ poster = "/images/products/tracker-hunter.jpg" }: Props) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <video
        className="absolute inset-0 h-full w-full scale-[1.04] object-cover motion-safe:animate-[hero-drift_28s_ease-in-out_infinite_alternate]"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={poster}
        aria-hidden
      >
        <source src="/videos/hero-forge.mp4" type="video/mp4" />
      </video>

      {/* Readability overlays — keep the forge visible on the right */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/78 to-ink/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/50 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-copper/[0.05] mix-blend-overlay" />
    </div>
  );
}
