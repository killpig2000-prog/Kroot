"use client";

import { Link } from "@/i18n/navigation";
import { OPEN_FEEDBACK_EVENT } from "@/components/dashboard/FeedbackWidget";

export type WordOfTheDay = {
  word: string;
  roman: string;
  mean: string;
  exKr: string;
  exEn: string;
};

export type SlangTeaser = {
  kr: string;
  romanization: string;
  meaning: string;
};

const TAPES = [
  { background: "rgba(190,227,248,.65)", borderColor: "rgba(150,200,230,.45)" },
  { background: "rgba(253,230,138,.6)", borderColor: "rgba(217,180,90,.45)" },
  { background: "rgba(251,207,232,.6)", borderColor: "rgba(230,150,190,.45)" },
];

function WCard({ title, tag, index = 0, children }: { title: string; tag: string; index?: number; children: React.ReactNode }) {
  // Notes taped to the rail — alternating tilt and washi-tape color.
  return (
    <div
      className={`relative bg-cream border border-line px-[18px] py-4 shadow-[0_10px_22px_-14px_rgba(60,50,30,.3)] ${
        index % 2 ? "rotate-[-0.8deg]" : "rotate-[0.8deg]"
      }`}
    >
      <span
        aria-hidden="true"
        className="absolute -top-2 left-1/2 -translate-x-1/2 -rotate-2 w-[46px] h-[15px] border z-10"
        style={TAPES[index % TAPES.length]}
      />
      <div className="flex items-baseline justify-between mb-3">
        <b className="text-[12px] font-extrabold tracking-[.05em] text-success-deep uppercase">{title}</b>
        <small className="text-[11.5px] text-faint">{tag}</small>
      </div>
      {children}
    </div>
  );
}

// Weekly grass and the monthly challenge ring used to live here; both were
// absorbed into the Study garden card's headline pills on the main column.
// Today's quest used to have its own card here too, but that duplicated the
// one always-visible quest card on the main column (this rail only shows on
// xl+ screens) — it now lives solely there. Slang and the word of the day
// stay here on xl+ (and inline on smaller screens) so the garden stays above
// the fold.
export default function Widgets({
  wotd,
  slang,
}: {
  wotd: WordOfTheDay | null;
  slang?: SlangTeaser | null;
}) {
  return (
    <aside className="hidden xl:flex flex-col gap-5 border-l border-dashed border-dash bg-warm px-5 py-[26px] sticky top-0 h-screen overflow-y-auto">
      {slang && (
        <WCard title="Today's slang" tag="💬" index={0}>
          <Link href="/slang" className="block group">
            <p className="kr text-[21px] font-bold text-[#AF3166] mb-0.5">
              {slang.kr}{" "}
              <span className="text-[12px] font-medium text-[#C13E78]">({slang.romanization})</span>
            </p>
            <p className="text-[12.5px] text-muted mb-2">{slang.meaning}</p>
            <span className="text-[12.5px] font-semibold text-[#C13E78] transition-transform inline-block group-hover:translate-x-0.5">
              Flip it →
            </span>
          </Link>
        </WCard>
      )}

      {wotd && (
        <WCard title="Word of the day" tag="📖" index={1}>
          <p className="kr text-2xl mb-0.5">{wotd.word}</p>
          <p className="text-[12.5px] text-faint mb-1.5">{wotd.roman}</p>
          <p className="text-[13.5px] text-muted mb-2.5">{wotd.mean}</p>
          <div className="bg-warm rounded-[9px] px-3 py-[9px] text-[12.5px] text-muted">
            <span className="kr block text-[13.5px] text-charcoal mb-px">{wotd.exKr}</span>
            {wotd.exEn}
          </div>
        </WCard>
      )}

      {/* The launch notice already asks for feedback once per day; a second
          card here made the same request twice on one screen. One quiet link. */}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent(OPEN_FEEDBACK_EVENT))}
        className="mt-auto self-start text-[12px] font-semibold text-faint hover:text-muted transition-colors"
      >
        Send feedback →
      </button>
    </aside>
  );
}
