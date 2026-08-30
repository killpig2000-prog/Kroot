import { Link } from "@/i18n/navigation";
import { SKILL_HREF } from "@/components/dashboard/QuestButton";

// The one always-visible "what to do today" card in the main column —
// replaces the old resume-or-quest-fallback Continue card entirely (no more
// "pick up where you left off"; today's quest is the single recommendation).
// Same row shape as that old Continue card: icon square, title + detail,
// arrow pill on the right.
export default function TodaysQuestCard({
  quest,
}: {
  quest?: { skill_key: string; description: string; completed_at: string | null } | null;
}) {
  if (!quest) return null;
  const completed = !!quest.completed_at;

  const inner = (
    <>
      <span className="flex-none w-12 h-12 rounded-[12px] bg-cream border border-success-line flex items-center justify-center text-[22px] transition-transform group-hover:scale-110">
        🎯
      </span>
      <span className="flex-1 min-w-0">
        <b className="block font-semibold text-[15.5px] truncate text-charcoal">Today&apos;s quest</b>
        <span className="block text-[12.5px] text-success-deep truncate">{quest.description}</span>
      </span>
    </>
  );

  if (completed) {
    return (
      <div className="mb-[30px] flex items-center gap-4 rounded-[16px] border-[1.5px] border-success bg-success-bg px-5 py-4">
        {inner}
        <span className="flex-none rounded-full bg-cream text-success text-[13px] font-bold px-4 py-2 border border-success-line">
          Done ✓
        </span>
      </div>
    );
  }

  return (
    <div className="mb-[30px]">
      <Link
        href={SKILL_HREF[quest.skill_key] ?? "/dashboard"}
        className="group flex items-center gap-4 rounded-[16px] border-[1.5px] border-success bg-success-bg px-5 py-4 transition-all hover:-translate-y-0.5 hover:bg-[var(--tint-green)]"
      >
        {inner}
        <span className="flex-none rounded-full bg-success text-white text-[13px] font-bold px-4 py-2 transition-transform group-hover:translate-x-0.5">
          Go →
        </span>
      </Link>
    </div>
  );
}
