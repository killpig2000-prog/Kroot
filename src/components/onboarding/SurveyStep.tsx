"use client";

import { useTranslations } from "next-intl";
import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";
import { SURVEY_KEYS } from "@/lib/level-test";
import { BTN_GHOST, CARD, EYEBROW, FADE, H1 } from "./styles";

const OPT =
  "grid grid-cols-[30px_1fr] gap-2.5 items-start text-left min-h-[44px] px-[14px] py-[10px] rounded-[10px] text-[14px] border transition-colors";

// Step 3 — three "which sounds like you?" questions, one per screen. The
// question shown is the first one without an answer, so Back (which restores
// the answers from history) walks back question by question.
export default function SurveyStep({
  answers,
  onAnswer,
  onSkip,
}: {
  answers: (CefrLevel | null)[];
  onAnswer: (index: number, level: CefrLevel) => void;
  onSkip: () => void;
}) {
  const t = useTranslations("onboarding.survey");
  const index = Math.max(0, answers.findIndex((a) => a === null));
  const key = SURVEY_KEYS[index];

  return (
    <section key={key} className={FADE}>
      <div className={CARD}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className={EYEBROW}>{t("progress", { n: index + 1, total: SURVEY_KEYS.length })}</span>
          <span className="flex gap-1.5" aria-hidden="true">
            {SURVEY_KEYS.map((k, i) => (
              <span
                key={k}
                className={`w-6 h-[5px] rounded-full ${i < index ? "bg-success" : i === index ? "bg-[var(--sun)]" : "bg-line"}`}
              />
            ))}
          </span>
        </div>
        <h1 className={`${H1} mb-4`}>{t(`${key}.title`)}</h1>
        <div className="grid gap-2">
          {LEVEL_ORDER.map((lv) => {
            const on = answers[index] === lv;
            return (
              <button
                key={lv}
                type="button"
                aria-pressed={on}
                onClick={() => onAnswer(index, lv)}
                className={`${OPT} ${on ? "border-success bg-success-bg" : "bg-cream border-line hover:border-success hover:bg-success-bg"}`}
              >
                <b className="text-[12px] font-extrabold text-faint pt-[2px]">{lv}</b>
                <span className="text-charcoal leading-[1.4]">{t(`${key}.${lv}`)}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[12.5px] text-muted text-center mt-4">{t("changeLater")}</p>
        <button type="button" onClick={onSkip} className={`${BTN_GHOST} block text-center mx-auto mt-3 min-h-[44px]`}>
          {t("skip")}
        </button>
      </div>
    </section>
  );
}
