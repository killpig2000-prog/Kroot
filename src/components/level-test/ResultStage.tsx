import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonClassName } from "@/components/ui/Button";
import TreeEvolution from "@/components/level-test/TreeEvolution";
import {
  COOLDOWN_HOURS,
  SKILL_LABELS,
  testVerdict,
  type ServedPromotionTest,
  type SkillScores,
} from "@/lib/promotion-test";
import { treeStageForLevel } from "@/lib/level";

const BTN_GREEN = buttonClassName("success");

export default function ResultStage({
  spec,
  scores,
  promoted,
  playerLevel,
}: {
  spec: ServedPromotionTest;
  scores: SkillScores | null;
  promoted: boolean;
  playerLevel: number;
}) {
  const t = useTranslations("levelTest");
  const verdict = scores ? testVerdict(scores) : null;
  return (
    <div className="border border-line rounded-[14px] p-6">
      {verdict?.passed ? (
        <div className="text-center mb-5">
          <TreeEvolution from={spec.from} to={spec.to} stage={treeStageForLevel(playerLevel)} />
          <b className="text-[19px] block mt-2">{t("result.passedTitle", { level: spec.to })}</b>
          <p className="text-[13.5px] text-muted mt-1">
            {t.rich("result.passedBody", {
              from: t(`species.${spec.from}`),
              to: t(`species.${spec.to}`),
              b: (chunks) => <b>{chunks}</b>,
            })}{" "}
            {promoted
              ? t("result.contentOpen", { level: spec.to })
              : t("result.promotionFailed")}
          </p>
        </div>
      ) : (
        <div className="text-center mb-5">
          <p className="text-[34px] mb-1">🌱</p>
          <b className="text-[19px]">{t("result.failedTitle")}</b>
          <p className="text-[13.5px] text-muted mt-1">{t("result.failedBody", { hours: COOLDOWN_HOURS })}</p>
        </div>
      )}

      {scores && (
        <div className="grid gap-2 mb-4">
          {(Object.keys(scores) as (keyof SkillScores)[]).map((k) => (
            <div key={k} className="flex items-center gap-3">
              <span className="flex-none w-[72px] text-[13px] font-semibold">
                {t(`skills.${k}`)}
              </span>
              <span className="flex-1 h-2.5 rounded-full bg-[var(--tint-stone)] overflow-hidden">
                <span
                  className={`block h-full rounded-full ${scores[k] >= 60 ? "bg-success" : "bg-[#EF4444]"}`}
                  style={{ width: `${scores[k]}%` }}
                />
              </span>
              <b className="flex-none w-9 text-right text-[13px] tabular-nums">{scores[k]}</b>
            </div>
          ))}
        </div>
      )}

      {!verdict?.passed && verdict && (
        <div className="border border-amber-line bg-[var(--tint-amber)] rounded-[12px] px-4 py-3 text-[13.5px] mb-4">
          {t.rich("result.weakest", {
            skill: t(`skills.${verdict.weakest}`),
            b: (chunks) => <b>{chunks}</b>,
          })}{" "}
          <Link href={SKILL_LABELS[verdict.weakest].href} className="font-bold text-success hover:underline">
            {t("result.practice", { skill: t(`skills.${verdict.weakest}`) })}
          </Link>
        </div>
      )}

      <div className="flex gap-2">
        <Link href="/dashboard" className={BTN_GREEN}>
          {t("result.backToGarden")}
        </Link>
      </div>
    </div>
  );
}
