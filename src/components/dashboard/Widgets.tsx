"use client";

import Link from "next/link";
import LeagueWidget from "@/components/dashboard/LeagueWidget";
import QuestButton from "@/components/dashboard/QuestButton";
import { OPEN_FEEDBACK_EVENT } from "@/components/dashboard/FeedbackWidget";

export type WordOfTheDay = {
  word: string;
  roman: string;
  mean: string;
  exKr: string;
  exEn: string;
};

export type QuestInfo = {
  skill_key: string;
  title: string;
  description: string;
  completed_at: string | null;
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
// The daily quest and slang cards live here on xl+ (and inline on smaller
// screens) so the garden stays above the fold.
export default function Widgets({
  wotd,
  quest,
  slang,
}: {
  wotd: WordOfTheDay | null;
  quest?: QuestInfo | null;
  slang?: SlangTeaser | null;
}) {
  return (
    <aside className="hidden xl:flex flex-col gap-5 border-l border-dashed border-[#DDD6C8] bg-[#FAF7EF] px-5 py-[26px] sticky top-0 h-screen overflow-y-auto">
      {quest && (
        <WCard title="Today's quest" tag="✏️" index={0}>
          <p className="text-[13px] text-[#6B6560] mb-3">{quest.description}</p>
          <QuestButton skillKey={quest.skill_key} completed={!!quest.completed_at} />
        </WCard>
      )}

      {slang && (
        <WCard title="Today's slang" tag="💬" index={1}>
          <Link href="/slang" className="block group">
            <p className="kr text-[21px] font-bold text-[#BE185D] mb-0.5">
              {slang.kr}{" "}
              <span className="text-[12px] font-medium text-[#DB2777]">({slang.romanization})</span>
            </p>
            <p className="text-[12.5px] text-[#6B6560] mb-2">{slang.meaning}</p>
            <span className="text-[12.5px] font-semibold text-[#DB2777] transition-transform inline-block group-hover:translate-x-0.5">
              Flip it →
            </span>
          </Link>
        </WCard>
      )}

      {wotd && (
        <WCard title="Word of the day" tag="단어" index={2}>
          <p className="kr text-2xl mb-0.5">{wotd.word}</p>
          <p className="text-[12.5px] text-[#A19A8C] mb-1.5">{wotd.roman}</p>
          <p className="text-[13.5px] text-[#6B6560] mb-2.5">{wotd.mean}</p>
          <div className="bg-[#FAF7EF] rounded-[9px] px-3 py-[9px] text-[12.5px] text-[#6B6560]">
            <span className="kr block text-[13.5px] text-[#18181B] mb-px">{wotd.exKr}</span>
            {wotd.exEn}
          </div>
        </WCard>
      )}

      <WCard title="Weekly league" tag="🏆" index={3}>
        <LeagueWidget />
      </WCard>

      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent(OPEN_FEEDBACK_EVENT))}
        className="flex items-center gap-2.5 border-[1.5px] border-dashed border-[#BBF7D0] bg-[#F0FDF4] rounded-[12px] px-4 py-3 text-left transition-colors hover:bg-[#DCFCE7] group"
      >
        <span className="text-lg flex-none">💌</span>
        <span className="flex-1 min-w-0">
          <b className="block text-[12.5px] font-bold text-[#15803D]">We&apos;re just getting started</b>
          <span className="block text-[12px] text-[#4D7C5F]">Got feedback? We&apos;d love to hear it.</span>
        </span>
        <span className="flex-none text-[12px] font-semibold text-[#16A34A] transition-transform group-hover:translate-x-0.5">
          Go →
        </span>
      </button>
    </aside>
  );
}
