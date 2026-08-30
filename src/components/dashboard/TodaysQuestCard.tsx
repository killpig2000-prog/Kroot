import QuestButton from "@/components/dashboard/QuestButton";

// The one always-visible "what to do today" card in the main column —
// replaces the old resume-or-quest-fallback Continue card entirely (no more
// "pick up where you left off"; today's quest is the single recommendation).
export default function TodaysQuestCard({
  quest,
}: {
  quest?: { skill_key: string; description: string; completed_at: string | null } | null;
}) {
  if (!quest) return null;

  return (
    <div className="flex items-center gap-3.5 border border-amber-line bg-[var(--tint-amber)] rounded-[14px] px-5 py-4 mb-[30px]">
      <span className="flex-none w-10 h-10 rounded-[10px] bg-cream border border-amber-line flex items-center justify-center text-lg">
        🎯
      </span>
      <span className="flex-1 min-w-0">
        <b className="block font-semibold text-sm text-[#B7791F]">Today&apos;s quest</b>
        <span className="text-[13px] text-[#96751F]">{quest.description}</span>
      </span>
      <QuestButton skillKey={quest.skill_key} completed={!!quest.completed_at} />
    </div>
  );
}
