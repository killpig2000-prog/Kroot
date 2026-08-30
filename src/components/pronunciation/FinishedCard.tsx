import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonClassName } from "@/components/ui/Button";
import { XP_POINTS, type ProgressResult } from "@/lib/activity";
import { type ChallengeWord } from "@/lib/pronunciation";

const TEAL = "#228980";
const RAINBOW =
  "conic-gradient(from 0deg, #EF4444, #F97316, #EAB308, #22C55E, #06B6D4, #6366F1, #A855F7, #EF4444)";
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
  const weakWords = words
    .filter((w) => (attempts[w.id]?.count ?? 0) > 1)
    .sort((a, b) => (attempts[a.id]?.best ?? 0) - (attempts[b.id]?.best ?? 0))
    .slice(0, 4);

  return (
    <div
      className="max-w-[680px] text-center border border-line rounded-[14px] px-7 py-10"
      style={{ animation: "fadeUp .4s ease" }}
    >
      <div
        className="w-[104px] h-[104px] mx-auto mb-3 rounded-full flex items-center justify-center"
        style={{
          background: perfect
            ? RAINBOW
            : `conic-gradient(${TEAL} ${(nailed.length / words.length) * 360}deg, #E3DDD0 0)`,
        }}
      >
        <div className="w-[84px] h-[84px] rounded-full bg-cream flex items-center justify-center text-[34px]">
          {perfect ? "🌈" : cleared ? "🎉" : "🎤"}
        </div>
      </div>
      <h2 className="font-bold text-[21px] tracking-[-0.02em] mt-1 mb-1.5">
        {perfect ? t("perfect") : cleared ? t("cleared") : t("round")}
      </h2>
      <p className="text-sm text-muted mb-[22px]">
        {t("sub", { n: words.length })}
      </p>
      {levelUp && (
        <p className="text-sm font-semibold text-success mb-[22px] -mt-3">
          {t("levelUp", { level: levelUp.new_level })}
        </p>
      )}
      <div className="flex justify-center gap-3 mb-6 flex-wrap">
        <div className="border border-line rounded-[10px] px-5 py-3 min-w-[100px]">
          <b className="block text-[19px] font-bold text-success">
            {nailed.length}/{words.length}
          </b>
          <small className="text-xs text-muted">{t("nailed")}</small>
        </div>
        <div className="border border-line rounded-[10px] px-5 py-3 min-w-[100px]">
          <b className="block text-[19px] font-bold">🔥 {bestStreak}</b>
          <small className="text-xs text-muted">{t("bestStreak")}</small>
        </div>
        <div className="border border-line rounded-[10px] px-5 py-3 min-w-[100px]">
          <b className="block text-[19px] font-bold text-success">+{XP_POINTS.pronunciation} XP</b>
          <small className="text-xs text-muted">{t("earned")}</small>
        </div>
      </div>

      {weakWords.length > 0 && (
        <div className="text-left bg-[var(--tint-amber)] border border-amber-line rounded-[10px] px-4 py-3 mb-6">
          <b className="block text-[11px] font-bold tracking-[.06em] text-[#B45309] mb-2">
            {t("tookTries")}
          </b>
          <div className="flex flex-wrap gap-2">
            {weakWords.map((w) => (
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
        <p className="text-[12px] text-[#C63958] bg-[var(--tint-rose)] border border-[var(--tint-rose-line)] rounded-[8px] px-3 py-2 mb-5">
          ⚠️ {saveError}
        </p>
      )}

      <div className="flex justify-center gap-2.5 flex-wrap">
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
      </div>
    </div>
  );
}
