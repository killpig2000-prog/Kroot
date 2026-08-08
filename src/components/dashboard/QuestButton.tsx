import Link from "next/link";

// Where each quest skill sends the learner. Completion is NOT done here —
// finishing the actual activity marks the quest via recordCompletion().
const SKILL_HREF: Record<string, string> = {
  listening: "/listening",
  reading: "/reading",
  writing: "/writing",
  speaking: "/speaking",
  vocabulary: "/review",
  grammar: "/grammar",
  hangul: "/hangul",
  pronunciation: "/pronunciation",
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
      <span className="rounded-[9px] px-[18px] py-[9px] text-[13.5px] font-semibold text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0]">
        Done ✓
      </span>
    );
  }
  return (
    <Link
      href={SKILL_HREF[skillKey] ?? "/dashboard"}
      className="rounded-[9px] px-[18px] py-[9px] text-[13.5px] font-semibold text-white bg-[#18181B] transition-colors hover:bg-[#3F3F46]"
    >
      Start ▸
    </Link>
  );
}
