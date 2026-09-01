import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import ReviewCapacityButton from "@/components/profile/ReviewCapacityButton";

// "Words to review" — the only word card on My account (2026-08-30).
//
// It deliberately shows NO collection health: no box distribution, no
// New/Learning/Known meter, no intervals. The learner asked for exactly one
// thing here — "복습이 필요한 단어만 관리하는 부분" — so the card lists the words
// that are due and nothing else. Anything else on this page would be a
// statistic they can't act on.

export type DueWord = {
  korean: string;
  meaning: string | null;
  slug: string | null;
  /** > 0 → "missed n×", otherwise the row is here only because it came due */
  misses: number;
};

export default async function WordsToReview({
  words,
  dueCount,
  nextReturn,
  capacityBonus,
}: {
  words: DueWord[]; // hardest first, already capped
  dueCount: number;
  /** already-formatted relative time of the next word coming back, when nothing is due */
  nextReturn: string | null;
  /** how many extra daily review slots this account has set — see lib/srs.ts */
  capacityBonus: number;
}) {
  const t = await getTranslations("ui.account");
  const extra = dueCount - words.length;

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
        <>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            {words.map((w) => {
              const row = (
                <>
                  <span className="min-w-0 flex-1 truncate">
                    <b className="kr font-semibold text-[14px]">{w.korean}</b>
                    {w.meaning && <span className="text-[12.5px] text-muted"> · {w.meaning}</span>}
                  </span>
                  <small className="flex-none flex items-center gap-1 text-[11.5px] font-semibold tabular-nums text-sky-deep">
                    <span aria-hidden="true">💧</span>
                    {t("dueToday")}
                  </small>
                </>
              );
              return (
                <li key={w.korean} className="flex items-center gap-2 py-1.5 border-b border-line last:border-0">
                  {w.slug ? (
                    <Link href={`/words/${w.slug}`} className="flex items-center gap-2 w-full min-w-0 hover:text-success">
                      {row}
                    </Link>
                  ) : (
                    row
                  )}
                </li>
              );
            })}
          </ul>

          {extra > 0 && (
            <small className="block mt-2 text-[11.5px] text-faint tabular-nums">{t("moreWords", { count: extra })}</small>
          )}

          <Link
            href="/review"
            className="inline-block mt-4 text-[13px] font-semibold text-success hover:translate-x-0.5 transition-transform"
          >
            {t("reviewDue", { count: dueCount })} →
          </Link>
        </>
      )}

      <ReviewCapacityButton capacityBonus={capacityBonus} />
    </div>
  );
}
