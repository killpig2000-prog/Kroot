import LevelCreature from "@/components/dashboard/LevelCreature";
import type { CefrLevel } from "@/lib/tree";

const CARD = "border border-line rounded-[14px] bg-cream max-w-[900px]";

// Cycled every ~3.2s while grading is in flight (a real 5-15s API round
// trip) so a slow check reads as "still working" instead of "stuck".
export const GRADING_STEPS = [
  { title: "Reading your writing…", subtitle: "Your tree teacher is checking the grammar 🧐" },
  { title: "Looking closely…", subtitle: "Comparing it to how a native speaker would say it" },
  { title: "Almost there…", subtitle: "Writing up feedback just for you ✍️" },
];

export default function GradingPhase({
  gradingStep,
  treeStage,
  species,
  costumeIds,
  response,
}: {
  gradingStep: number;
  treeStage: CefrLevel;
  species?: CefrLevel;
  costumeIds?: string[];
  /** What the learner submitted — shown while they wait so it doesn't vanish. */
  response?: string;
}) {
  const step = GRADING_STEPS[Math.min(gradingStep, GRADING_STEPS.length - 1)];
  return (
    <div className={`${CARD} px-7 py-10 text-center`} style={{ animation: "fadeUp .35s ease" }}>
      <svg viewBox="0 0 220 230" className="w-[180px] h-auto mx-auto" aria-hidden="true">
        <g className="sway">
          <LevelCreature level={treeStage} species={species} costumeIds={costumeIds} />
        </g>
      </svg>
      <h2 key={step.title} className="font-bold text-[19px] tracking-[-0.02em] mt-3 mb-1.5" style={{ animation: "fadeUp .3s ease" }}>
        {step.title}
      </h2>
      <p key={step.subtitle} className="text-sm text-muted" style={{ animation: "fadeUp .3s ease" }}>
        {step.subtitle}
      </p>
      {gradingStep >= GRADING_STEPS.length - 1 && (
        <p className="text-[12.5px] text-faint mt-4">
          Taking a little longer than usual — hang tight, it&apos;s still working.
        </p>
      )}
      {response?.trim() && (
        <div className="mt-6 max-w-[560px] mx-auto text-left bg-warm border border-line rounded-[12px] px-4 py-3">
          <p className="text-[10.5px] font-semibold tracking-[.08em] uppercase text-faint mb-1">Your answer</p>
          <p className="kr text-[15px] leading-[1.7] whitespace-pre-wrap">{response.trim()}</p>
        </div>
      )}
    </div>
  );
}
