import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonClassName } from "@/components/ui/Button";
import ResultShell, { ResultRing, ResultTag } from "@/components/results/ResultShell";
import { XP_POINTS, type ProgressResult } from "@/lib/activity";
import { type ChallengeWord } from "@/lib/pronunciation";

const COLOR = "#228980";
const BTN_TEAL = buttonClassName("teal");
const BTN_LINE = buttonClassName("line");

export default function FinishedCard({
  words,
  nailed,
  cleared,
  perfect,
  bestStreak,
  levelUp,
  attempts,
  saveError,
  onRunItBack,
}: {
  words: ChallengeWord[];
  nailed: string[];
  /** Every word attempted at least once — doesn't require a passing score. */
  cleared: boolean;
  /** Every word scored 100 — earns the rainbow ring. */
  perfect: boolean;
  bestStreak: number;
  levelUp: ProgressResult | null;
  attempts: Record<string, { count: number; best: number }>;
  saveError: string | null;
  onRunItBack: () => void;
}) {
  const t = useTranslations("pronunciation.finished");
  const tn = useTranslations("nav");
  const tu = useTranslations("ui");
  const weak = words
    .filter((w) => (attempts[w.id]?.count ?? 0) > 1)
    .sort((a, b) => (attempts[a.id]?.best ?? 0) - (attempts[b.id]?.best ?? 0));

  return (
    <ResultShell
      color={COLOR}
      categoryLabel={tn("speaking")}
      ring={
        <ResultRing
          pct={perfect ? 100 : (nailed.length / words.length) * 100}
          center={nailed.length}
          unit={`/${words.length}`}
          label={t("nailed")}
          color={COLOR}
        />
      }
      headline={perfect ? t("perfect") : cleared ? t("cleared") : t("round")}
      sub={t("sub", { n: words.length })}
      tags={
        <>
          <ResultTag tone="good">🔥 {bestStreak}</ResultTag>
          {weak.length > 0 && <ResultTag tone="warn">{weak.length} took extra tries</ResultTag>}
        </>
      }
      levelUp={levelUp}
      xpValue={XP_POINTS.pronunciation}
      xpLabel={tu("xpEarned", { skill: tn("speaking") })}
      actions={
        <>
          <Link href="/speaking" className={BTN_TEAL}>
            {t("backToPractice")}
          </Link>
          <button className={BTN_LINE} onClick={onRunItBack}>
            {t("runItBack")}
          </button>
          {cleared && !perfect && (
            <Link href="/speaking?tab=challenge" className={BTN_LINE}>
              {t("tryChallenge")}
            </Link>
          )}
        </>
      }
    >
      {weak.length > 0 && (
        <div className="text-left bg-[var(--tint-amber)] border border-amber-line rounded-[10px] px-4 py-3">
          <b className="block text-[11px] font-bold tracking-[.06em] text-[#B45309] mb-2">{t("tookTries")}</b>
          <div className="flex flex-wrap gap-2">
            {weak.slice(0, 4).map((w) => (
              <span
                key={w.id}
                className="kr inline-flex items-center gap-1.5 text-[13px] font-medium bg-cream border border-amber-line rounded-full px-2.5 py-1"
              >
                {w.kr}
                <span className="text-[11px] text-faint">{attempts[w.id]?.best ?? 0}%</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {saveError && (
        <p className="text-[12px] text-[#C63958] bg-[var(--tint-rose)] border border-[var(--tint-rose-line)] rounded-[8px] px-3 py-2">
          ⚠️ {saveError}
        </p>
      )}
    </ResultShell>
  );
}
