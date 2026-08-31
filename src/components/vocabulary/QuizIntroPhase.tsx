import { useTranslations } from "next-intl";
import { buttonClassName } from "@/components/ui/Button";

const BTN_VIOLET = buttonClassName("violet");
const BTN_LINE = buttonClassName("line");
const CARD = "max-w-[560px] border border-line rounded-[14px] p-[clamp(20px,3vw,28px)]";

export default function QuizIntroPhase({
  known,
  total,
  onStartQuiz,
  onSkipQuiz,
}: {
  known: number;
  total: number;
  onStartQuiz: () => void;
  onSkipQuiz: () => void;
}) {
  const t = useTranslations("vocabulary.quiz");
  return (
    <div className={`${CARD} text-center`} style={{ animation: "fadeUp .35s ease" }}>
      <p className="text-3xl mb-2">🎯</p>
      <h2 className="font-bold text-[19px] tracking-[-0.02em] mb-1.5">{t("introTitle")}</h2>
      <p className="text-sm text-muted mb-6">{t("introSub", { known, total })}</p>
      <div className="flex justify-center gap-2.5 flex-wrap">
        <button className={BTN_VIOLET} onClick={onStartQuiz}>
          {t("start")}
        </button>
        <button className={BTN_LINE} onClick={onSkipQuiz}>
          {t("skip")}
        </button>
      </div>
    </div>
  );
}
