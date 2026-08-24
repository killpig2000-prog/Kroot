"use client";

import Link from "next/link";

export type WordOfTheDay = {
  word: string;
  roman: string;
  mean: string;
  exKr: string;
  exEn: string;
};

export type FeedItem = { av: string; text: string; meta: string };

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
export default function Widgets({
  wotd,
  feed,
}: {
  wotd: WordOfTheDay | null;
  feed: FeedItem[];
}) {
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

      <WCard title="Community" tag="recent" index={1}>
        <div className="flex flex-col">
          {feed.length === 0 && (
            <p className="text-[12.5px] text-[#6B6560] py-1">
              No posts yet — be the first to say hi 👋
            </p>
          )}
          {feed.map((post, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 py-2.5 border-b border-[#E3DDD0] last:border-b-0 last:pb-0 first:pt-0"
            >
              <span className="w-7 h-7 rounded-lg flex-none flex items-center justify-center text-[13px] bg-[#FAF7EF] border border-[#E3DDD0]">
                {post.av}
              </span>
              <div>
                <p className="text-[12.5px] leading-[1.45]">{post.text}</p>
                <small className="text-[11px] text-[#A19A8C]">{post.meta}</small>
              </div>
            </div>
          ))}
          <Link
            href="/community"
            className="w-full text-center text-[12.5px] font-medium text-[#6B6560] pt-3 hover:text-[#18181B]"
          >
            Open community →
          </Link>
        </div>
      </WCard>
    </aside>
  );
}
