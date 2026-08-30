import { Link } from "@/i18n/navigation";

// Where each quest skill sends the learner. Completion is NOT done here —
// finishing the actual activity marks the quest via recordCompletion().
export const SKILL_HREF: Record<string, string> = {
  listening: "/listening",
  reading: "/reading",
  writing: "/writing",
  vocabulary: "/review",
  grammar: "/grammar",
  hangul: "/hangul",
  pronunciation: "/speaking",
  slang: "/slang",
};

export default function QuestButton({
  skillKey,
  completed,
}: {
  skillKey: string;
  completed: boolean;
}) {
  if (completed) {
    return (
      <span className="rounded-[9px] px-[18px] py-[9px] text-[13.5px] font-semibold text-success bg-success-bg border border-success-line">
        Done ✓
      </span>
    );
  }
  return (
    <Link
      href={SKILL_HREF[skillKey] ?? "/dashboard"}
      className="rounded-[9px] px-[18px] py-[9px] text-[13.5px] font-semibold text-white bg-success transition-colors hover:bg-success-deep"
    >
      Start ▸
    </Link>
  );
}
