import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { CefrLevel } from "@/lib/tree";
import type { SkillTally } from "@/components/profile/skill-progress";

// The learner's level and how much of that level's content they've done.
// No unlock, no test, no "ready" state — finishing it announces nothing.
export default function LevelCard({
  level,
  words,
  readings,
  listening,
}: {
  level: CefrLevel;
  words: SkillTally;
  readings: SkillTally;
  listening: SkillTally;
}) {
  const t = useTranslations("profile.learn");
  const rows = [
    { key: "words", label: t("levelWords", { level }), tally: words },
    { key: "readings", label: t("levelReadings", { level }), tally: readings },
    { key: "listening", label: t("levelListening", { level }), tally: listening },
  ];

  return (
    <div className="border border-line rounded-[14px] bg-cream px-[22px] py-5 grid gap-3">
      <div className="flex items-baseline gap-2.5 flex-wrap">
        <b className="font-bold text-[clamp(24px,6vw,28px)] leading-none tracking-[-0.02em]">{level}</b>
        <span className="text-[12.5px] text-muted">{t("levelSub")}</span>
      </div>
      <div className="grid gap-2">
        {rows.map((r) => (
          <div key={r.key} className="grid grid-cols-[minmax(0,7.5rem)_1fr_auto] items-center gap-2.5 text-[13px]">
            <span className="truncate">{r.label}</span>
            <span className="h-2 rounded-full bg-[var(--tint-stone)] overflow-hidden">
              <span className="block h-full rounded-full bg-success" style={{ width: `${r.tally.percent}%` }} />
            </span>
            <b className="tabular-nums text-[12.5px]">
              {r.tally.done}/{r.tally.total}
            </b>
          </div>
        ))}
      </div>
      <Link
        href="/settings/learning"
        className="justify-self-start inline-flex items-center min-h-[44px] -my-2 text-[13px] font-bold text-success hover:text-success-deep"
      >
        {t("levelChange")} ›
      </Link>
    </div>
  );
}
