"use client";

import { useEffect, useMemo, useState } from "react";
import { SEASONS, type SeasonKey } from "@/lib/seasons";

// Full-screen seasonal layer: a soft color tint (multiply, so white surfaces
// pick up the season's hue) plus drifting particles. Pure CSS animation;
// pointer-events pass straight through and reduced-motion hides particles.

// Soft translucent wash at the top of the viewport — tints without dimming.
const TINTS: Record<SeasonKey, string> = {
  spring: "linear-gradient(180deg, rgba(249,196,212,.10) 0%, rgba(249,196,212,0) 30%)",
  summer: "linear-gradient(180deg, rgba(95,208,176,.08) 0%, rgba(95,208,176,0) 30%)",
  autumn: "linear-gradient(180deg, rgba(239,167,92,.09) 0%, rgba(239,167,92,0) 30%)",
  winter: "linear-gradient(180deg, rgba(158,197,226,.10) 0%, rgba(158,197,226,0) 30%)",
};

const PARTICLE_COUNT = 6;
// Plus members get a denser drift with golden sparkles mixed in.
const PLUS_PARTICLE_COUNT = 14;

export default function SeasonalEffects({
  season,
  initialEnabled,
  plus = false,
}: {
  season: SeasonKey;
  initialEnabled: boolean;
  plus?: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);

  // AccountMenu dispatches this when the toggle flips — fade, don't reload.
  useEffect(() => {
    const onToggle = (e: Event) => setEnabled(Boolean((e as CustomEvent).detail?.enabled));
    window.addEventListener("kroot-season", onToggle);
    return () => window.removeEventListener("kroot-season", onToggle);
  }, []);

  const rise = SEASONS[season].direction === "rise";

  // Deterministic seeds (no randomness) so server and client render the same.
  const seeds = useMemo(() => {
    const { particles } = SEASONS[season];
    const base = rise ? 18 : 11; // bubbles drift up slowly
    const count = plus ? PLUS_PARTICLE_COUNT : PARTICLE_COUNT;
    // Plus mixes a golden sparkle into every fourth particle.
    const pool = plus ? [...particles, "✨"] : particles;
    return Array.from({ length: count }, (_, i) => ({
      left: (i * 97 + 13) % 100,
      dur: base + ((i * 53) % 80) / 10,
      delay: -((i * 31) % 160) / 10,
      char: plus && i % 4 === 3 ? "✨" : pool[i % particles.length],
    }));
  }, [season, rise, plus]);

  return (
    <div
      aria-hidden="true"
      className={`season-layer pointer-events-none fixed inset-0 z-[60] transition-opacity duration-700 ${
        enabled ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="absolute inset-0" style={{ background: TINTS[season] }} />
      {seeds.map((p, i) => (
        <span
          key={i}
          className="absolute text-[13px] opacity-50 season-particle"
          style={{
            left: `${p.left}%`,
            [rise ? "bottom" : "top"]: "-26px",
            animationName: rise ? "seasonRise" : "seasonFall",
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          {p.char}
        </span>
      ))}
    </div>
  );
}
