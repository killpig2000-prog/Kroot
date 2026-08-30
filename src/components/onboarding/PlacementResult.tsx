"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Pot from "@/components/onboarding/Pot";
import { LEVEL_ORDER } from "@/lib/tree";
import { GOALS, QUESTION_TYPES, type FirstLesson, type Placement } from "@/lib/level-test";
import { BTN_BIG, CARD, EYEBROW, FADE, H1, SUB } from "./styles";

export function FirstLessonList({ lessons, title, goalLine }: { lessons: FirstLesson[]; title: string; goalLine?: string }) {
  const ts = useTranslations("onboarding.skills");
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
              {ts(l.skill)} · {ts("minutes", { n: l.minutes })}
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
  const t = useTranslations("onboarding.result");
  const tg = useTranslations("onboarding.goals");
  const tl = useTranslations("onboarding.levels");
  const tt = useTranslations("onboarding.types");
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGrown(true), 250);
    return () => clearTimeout(t);
  }, []);

  const hangul = placement.route === "hangul";
  const tested = !placement.skipped;
  const goal = GOALS.find((g) => g.key === placement.goal);
  const goalLine = goal
    ? t(hangul ? `goalLineHangul.${goal.lead}` : `goalLine.${goal.lead}`, { icon: goal.icon, label: tg(`${goal.key}.label`) })
    : undefined;
  const first = lessons[0];

  return (
    <section className={FADE}>
      <div className={`${CARD} text-center`}>
        <h1 className={H1}>{hangul ? t("titleHangul") : t("title")}</h1>
        <p className={SUB}>
          {hangul ? t("subHangul") : t("sub")}
        </p>

        <Pot grown={grown} />

        <span className={`${EYEBROW} mb-3`}>{t("yourLevel")}</span>
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
                  <b className="text-left">{tt(k)}</b>
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
            ? `${t("stoppedAt", { level: placement.stoppedAt })} `
            : ""}
          {tl(placement.level)}
        </p>

        <FirstLessonList lessons={lessons} title={t("firstThree")} goalLine={goalLine} />

        <button type="button" className={`${BTN_BIG} w-full`} onClick={onContinue} disabled={busy}>
          {busy ? t("saving") : signedIn ? t("startLesson") : t("saveAndStart")}
        </button>
        <p className="text-[12px] text-faint mt-2.5">
          {signedIn ? (first ? t("upNext", { label: first.label }) : "") : t("takes")}
        </p>
      </div>
    </section>
  );
}
