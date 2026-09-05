import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import ReviewCapacityButton from "@/components/profile/ReviewCapacityButton";

// "Words to review" — the only word card on My account (2026-08-30).
//
// It deliberately shows NO collection health: no box distribution, no
// New/Learning/Known meter, no intervals. It used to also list the actual
// due words (Korean + meaning) — removed 2026-09-05: /review is a
// multiple-choice recall quiz, and seeing the word (and its meaning) here
// first is seeing the answer before taking it. The card now says only how
// many are due and lets the learner set their daily capacity; the words
// themselves are only ever revealed inside the quiz.

export default async function WordsToReview({
  dueCount,
  nextReturn,
  capacityBonus,
}: {
  dueCount: number;
  /** already-formatted relative time of the next word coming back, when nothing is due */
  nextReturn: string | null;
  /** how many extra daily review slots this account has set — see lib/srs.ts */
  capacityBonus: number;
}) {
  const t = await getTranslations("ui.account");

  return (
    <div className="border border-line rounded-[14px] bg-cream px-[22px] py-5">
      <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
        <b className="font-semibold text-[15px]">{t("wordsToReview")}</b>
        {dueCount > 0 && (
          <small className="text-[12.5px] text-faint font-medium tabular-nums">
            {t("dueCount", { count: dueCount })}
          </small>
        )}
      </div>

      {dueCount === 0 ? (
        <p className="text-[13px] text-muted">{nextReturn ? t("nothingDue", { when: nextReturn }) : t("nothingDuePlain")}</p>
      ) : (
        <Link
          href="/review"
          className="inline-block text-[13px] font-semibold text-success hover:translate-x-0.5 transition-transform"
        >
          {t("reviewDue", { count: dueCount })} →
        </Link>
      )}

      <ReviewCapacityButton capacityBonus={capacityBonus} />
    </div>
  );
}
