import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Polaroid from "@/components/landing/Polaroid";
import LevelCreature from "@/components/dashboard/LevelCreature";
import TryIt from "@/components/landing/TryIt";
import type { CefrLevel } from "@/lib/tree";

// A loose, playful cluster rather than the A1→C2 growth ladder Growth.tsx
// already shows further down — six different-sized trees sharing one yard,
// each popping up on its own beat (see .tree-garden in globals.css). Three
// size tiers (not just one breakpoint) because the corner polaroids appear
// at sm and stay fairly wide through the whole 640–1023 range, so the row
// has to stay small until md and only reaches full size at lg.
const GARDEN: { level: CefrLevel; cls: string; d: number; lift: number }[] = [
  { level: "A1", cls: "w-[26px] md:w-[38px] lg:w-[58px]", d: 0.1, lift: 0 },
  { level: "B1", cls: "w-[42px] md:w-[60px] lg:w-[92px]", d: 0.34, lift: 8 },
  { level: "A2", cls: "w-[31px] md:w-[44px] lg:w-[66px]", d: 0.22, lift: -4 },
  { level: "C2", cls: "w-[64px] md:w-[92px] lg:w-[142px]", d: 0.7, lift: 6 },
  { level: "B2", cls: "w-[55px] md:w-[78px] lg:w-[122px]", d: 0.46, lift: -7 },
  { level: "C1", cls: "w-[52px] md:w-[74px] lg:w-[116px]", d: 0.58, lift: 3 },
];

export default function Hero() {
  const t = useTranslations("landing.hero");
  return (
    <header className="relative overflow-hidden bg-cream text-center px-6 pt-[clamp(56px,9vw,96px)] pb-[clamp(72px,10vw,120px)]">
      {/* giant hangul letterforms in the paper */}
      <span aria-hidden="true" className="absolute font-black text-[#F0EBDD] leading-none select-none top-[12px] left-[38%] text-[clamp(90px,15vw,170px)]">
        한
      </span>
      <span aria-hidden="true" className="absolute font-black text-[#F0EBDD] leading-none select-none bottom-[-26px] right-[36%] text-[clamp(72px,12vw,140px)]">
        글
      </span>

      {/* polaroids framing the copy on all sides */}
      <Polaroid scene="hanok" caption={t("photos.hanok")} tape="blue" className="hidden sm:block absolute left-[2%] top-[52px] w-[166px] h-[156px] -rotate-6" />
      <Polaroid scene="night" caption={t("photos.night")} tape="yellow" className="hidden sm:block absolute left-[6%] bottom-[44px] w-[148px] h-[140px] rotate-3" />
      <Polaroid scene="food" caption={t("photos.food")} tape="pink" className="hidden sm:block absolute right-[2%] top-[46px] w-[170px] h-[158px] rotate-6" />
      <Polaroid scene="cafe" caption={t("photos.cafe")} tape="blue" className="hidden sm:block absolute right-[6%] bottom-[38px] w-[148px] h-[140px] -rotate-3" />

      <div className="relative z-10 max-w-[760px] mx-auto">
        {/* a preview of the garden every lesson grows — full story in Growth */}
        <div
          aria-hidden="true"
          className="tree-garden relative z-20 flex justify-center items-end gap-1 md:gap-1.5 lg:gap-2 mb-2 mx-auto w-fit max-w-full"
        >
          <span
            aria-hidden="true"
            className="absolute inset-x-2 bottom-1 h-5 rounded-[50%] bg-success-bg/70 blur-md"
          />
          {GARDEN.map(({ level, cls, d, lift }) => (
            // Outer div carries the per-tree height offset via margin (not
            // transform) so it doesn't fight the .tree class's own
            // transform-based pop-up animation, which is driven purely by
            // --d/CSS below.
            <div key={level} style={{ marginBottom: `${lift}px` }}>
              <div className="tree relative" style={{ "--d": `${d}s` } as React.CSSProperties}>
                <svg viewBox="0 0 220 230" className={`block aspect-[220/230] ${cls}`}>
                  <LevelCreature level={level} />
                </svg>
              </div>
            </div>
          ))}
        </div>

        <h1
          className="reveal font-black text-[clamp(30px,4.6vw,48px)] leading-[1.24] tracking-[-0.02em] text-charcoal mb-3.5 text-balance"
          style={{ "--rd": "0.1s" } as React.CSSProperties}
        >
          {t("titleLine1")}
          <br />
          <mark
            className="text-inherit px-0.5"
            style={{ background: "linear-gradient(transparent 62%, #BBF7D0 62%)" }}
          >
            {t("titleHighlight")}
          </mark>
        </h1>
        <p
          className="reveal text-[14.5px] text-muted max-w-[44ch] mx-auto"
          style={{ "--rd": "0.22s" } as React.CSSProperties}
        >
          {t("sub")}
        </p>

        {/* try a word and a sentence before signing up for anything — the
            static pronunciation/writing previews that used to sit further
            down the page were replaced by this live pair (2026-09-04) */}
        <TryIt />

        <Link
          href="/onboarding"
          className="reveal inline-block rounded-[10px] bg-success px-[28px] py-[13px] text-[14.5px] font-bold text-white shadow-[0_6px_0_#2E5B41] hover:translate-y-[2px] hover:shadow-[0_4px_0_#2E5B41] transition-all"
          style={{ "--rd": "0.34s" } as React.CSSProperties}
        >
          {t("cta")}
        </Link>
        <p
          className="reveal mt-3.5 text-[12.5px] italic text-[#8A8478]"
          style={{ "--rd": "0.44s" } as React.CSSProperties}
        >
          {t("note")}
        </p>
      </div>
    </header>
  );
}
