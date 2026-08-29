"use client";

import { useEffect, useState } from "react";
import Pot from "@/components/onboarding/Pot";
import { LEVEL_ORDER } from "@/lib/tree";
import { GOALS, QUESTION_TYPES, levelByCode, type FirstLesson, type LeadSkill, type Placement } from "@/lib/level-test";
import { BTN_BIG, CARD, EYEBROW, FADE, H1, SUB } from "./styles";

const LEAD_PHRASE: Record<LeadSkill, string> = {
  listening: "we start with listening",
  words: "we start with words",
  grammar: "we start with grammar",
};

const SKILL_LABEL: Record<FirstLesson["skill"], string> = {
  hangul: "Hangul",
  grammar: "Grammar",
  words: "Words",
  listening: "Listening",
};

export function FirstLessonList({ lessons, title, goalLine }: { lessons: FirstLesson[]; title: string; goalLine?: string }) {
  return (
    <div className="text-left border border-line rounded-[12px] bg-warm px-3.5 py-3 mb-[18px]">
      <span className={`${EYEBROW} mb-2`}>{title}</span>
      <ol className="grid gap-[7px] list-none m-0 p-0">
        {lessons.map((l, i) => (
          <li key={l.href} className="grid grid-cols-[26px_1fr] sm:grid-cols-[26px_1fr_auto] gap-x-2.5 gap-y-0.5 items-center text-[13.5px]">
            <span
              className={`row-span-2 sm:row-span-1 w-[26px] h-[26px] rounded-lg border flex items-center justify-center text-[12px] font-extrabold ${
                i === 0 ? "bg-success border-success text-white" : "bg-cream border-line text-success"
              }`}
            >
              {i + 1}
            </span>
            <span className="min-w-0 text-charcoal leading-[1.35]">{l.label}</span>
            <small className="text-faint text-[12px] whitespace-nowrap sm:text-right">
              {SKILL_LABEL[l.skill]} · {l.minutes} min
            </small>
          </li>
        ))}
      </ol>
      {goalLine && <p className="mt-2.5 mb-0 text-[12.5px] text-muted">{goalLine}</p>}
    </div>
  );
}

// Step 4 — the level, what it means, and the first three lessons. The CTA
// saves straight away for a signed-in learner and opens sign-up otherwise.
export default function PlacementResult({
  placement,
  lessons,
  signedIn,
  busy,
  onContinue,
}: {
  placement: Placement;
  lessons: FirstLesson[];
  signedIn: boolean;
  busy: boolean;
  onContinue: () => void;
}) {
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGrown(true), 250);
    return () => clearTimeout(t);
  }, []);

  const hangul = placement.route === "hangul";
  const tested = !placement.skipped;
  const goal = GOALS.find((g) => g.key === placement.goal);
  const goalLine = goal
    ? hangul
      ? `${goal.icon} ${goal.label} — ${goal.lead} comes right after Hangul.`
      : `${goal.icon} ${goal.label} — so ${LEAD_PHRASE[goal.lead]}.`
    : undefined;
  const first = lessons[0];

  return (
    <section className={FADE}>
      <div className={`${CARD} text-center`}>
        <h1 className={H1}>{hangul ? "Let's start with Hangul" : "Your seed is planted"}</h1>
        <p className={SUB}>
          {hangul
            ? "You'll read Korean in about two lessons. Then everything else opens up."
            : "Here's where your Korean begins."}
        </p>

        <Pot grown={grown} />

        <span className={`${EYEBROW} mb-3`}>Your level</span>
        <div className="flex gap-1.5 justify-center flex-wrap mb-4">
          {LEVEL_ORDER.map((code) => (
            <span
              key={code}
              className={`rounded-[9px] px-3.5 py-1.5 text-[13px] font-semibold border ${
                code === placement.level ? "bg-success border-success text-white" : "bg-cream border-line text-faint"
              }`}
            >
              {code}
            </span>
          ))}
        </div>

        {tested && (
          <div className="grid gap-2 max-w-[360px] mx-auto mb-[18px]">
            {QUESTION_TYPES.map((k) => {
              const [hit, seen] = placement.skills[k];
              const pct = seen ? Math.round((hit / seen) * 100) : 0;
              return (
                <div key={k} className="grid grid-cols-[72px_1fr_34px] items-center gap-2.5 text-[13px]">
                  <b className="text-left">{k}</b>
                  <span className="h-[9px] rounded-full bg-line overflow-hidden">
                    <span className="block h-full rounded-full bg-success transition-[width] duration-700" style={{ width: `${pct}%` }} />
                  </span>
                  <em className="not-italic text-right tabular-nums text-muted">{seen ? `${hit}/${seen}` : "—"}</em>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[13px] text-muted max-w-[400px] mx-auto mb-[18px] leading-[1.6]">
          {tested && placement.stoppedAt && placement.stoppedAt !== placement.level
            ? `We stopped at ${placement.stoppedAt} — that's your next goal. `
            : ""}
          {levelByCode(placement.level).desc}
        </p>

        <FirstLessonList lessons={lessons} title="Your first three lessons" goalLine={goalLine} />

        <button type="button" className={`${BTN_BIG} w-full`} onClick={onContinue} disabled={busy}>
          {busy ? "Saving your level…" : signedIn ? "Start lesson 1" : "Save my level & start lesson 1"}
        </button>
        <p className="text-[12px] text-faint mt-2.5">
          {signedIn ? (first ? `Up next: ${first.label}` : "") : "Takes 20 seconds · free forever, no card"}
        </p>
      </div>
    </section>
  );
}
