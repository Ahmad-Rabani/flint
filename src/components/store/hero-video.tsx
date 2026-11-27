"use client";

type Props = {
  poster?: string;
};

export function HeroVideo({ poster = "/images/products/tracker-hunter.jpg" }: Props) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <video
        className="absolute inset-0 h-full w-full object-cover scale-[1.03]"
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
      {/* Cinematic overlays for readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/20" />
      <div className="absolute inset-0 bg-copper/[0.06] mix-blend-overlay" />
    </div>
  );
}
