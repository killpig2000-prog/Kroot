import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Polaroid from "@/components/landing/Polaroid";
import LevelCreature from "@/components/dashboard/LevelCreature";
import type { CefrLevel } from "@/lib/tree";

// A loose, playful cluster rather than the A1→C2 growth ladder Growth.tsx
// already shows further down — six different-sized trees sharing one yard,
// each popping up on its own beat (see .tree-garden in globals.css). Three
// size tiers (not just one breakpoint) because the corner polaroids appear
// at sm and stay fairly wide through the whole 640–1023 range, so the row
// has to stay small until md and only reaches full size at lg.
const GARDEN: { level: CefrLevel; cls: string; d: number }[] = [
  { level: "A1", cls: "w-[18px] md:w-[26px] lg:w-[42px]", d: 0.1 },
  { level: "B1", cls: "w-[29px] md:w-[42px] lg:w-[68px]", d: 0.34 },
  { level: "A2", cls: "w-[21px] md:w-[30px] lg:w-[48px]", d: 0.22 },
  { level: "C2", cls: "w-[46px] md:w-[67px] lg:w-[108px]", d: 0.7 },
  { level: "B2", cls: "w-[39px] md:w-[57px] lg:w-[92px]", d: 0.46 },
  { level: "C1", cls: "w-[37px] md:w-[54px] lg:w-[88px]", d: 0.58 },
];

export default function Hero() {
  const t = useTranslations("landing.hero");
  return (
    <header className="relative overflow-hidden bg-cream text-center px-6 pt-[clamp(56px,9vw,96px)] pb-[clamp(72px,10vw,120px)]">
      {/* giant hangul letterforms in the paper */}
      <span aria-hidden="true" className="absolute font-black text-[#F0EBDD] leading-none select-none top-[-20px] left-[38%] text-[clamp(90px,15vw,170px)]">
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

      <div className="relative z-10 max-w-[540px] mx-auto">
        <h1 className="font-black text-[clamp(30px,4.6vw,48px)] leading-[1.24] tracking-[-0.02em] text-charcoal mb-3.5 text-balance">
          {t("titleLine1")}
          <br />
          <mark
            className="text-inherit px-0.5"
            style={{ background: "linear-gradient(transparent 62%, #BBF7D0 62%)" }}
          >
            {t("titleHighlight")}
          </mark>
        </h1>
        <p className="text-[14.5px] text-muted max-w-[44ch] mx-auto mb-6">
          {t("sub")}
        </p>
        <Link
          href="/onboarding"
          className="inline-block rounded-[10px] bg-success px-[28px] py-[13px] text-[14.5px] font-bold text-white shadow-[0_6px_0_#2E5B41] hover:translate-y-[2px] hover:shadow-[0_4px_0_#2E5B41] transition-all"
        >
          {t("cta")}
        </Link>
        <p className="mt-3.5 text-[12.5px] italic text-[#8A8478]">
          {t("note")}
        </p>

        {/* a preview of the garden every lesson grows — full story in Growth */}
        <div
          aria-hidden="true"
          className="tree-garden relative z-10 flex justify-center items-end gap-1 md:gap-1.5 lg:gap-2 mt-9 mx-auto w-fit max-w-full"
        >
          <span
            aria-hidden="true"
            className="absolute inset-x-2 bottom-1 h-5 rounded-[50%] bg-success-bg/70 blur-md"
          />
          {GARDEN.map(({ level, cls, d }) => (
            <div key={level} className="tree relative" style={{ "--d": `${d}s` } as React.CSSProperties}>
              <svg viewBox="0 0 220 230" className={`block aspect-[220/230] ${cls}`}>
                <LevelCreature level={level} />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
