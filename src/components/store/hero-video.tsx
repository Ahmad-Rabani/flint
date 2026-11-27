"use client";

import { useEffect, useRef } from "react";

type Props = {
  poster?: string;
  src?: string;
};

export function HeroVideo({
  poster = "/images/products/damascus-blade.jpg",
  src = "/videos/hero-blades.mp4",
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.playbackRate = 1.05;
    const play = () => {
      void el.play().catch(() => {
        /* autoplay can fail; poster remains */
      });
    };
    play();
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-ink">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full scale-105 object-cover contrast-[1.08] saturate-[1.15] brightness-[0.92] motion-safe:animate-[hero-drift_22s_ease-in-out_infinite_alternate]"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={poster}
        aria-hidden
      >
        <source src={src} type="video/mp4" />
      </video>

      {/* Cinematic navy frame — keep forge heat visible through the middle/right */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-ink/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/65 via-transparent to-transparent" />

      {/* Ember glow — brand orange heat at the forge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_55%,rgba(255,107,0,0.28),transparent_52%)] mix-blend-screen"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 bottom-0 h-[55%] w-[70%] bg-[radial-gradient(ellipse_at_center,rgba(255,107,0,0.16),transparent_65%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 82%, rgba(255,107,0,0.35), transparent 18%), radial-gradient(circle at 72% 48%, rgba(255,180,80,0.18), transparent 22%)",
        }}
      />
    </div>
  );
}
