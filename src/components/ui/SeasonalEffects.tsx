"use client";

import { useMemo, useSyncExternalStore } from "react";
import { SEASONS, SEASON_COOKIE, seasonForDate, type SeasonKey } from "@/lib/seasons";

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

// The two values this layer needs — the wall clock and a cookie the
// AccountMenu toggle writes — both live outside React, so they are read
// through useSyncExternalStore.

const SEASON_ON = new RegExp(`(?:^|;\\s*)${SEASON_COOKIE}=on`);

// AccountMenu writes the cookie and then dispatches this, so re-reading the
// cookie on the event is enough — the layer fades rather than reloading.
function subscribeToggle(onChange: () => void) {
  window.addEventListener("kroot-season", onChange);
  return () => window.removeEventListener("kroot-season", onChange);
}

function noopSubscribe() {
  return () => {};
}

// Resolves its own season and on/off state on the client rather than taking
// them as props.
//
// The root layout used to read the season cookie with `await cookies()` and
// pass the result down, which opted every route in the app into dynamic
// rendering for the sake of a decorative overlay. It also meant `season` was
// computed by `seasonForDate(new Date())` at render — fine while every page
// was dynamic, but frozen at build time the moment any of them went static.
//
// Reading it here fixes both: the layout stays static, and the season is
// whatever it is when the visitor actually loads the page.
export default function SeasonalEffects() {
  // Server snapshots are null/false: there is no cookie and no clock to read
  // during prerender, so the layer renders nothing and fades in on hydration.
  // It is decorative, so arriving a frame late is invisible.
  const season = useSyncExternalStore<SeasonKey | null>(
    noopSubscribe,
    () => seasonForDate(new Date()),
    () => null,
  );
  const enabled = useSyncExternalStore(
    subscribeToggle,
    // This snapshot runs during render, so a throw here takes the whole page
    // down to the error boundary — and document.cookie can throw outright when
    // site data is blocked (private windows, sandboxed frames, strict
    // enterprise policies). A decorative layer must never be able to do that.
    () => {
      try {
        return SEASON_ON.test(document.cookie);
      } catch {
        return false;
      }
    },
    () => false,
  );

  const rise = season ? SEASONS[season].direction === "rise" : false;

  // Deterministic seeds (no randomness) so repeated renders agree.
  const seeds = useMemo(() => {
    if (!season) return [];
    const { particles } = SEASONS[season];
    const base = rise ? 18 : 11; // bubbles drift up slowly
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      left: (i * 97 + 13) % 100,
      dur: base + ((i * 53) % 80) / 10,
      delay: -((i * 31) % 160) / 10,
      char: particles[i % particles.length],
    }));
  }, [season, rise]);

  if (!season) return null;

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
