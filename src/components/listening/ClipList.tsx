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
          className="w-full flex items-center gap-3 border-[1.5px] border-[#99F6E4] bg-[#F0FDFA] rounded-[13px] px-4 py-3 mb-3.5 text-left transition-all hover:-translate-y-0.5"
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

      {/* clip cards */}
      <div className="grid gap-2.5">
        {dialogues.map((d, i) => {
          const done = completed.has(d.id);
          const heard = heardMap[d.id] ?? 0;
          const inProgress = !done && heard > 0;
          return (
            <button
              key={d.id}
              onClick={() => onOpenClip(d.id)}
              className={`w-full flex items-center gap-3 rounded-[13px] px-3.5 py-3 text-left border-[1.5px] transition-all hover:border-teal hover:-translate-y-0.5 ${
                inProgress ? "border-[#99F6E4] bg-[#F0FDFA]" : "border-line bg-white"
              }`}
            >
              <span
                className={`flex-none w-[34px] h-[34px] rounded-full flex items-center justify-center text-[14px] font-extrabold ${
                  done
                    ? "bg-success-bg border-[1.5px] border-success-line text-success"
                    : inProgress
                      ? "bg-teal text-white"
                      : "bg-warm border-[1.5px] border-line text-faint"
                }`}
              >
                {done ? "✓" : inProgress ? "▶" : i + 1}
              </span>
              <span className="flex-1 min-w-0">
                <b className="block text-[14px] font-bold truncate">{d.title}</b>
                <small className="text-[11.5px] text-faint">
                  {d.lines.length} lines · ~{estMinutes(d.lines.length)} min
                </small>
              </span>
              <span className="flex-none text-right text-[11.5px] text-faint">
                {done ? (
                  <span className="inline-block rounded-full border border-success-line bg-success-bg text-success font-bold px-2.5 py-0.5 text-[10.5px]">
                    Done
                  </span>
                ) : inProgress ? (
                  <>
                    <b className="block text-teal font-bold">line {heard}/{d.lines.length}</b>
                    <span className="inline-block w-[74px] h-1 rounded-full bg-line overflow-hidden mt-1">
                      <span
                        className="block h-full bg-teal"
                        style={{ width: `${(heard / d.lines.length) * 100}%` }}
                      />
                    </span>
                  </>
                ) : (
                  "Not started"
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
