"use client";

import { useEffect, useState } from "react";

const WORDS = [
  { word: "뿌리", roman: "ppu-ri", mean: "root — the part that grows underground 🌱", exKr: "나무는 뿌리가 튼튼해야 해요.", exEn: "A tree needs strong roots." },
  { word: "새싹", roman: "sae-ssak", mean: "sprout — a brand-new little plant 🌿", exKr: "봄에는 새싹이 돋아나요.", exEn: "Sprouts come up in spring." },
  { word: "열매", roman: "yeol-mae", mean: "fruit — what a tree gives back 🍎", exKr: "노력은 열매를 맺어요.", exEn: "Effort bears fruit." },
  { word: "물방울", roman: "mul-bang-ul", mean: "water drop — small but mighty 💧", exKr: "물방울이 모여 바다가 돼요.", exEn: "Drops gather into a sea." },
  { word: "햇살", roman: "haet-sal", mean: "sunshine — warm rays of light ☀️", exKr: "햇살이 참 따뜻하네요.", exEn: "The sunshine is so warm." },
  { word: "숲", roman: "sup", mean: "forest — many trees together 🌳", exKr: "숲에서 산책하는 걸 좋아해요.", exEn: "I love walking in the forest." },
  { word: "씨앗", roman: "ssi-at", mean: "seed — where everything begins 🌰", exKr: "작은 씨앗이 큰 나무가 돼요.", exEn: "A small seed becomes a big tree." },
];

const FEED = [
  { av: "🦊", text: "What's the difference between 은/는 and 이/가?", meta: "Maria · Brazil · 12 min ago" },
  { av: "🐻", text: "Passed TOPIK Level 3 today!! 🎉", meta: "Kenta · Japan · 1 h ago" },
  { av: "🐰", text: "Looking for a speaking buddy, 30 min/week!", meta: "Amara · Nigeria · 3 h ago" },
];

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

const RING_C = 138.2; // circumference of r=22 circle

function grassClass(minutes: number) {
  if (minutes >= 15) return "bg-[#16A34A] border-[#16A34A] text-white";
  if (minutes >= 8) return "bg-[#86EFAC] border-[#4ADE80] text-[#14532D]";
  if (minutes > 0) return "bg-[#DCFCE7] border-[#BBF7D0] text-[#15803D]";
  return "bg-[#FAFAF9] border-[#E7E5E4] text-[#A1A1AA]";
}

function WCard({ title, tag, children }: { title: string; tag: string; children: React.ReactNode }) {
  return (
    <div className="border border-[#E7E5E4] rounded-[14px] px-[18px] py-4">
      <div className="flex items-baseline justify-between mb-3">
        <b className="text-[13.5px] font-semibold">{title}</b>
        <small className="text-[11.5px] text-[#A1A1AA]">{tag}</small>
      </div>
      {children}
    </div>
  );
}

export default function Widgets({
  weekMinutes,
  weekLabel,
  monthDone,
  monthGoal,
  monthLabel,
  daysLeft,
}: {
  weekMinutes: number[];
  weekLabel: string;
  monthDone: number;
  monthGoal: number;
  monthLabel: string;
  daysLeft: number;
}) {
  const [ringFill, setRingFill] = useState(0);
  const pct = Math.min(100, Math.round((monthDone / monthGoal) * 100));

  useEffect(() => {
    const t = setTimeout(() => setRingFill(pct), 300);
    return () => clearTimeout(t);
  }, [pct]);

  const [dayIndex] = useState(() => Math.floor(Date.now() / 86_400_000) % WORDS.length);
  const wotd = WORDS[dayIndex];
  const wateredDays = weekMinutes.filter((m) => m > 0).length;

  return (
    <aside className="hidden xl:flex flex-col gap-4 border-l border-[#E7E5E4] px-5 py-[26px] sticky top-0 h-screen overflow-y-auto">
      <WCard title="Word of the day" tag="단어">
        <p className="kr text-2xl mb-0.5">{wotd.word}</p>
        <p className="text-[12.5px] text-[#A1A1AA] mb-1.5">{wotd.roman}</p>
        <p className="text-[13.5px] text-[#71717A] mb-2.5">{wotd.mean}</p>
        <div className="bg-[#FAFAF9] rounded-[9px] px-3 py-[9px] text-[12.5px] text-[#71717A]">
          <span className="kr block text-[13.5px] text-[#18181B] mb-px">{wotd.exKr}</span>
          {wotd.exEn}
        </div>
      </WCard>

      <WCard title="This week" tag={weekLabel}>
        <div className="grid grid-cols-7 gap-[5px]">
          {weekMinutes.map((m, i) => (
            <span
              key={i}
              className={`aspect-square rounded-md border flex items-center justify-center text-[10px] font-semibold transition-transform hover:scale-110 ${grassClass(m)}`}
            >
              {DAY_LABELS[i]}
            </span>
          ))}
        </div>
        <p className="text-xs text-[#71717A] mt-2.5">
          <b className="text-[#16A34A]">
            {wateredDays} of 7 days
          </b>{" "}
          watered — {wateredDays >= 7 ? "a full week! 🎉" : "finish today for a full week!"}
        </p>
      </WCard>

      <WCard title={`${monthLabel} challenge`} tag={`D-${daysLeft}`}>
        <div className="flex items-center gap-3">
          <div className="relative w-[52px] h-[52px] flex-none">
            <svg width="52" height="52" viewBox="0 0 52 52" className="-rotate-90">
              <circle cx="26" cy="26" r="22" fill="none" stroke="#E7E5E4" strokeWidth="5" />
              <circle
                cx="26"
                cy="26"
                r="22"
                fill="none"
                stroke="#16A34A"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C * (1 - ringFill / 100)}
                style={{ transition: "stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)" }}
              />
            </svg>
            <b className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#16A34A]">
              {pct}%
            </b>
          </div>
          <p className="text-[12.5px] text-[#71717A]">
            <b className="text-[#18181B]">{monthGoal}-lesson month</b>
            <br />
            {monthDone} done · {Math.max(0, monthGoal - monthDone)} to go
          </p>
        </div>
      </WCard>

      <WCard title="Community" tag="live">
        <div className="flex flex-col">
          {FEED.map((post, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 py-2.5 border-b border-[#E7E5E4] last:border-b-0 last:pb-0 first:pt-0"
            >
              <span className="w-7 h-7 rounded-lg flex-none flex items-center justify-center text-[13px] bg-[#FAFAF9] border border-[#E7E5E4]">
                {post.av}
              </span>
              <div>
                <p className="text-[12.5px] leading-[1.45]">{post.text}</p>
                <small className="text-[11px] text-[#A1A1AA]">{post.meta}</small>
              </div>
            </div>
          ))}
          <button className="w-full text-center text-[12.5px] font-medium text-[#71717A] pt-3 hover:text-[#18181B]">
            Open community →
          </button>
        </div>
      </WCard>
    </aside>
  );
}
