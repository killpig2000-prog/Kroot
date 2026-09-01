import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonClassName } from "@/components/ui/Button";
import ResultShell, { ResultRing, ResultTag } from "@/components/results/ResultShell";
import { XP_POINTS, type ProgressResult } from "@/lib/activity";
import type { Passage } from "@/lib/reading";
import { getLocalizedQuestion } from "@/lib/reading-i18n";
import type { Gloss } from "@/lib/word-links";

const BTN_BLUE = buttonClassName("sky");
const BTN_INK = buttonClassName("ink");
const BTN_LINE = buttonClassName("line");
const COLOR = "#3363CC";

// The end of a chapter reports the session back: what was missed, what the
// story is worth looking up, and one obvious way onward.
export default function SummaryPhase({
  passage,
  chapterIndex,
  correct,
  incorrect,
  missed,
  words,
  levelUp,
  hasNextChapter,
  level,
  navigating,
  onGoTo,
  onReRead,
}: {
  passage: Passage;
  chapterIndex: number;
  correct: number;
  incorrect: number;
  /** Indexes of the questions answered wrong. */
  missed: number[];
  words: Gloss[];
  levelUp: ProgressResult | null;
  hasNextChapter: boolean;
  level: string;
  navigating: boolean;
  onGoTo: (href: string) => void;
  onReRead: () => void;
}) {
  const t = useTranslations("reading.summary");
  const tn = useTranslations("nav");
  const tu = useTranslations("ui");
  const locale = useLocale();
  const total = passage.questions.length;
  const pct = total ? Math.round((correct / total) * 100) : 100;

  return (
    <ResultShell
      color={COLOR}
      categoryLabel={tn("reading")}
      meta={t("title", { n: chapterIndex + 1 })}
      ring={<ResultRing pct={pct} center={correct} unit={`/${total}`} label={t("questionsRight")} color={COLOR} />}
      headline={t("title", { n: chapterIndex + 1 })}
      tags={
        <>
          {missed.length === 0 ? (
            <ResultTag tone="good">{t("nothingMissed")}</ResultTag>
          ) : (
            <ResultTag tone="warn">{t("missedCount", { n: missed.length })}</ResultTag>
          )}
          {words.length > 0 && <ResultTag>{t("wordsWithPage", { n: words.length })}</ResultTag>}
        </>
      }
      levelUp={levelUp}
      xpValue={XP_POINTS.reading}
      xpLabel={incorrect > 0 ? t("earnedReview", { n: incorrect }) : t("earned")}
      actions={
        <>
          {hasNextChapter && (
            <button
              className={BTN_BLUE}
              onClick={() => onGoTo(`/reading/session?chapter=${chapterIndex + 1}&level=${level}`)}
              disabled={navigating}
            >
              {navigating ? t("saving") : t("nextChapter", { n: chapterIndex + 2 })}
            </button>
          )}
          <button
            className={hasNextChapter ? BTN_LINE : BTN_INK}
            onClick={() => onGoTo(`/reading?level=${level}`)}
            disabled={navigating}
          >
            {navigating ? t("saving") : t("storyMap")}
          </button>
        </>
      }
    >
      {missed.length > 0 && (
        <div>
          <b className="block text-[11.5px] font-bold tracking-[.06em] uppercase text-faint mb-2">
            {t("questionsRight")}
          </b>
          <ul className="grid gap-1.5">
            {missed.map((i) => (
              <li key={i} className="flex gap-2 text-[13px] text-muted leading-snug">
                <span className="text-danger font-bold flex-none">✕</span>
                <span>{getLocalizedQuestion(passage.questions[i], locale)}</span>
              </li>
            ))}
          </ul>
          <button className={`${BTN_LINE} mt-3 w-full text-[13px]`} onClick={onReRead}>
            {t("readAgain")}
          </button>
        </div>
      )}
      {words.length > 0 && (
        <div>
          <b className="block text-[11.5px] font-bold tracking-[.06em] uppercase text-faint mb-2">
            {t("wordsWithPage", { n: words.length })}
          </b>
          <div className="flex flex-wrap gap-1.5">
            {words.slice(0, 10).map((w) => (
              <Link
                key={w.korean}
                href={w.href}
                className="kr text-[13px] font-medium rounded-full px-2.5 py-0.5 bg-warm border border-line hover:border-sky-deep hover:text-sky-deep transition-colors"
              >
                {w.korean}
              </Link>
            ))}
          </div>
          <p className="text-[11.5px] text-faint mt-2">
            {words.length > 10 ? t("openToSaveMore", { n: words.length - 10 }) : t("openToSave")}
          </p>
        </div>
      )}
    </ResultShell>
  );
}
