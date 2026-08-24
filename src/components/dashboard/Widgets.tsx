"use client";

import LeagueWidget from "@/components/dashboard/LeagueWidget";

export type WordOfTheDay = {
  word: string;
  roman: string;
  mean: string;
  exKr: string;
  exEn: string;
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
      className={`relative bg-white border border-[#E3DDD0] px-[18px] py-4 shadow-[0_10px_22px_-14px_rgba(60,50,30,.3)] ${
        index % 2 ? "rotate-[-0.8deg]" : "rotate-[0.8deg]"
      }`}
    >
      <span
        aria-hidden="true"
        className="absolute -top-2 left-1/2 -translate-x-1/2 -rotate-2 w-[46px] h-[15px] border z-10"
        style={TAPES[index % TAPES.length]}
      />
      <div className="flex items-baseline justify-between mb-3">
        <b className="text-[12px] font-extrabold tracking-[.05em] text-[#15803D] uppercase">{title}</b>
        <small className="text-[11.5px] text-[#A19A8C]">{tag}</small>
      </div>
      {children}
    </div>
  );
}

// Weekly grass and the monthly challenge ring used to live here; both were
// absorbed into the Study garden card's headline pills on the main column.
export default function Widgets({ wotd }: { wotd: WordOfTheDay | null }) {
  return (
    <aside className="hidden xl:flex flex-col gap-5 border-l border-dashed border-[#DDD6C8] bg-[#FAF7EF] px-5 py-[26px] sticky top-0 h-screen overflow-y-auto">
      {wotd && (
        <WCard title="Word of the day" tag="단어" index={0}>
          <p className="kr text-2xl mb-0.5">{wotd.word}</p>
          <p className="text-[12.5px] text-[#A19A8C] mb-1.5">{wotd.roman}</p>
          <p className="text-[13.5px] text-[#6B6560] mb-2.5">{wotd.mean}</p>
          <div className="bg-[#FAF7EF] rounded-[9px] px-3 py-[9px] text-[12.5px] text-[#6B6560]">
            <span className="kr block text-[13.5px] text-[#18181B] mb-px">{wotd.exKr}</span>
            {wotd.exEn}
          </div>
        </WCard>
      )}

      <WCard title="Weekly league" tag="🏆" index={1}>
        <LeagueWidget />
      </WCard>
    </aside>
  );
}
