import type { ChallengeWord } from "@/lib/pronunciation";

// Chapter word list: pick any word to practice, in any order. The chapter
// clears — and the next one unlocks — once every word here is nailed.
export default function WordPicker({
  chapterTitle,
  chapterTip,
  meta,
  words,
  nailed,
  bestScores,
  onOpenWord,
}: {
  chapterTitle: string;
  chapterTip: string;
  meta: { emoji: string; name: string };
  words: ChallengeWord[];
  nailed: string[];
  bestScores: Record<string, number>;
  onOpenWord: (id: string) => void;
}) {
  const nailedSet = new Set(nailed);
  const doneCount = words.filter((w) => nailedSet.has(w.id)).length;
  const nextUp = words.find((w) => !nailedSet.has(w.id));

  return (
    <div className="max-w-[680px]">
      <div className="border border-line rounded-[14px] p-[clamp(20px,3vw,28px)] mb-3.5">
        <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-teal bg-[var(--tint-teal)] border border-[var(--tint-teal-line)] rounded-full px-2.5 py-[3px]">
            {meta.emoji} {meta.name}
          </span>
          <span className="text-[12.5px] font-semibold text-faint tabular-nums">
            {doneCount}/{words.length} nailed
          </span>
        </div>
        <h2 className="font-bold text-[19px] tracking-[-0.01em] mb-1.5">{chapterTitle}</h2>
        <p className="text-[13px] text-muted leading-[1.5]">{chapterTip}</p>
        <div className="h-[7px] rounded-full bg-warm border border-line overflow-hidden mt-4">
          <div
            className="h-full bg-teal rounded-full transition-all"
            style={{ width: `${words.length ? (doneCount / words.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="border border-line rounded-[14px] bg-cream overflow-hidden">
        {words.map((w, i) => {
          const isNailed = nailedSet.has(w.id);
          const score = bestScores[w.id] ?? 0;
          const isNext = !isNailed && w.id === nextUp?.id;
          return (
            <button
              key={w.id}
              onClick={() => onOpenWord(w.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-[var(--tint-teal)] ${
                i > 0 ? "border-t border-line" : ""
              } ${isNext ? "bg-[var(--tint-teal)]" : ""}`}
            >
              <span
                className={`flex-none w-7 h-7 rounded-full grid place-items-center text-[12px] font-bold tabular-nums border ${
                  isNailed ? "bg-success-bg border-success-line text-success" : "bg-warm border-line text-faint"
                }`}
              >
                {isNailed ? "✓" : i + 1}
              </span>
              <span className="flex-1 min-w-0 flex items-baseline gap-2">
                <b className={`kr text-[16px] truncate ${isNailed ? "font-medium text-muted" : "font-bold"}`}>
                  {w.kr}
                </b>
                <small className="flex-none text-[11.5px] text-faint truncate">
                  {w.romanization} · {w.en}
                </small>
              </span>
              <span
                className={`flex-none text-[11px] font-bold px-2.5 py-[3px] rounded-full tabular-nums ${
                  isNailed
                    ? "bg-success-bg text-success"
                    : score > 0
                      ? "bg-[var(--tint-teal)] text-teal"
                      : "bg-warm text-faint"
                }`}
              >
                {isNailed ? "Nailed" : score > 0 ? `${score}%` : "—"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
