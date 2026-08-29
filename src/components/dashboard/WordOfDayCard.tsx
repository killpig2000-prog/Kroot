import type { WordOfTheDay } from "@/components/dashboard/Widgets";

// The rail's "Word of the day" note, inlined into the main column on screens
// too narrow for the rail (< xl). Same washi-tape sticker as the rail card so
// a phone shows the same object a desktop does, not a plainer stand-in.
export default function WordOfDayCard({ wotd, className = "" }: { wotd: WordOfTheDay; className?: string }) {
  return (
    <div className={`relative bg-white border border-line rounded-[14px] px-[22px] py-5 mb-[30px] shadow-[0_10px_22px_-14px_rgba(60,50,30,.3)] ${className}`}>
      <span
        aria-hidden="true"
        className="absolute -top-2 left-6 -rotate-3 w-[46px] h-[15px] border z-10"
        style={{ background: "rgba(251,207,232,.6)", borderColor: "rgba(230,150,190,.45)" }}
      />
      <div className="flex items-baseline justify-between mb-3">
        <b className="text-[12px] font-extrabold tracking-[.05em] text-success-deep uppercase">Word of the day</b>
        <small className="text-[11.5px] text-faint">단어</small>
      </div>
      <p className="kr text-2xl mb-0.5">{wotd.word}</p>
      <p className="text-[12.5px] text-faint mb-1.5">{wotd.roman}</p>
      <p className="text-[13.5px] text-muted mb-2.5">{wotd.mean}</p>
      <div className="bg-warm rounded-[9px] px-3 py-[9px] text-[12.5px] text-muted">
        <span className="kr block text-[13.5px] text-charcoal mb-px">{wotd.exKr}</span>
        {wotd.exEn}
      </div>
    </div>
  );
}
