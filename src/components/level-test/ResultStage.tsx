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
import { SPECIES } from "@/lib/tree";
import { treeStageForLevel } from "@/lib/level";

const BTN_GREEN = buttonClassName("success");

export default function ResultStage({
  spec,
  scores,
  feedback,
  promoted,
  playerLevel,
}: {
  spec: ServedPromotionTest;
  scores: SkillScores | null;
  feedback: { writing?: string; speaking?: string };
  promoted: boolean;
  playerLevel: number;
}) {
  const verdict = scores ? testVerdict(scores) : null;
  return (
    <div className="border border-line rounded-[14px] p-6">
      {verdict?.passed ? (
        <div className="text-center mb-5">
          <TreeEvolution from={spec.from} to={spec.to} stage={treeStageForLevel(playerLevel)} />
          <b className="text-[19px] block mt-2">Congratulations! You leveled up to {spec.to}!</b>
          <p className="text-[13.5px] text-muted mt-1">
            Your {SPECIES[spec.from].name} grew into a <b>{SPECIES[spec.to].name}</b>.{" "}
            {promoted
              ? `${spec.to} content is now open.`
              : "We couldn’t apply the promotion — check your profile shortly."}
          </p>
        </div>
      ) : (
        <div className="text-center mb-5">
          <p className="text-[34px] mb-1">🌱</p>
          <b className="text-[19px]">Not quite yet — but you&apos;re close!</b>
          <p className="text-[13.5px] text-muted mt-1">You can try again in {COOLDOWN_HOURS} hours.</p>
        </div>
      )}

      {scores && (
        <div className="grid gap-2 mb-4">
          {(Object.keys(scores) as (keyof SkillScores)[]).map((k) => (
            <div key={k} className="flex items-center gap-3">
              <span className="flex-none w-[72px] text-[13px] font-semibold">
                {SKILL_LABELS[k].en}
              </span>
              <span className="flex-1 h-2.5 rounded-full bg-[#F5F5F4] overflow-hidden">
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

      {(feedback.writing || feedback.speaking) && (
        <div className="bg-warm border border-line rounded-[12px] px-4 py-3 text-[13px] text-[#3F3F46] grid gap-1.5 mb-4">
          {feedback.writing && <p>✏️ {feedback.writing}</p>}
          {feedback.speaking && <p>🎙 {feedback.speaking}</p>}
        </div>
      )}

      {!verdict?.passed && verdict && (
        <div className="border border-amber-line bg-[#FFFBEB] rounded-[12px] px-4 py-3 text-[13.5px] mb-4">
          Your weakest skill was <b>{SKILL_LABELS[verdict.weakest].en}</b>.{" "}
          <Link href={SKILL_LABELS[verdict.weakest].href} className="font-bold text-success hover:underline">
            Practice {SKILL_LABELS[verdict.weakest].en} →
          </Link>
        </div>
      )}

      <div className="flex gap-2">
        <Link href="/dashboard" className={BTN_GREEN}>
          Back to Garden
        </Link>
      </div>
    </div>
  );
}
