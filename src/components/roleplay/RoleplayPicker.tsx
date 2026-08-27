import Link from "next/link";
import { ROLEPLAY_MINUTES, SCENARIOS, goalsFor } from "@/lib/roleplay";
import type { CefrLevel } from "@/lib/tree";

// Scenario grid — one card per listening situation. The level badge is the
// learner's current CEFR grade; goals scale with it (see lib/roleplay.ts).
export default function RoleplayPicker({ level }: { level: CefrLevel }) {
  return (
    <div>
      <div className="max-w-[720px] border border-[#FED7AA] bg-[#FFF7ED] rounded-[14px] px-5 py-4 mb-6 flex items-start gap-3">
        <span className="text-xl flex-none">💡</span>
        <p className="text-[13.5px] text-[#9A3412] leading-[1.55]">
          Pick a situation and chat in Korean with an AI partner. Each scenario has three goals to hit —
          your partner stays in character, keeps things at <b>{level}</b> level, and quietly fixes your
          slips along the way.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 max-w-[1100px]">
        {SCENARIOS.map((s) => {
          const goals = goalsFor(s, level);
          return (
            <Link
              key={s.key}
              href={`/roleplay?situation=${s.key}`}
              className="group border border-line rounded-[14px] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#FDBA74] hover:shadow-[0_6px_0_#FFEDD5]"
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="w-11 h-11 rounded-[12px] bg-[#FFF7ED] border border-[#FED7AA] flex items-center justify-center text-[22px] transition-transform group-hover:scale-110">
                  {s.icon}
                </span>
                <span className="text-[11px] font-bold text-[#C2410C] bg-[#FFF7ED] border border-[#FED7AA] rounded-full px-2 py-[2px]">
                  {level}
                </span>
              </div>
              <b className="block font-semibold text-[15px] mb-0.5">{s.title}</b>
              <span className="block text-[12.5px] text-faint mb-3">
                {goals.length} goals · ~{ROLEPLAY_MINUTES} min
              </span>
              <ul className="space-y-1">
                {goals.map((g, i) => (
                  <li key={i} className="text-[12.5px] text-muted flex gap-1.5">
                    <span className="text-faint">○</span>
                    <span className="min-w-0">{g.en}</span>
                  </li>
                ))}
              </ul>
              <span className="mt-4 inline-flex text-[13px] font-semibold text-[#C2410C] transition-transform group-hover:translate-x-0.5">
                Start talking →
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
