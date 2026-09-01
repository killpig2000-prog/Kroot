import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonClassName } from "@/components/ui/Button";
import ResultShell, { ResultRing } from "@/components/results/ResultShell";
import { XP_POINTS, type ProgressResult } from "@/lib/activity";
import type { CefrLevel } from "@/lib/tree";

const BTN_TEAL = buttonClassName("teal");
const BTN_LINE = buttonClassName("line");
const COLOR = "#2C9754";

// All-done celebration, shown right after the last clip in a situation completes.
export default function FinishedAllCard({
  situationLabel,
  clipCount,
  level,
  levelUp,
  onBackToClips,
}: {
  situationLabel: string;
  clipCount: number;
  level: CefrLevel;
  levelUp: ProgressResult | null;
  onBackToClips: () => void;
}) {
  const t = useTranslations("listening.finished");
  const tn = useTranslations("nav");
  const tu = useTranslations("ui");

  return (
    <ResultShell
      color={COLOR}
      categoryLabel={tn("listening")}
      meta={situationLabel}
      ring={<ResultRing pct={100} center={clipCount} unit={`/${clipCount}`} label="clips" color={COLOR} />}
      headline={t("title")}
      sub={t("sub", { situation: situationLabel, n: clipCount, level })}
      levelUp={levelUp}
      xpValue={XP_POINTS.listening}
      xpLabel={tu("xpEarned", { skill: tn("listening") })}
      actions={
        <>
          <Link href={`/listening?level=${level}`} className={BTN_TEAL}>
            {t("another")}
          </Link>
          <button className={BTN_LINE} onClick={onBackToClips}>
            {t("back")}
          </button>
        </>
      }
    />
  );
}
