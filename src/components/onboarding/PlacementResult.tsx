"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Pot from "@/components/onboarding/Pot";
import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";
import type { FirstLesson, Placement } from "@/lib/level-test";
import { BTN_BIG, CARD, EYEBROW, FADE, H1 } from "./styles";

export function FirstLessonList({ lessons, title }: { lessons: FirstLesson[]; title: string }) {
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
    </div>
  );
}

// Step 4 — the level, what it means, and the first three lessons. The survey
// only suggests: every level chip is tappable, and the pick is what gets
// saved. The CTA saves straight away for a signed-in learner and opens
// sign-up otherwise.
export default function PlacementResult({
  placement,
  lessons,
  signedIn,
  busy,
  onPickLevel,
  onContinue,
}: {
  placement: Placement;
  lessons: FirstLesson[];
  signedIn: boolean;
  busy: boolean;
  onPickLevel: (level: CefrLevel) => void;
  onContinue: () => void;
}) {
  const t = useTranslations("onboarding.result");
  const tl = useTranslations("common.levels");
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGrown(true), 250);
    return () => clearTimeout(t);
  }, []);

  const hangul = placement.route === "hangul";
  const first = lessons[0];

  return (
    <section className={FADE}>
      <div className={`${CARD} text-center`}>
        <h1 className={H1}>{hangul ? t("titleHangul") : t("title")}</h1>

        <Pot grown={grown} />

        <span className={`${EYEBROW} mb-3`}>{t("yourLevel")}</span>
        <div className="flex gap-1.5 justify-center flex-wrap mb-2.5">
          {LEVEL_ORDER.map((code) => {
            const on = code === placement.level;
            return (
              <button
                key={code}
                type="button"
                aria-pressed={on}
                disabled={hangul || busy}
                onClick={() => onPickLevel(code)}
                className={`min-w-[44px] min-h-[44px] rounded-[9px] px-3 text-[13px] font-semibold border transition-colors ${
                  on
                    ? "bg-success border-success text-white"
                    : "bg-cream border-line text-faint enabled:hover:border-success enabled:hover:text-success"
                }`}
              >
                {code}
              </button>
            );
          })}
        </div>

        {!hangul && (
          <p className="text-[13px] text-muted max-w-[400px] mx-auto mb-[18px] leading-[1.6]">
            <b className="text-charcoal">{tl(placement.level)}</b>
            <br />
            {placement.suggested ? t("suggested", { level: placement.suggested }) : t("pickHint")}
          </p>
        )}

        <FirstLessonList lessons={lessons} title={t("firstThree")} />

        <button type="button" className={`${BTN_BIG} w-full`} onClick={onContinue} disabled={busy}>
          {busy ? t("saving") : signedIn ? t("startLesson") : t("saveAndStart")}
        </button>
        {signedIn && first && <p className="text-[12px] text-faint mt-2.5">{t("upNext", { label: first.label })}</p>}
      </div>
    </section>
  );
}
