import { estMinutes } from "@/lib/listening-resume";
import type { Dialogue } from "@/lib/listening-dialogues";

export default function ClipList({
  dialogues,
  completed,
  heardMap,
  doneCount,
  resumeTarget,
  newLevel,
  onOpenClip,
}: {
  dialogues: Dialogue[];
  completed: Set<string>;
  heardMap: Record<string, number>;
  doneCount: number;
  resumeTarget: Dialogue | undefined;
  newLevel: number | null;
  onOpenClip: (id: string) => void;
}) {
  return (
    <div className="max-w-[680px]">
      {/* situation progress */}
      <div className="h-[7px] rounded-full bg-warm border border-line overflow-hidden mb-4">
        <div
          className="h-full bg-teal rounded-full transition-all"
          style={{ width: `${dialogues.length ? (doneCount / dialogues.length) * 100 : 0}%` }}
        />
      </div>

      {/* resume banner */}
      {resumeTarget && (
        <button
          className="w-full flex items-center gap-3 border-[1.5px] border-[var(--tint-teal-line)] bg-[var(--tint-teal)] rounded-[13px] px-4 py-3 mb-3.5 text-left transition-all hover:-translate-y-0.5"
          onClick={() => onOpenClip(resumeTarget.id)}
        >
          <span className="text-[20px] flex-none">🎧</span>
          <span className="flex-1 min-w-0">
            <b className="block text-[13.5px] font-bold text-teal">
              Continue where you left off
            </b>
            <span className="text-[12.5px] text-muted">
              {resumeTarget.title} · line {(heardMap[resumeTarget.id] ?? 0) + 1} of{" "}
              {resumeTarget.lines.length}
            </span>
          </span>
          <span className="flex-none text-[13px] font-bold text-teal">Resume ▶</span>
        </button>
      )}

      {newLevel && (
        <p className="text-[13px] font-semibold text-success mb-3">🎉 Level up! Now Lv. {newLevel}</p>
      )}

      {/* clip rows — one compact line each; only the exceptions (done,
          in progress) carry a status, so twenty "Not started"s never repeat */}
      <div className="border border-line rounded-[14px] bg-cream overflow-hidden">
        {dialogues.map((d, i) => {
          const done = completed.has(d.id);
          const heard = heardMap[d.id] ?? 0;
          const inProgress = !done && heard > 0;
          return (
            <button
              key={d.id}
              onClick={() => onOpenClip(d.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-[var(--tint-teal)] ${
                i > 0 ? "border-t border-line" : ""
              } ${inProgress ? "bg-[var(--tint-teal)]" : ""}`}
            >
              <span
                className={`flex-none w-7 h-7 rounded-full flex items-center justify-center text-[12.5px] font-bold tabular-nums ${
                  done
                    ? "bg-success-bg border border-success-line text-success"
                    : inProgress
                      ? "bg-teal text-white"
                      : "bg-warm border border-line text-faint"
                }`}
              >
                {done ? "✓" : inProgress ? "▶" : i + 1}
              </span>
              <span className="flex-1 min-w-0 flex items-baseline gap-2">
                <b className={`text-[14px] truncate ${done ? "font-medium text-muted" : "font-semibold"}`}>
                  {d.title}
                </b>
                <small className="flex-none text-[11.5px] text-faint tabular-nums">
                  {d.lines.length} lines · ~{estMinutes(d.lines.length)} min
                </small>
              </span>
              {inProgress && (
                <span className="flex-none flex items-center gap-1.5 text-[11.5px] font-semibold text-teal tabular-nums">
                  <span className="inline-block w-12 h-1 rounded-full bg-line overflow-hidden">
                    <span
                      className="block h-full bg-teal"
                      style={{ width: `${(heard / d.lines.length) * 100}%` }}
                    />
                  </span>
                  {heard}/{d.lines.length}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
