import { Link } from "@/i18n/navigation";
import { TIER_META, chapterBlurb, type ChallengeTier, type Chapter } from "@/lib/pronunciation";

const RAINBOW =
  "conic-gradient(from 0deg, #EF4444, #F97316, #EAB308, #22C55E, #06B6D4, #6366F1, #A855F7, #EF4444)";

export type ChapterProgress = Chapter & {
  total: number;
  nailed: number;
  cleared: boolean;
  locked: boolean;
};

const TIER_STYLE: Record<ChallengeTier, { c: string; soft: string; brd: string }> = {
  1: { c: "#3E7C59", soft: "#F0FDF4", brd: "#BBF7D0" },
  2: { c: "#C47A25", soft: "#FFFBEB", brd: "#FDE68A" },
  3: { c: "#EA580C", soft: "#FFF7ED", brd: "#FED7AA" },
  4: { c: "#DC2626", soft: "#FEF2F2", brd: "#FECACA" },
  5: { c: "#7C2D12", soft: "#FDF2F0", brd: "#E7C4B4" },
};

function Stone({ chapter, current }: { chapter: ChapterProgress; current: boolean }) {
  const style = TIER_STYLE[chapter.tier];
  const pct = chapter.total ? chapter.nailed / chapter.total : 0;
  const body = (
    <div
      title={chapter.title}
      className={`w-full rounded-[12px] border-[1.5px] bg-cream px-2 pt-2.5 pb-3 text-center transition-transform ${
        chapter.locked ? "opacity-50" : "hover:-translate-y-0.5"
      }`}
      style={{
        borderColor: current ? style.c : chapter.cleared ? "#F59E0B" : "#E3DDD0",
        boxShadow: current ? `0 0 0 3px ${style.soft}` : undefined,
      }}
    >
      <div
        className="relative w-9 h-9 mx-auto mb-1.5 rounded-full flex items-center justify-center"
        style={{
          background: chapter.locked ? "#E3DDD0" : chapter.cleared ? RAINBOW : `conic-gradient(${style.c} ${pct * 360}deg, #E3DDD0 0)`,
        }}
      >
        <div className="w-[27px] h-[27px] rounded-full bg-cream flex items-center justify-center text-[11px] font-bold">
          {chapter.locked ? "🔒" : chapter.cleared ? "✓" : `${chapter.nailed}/${chapter.total}`}
        </div>
      </div>
      <b className="block text-[11.5px] leading-[1.25] h-[30px] overflow-hidden">{chapterBlurb(chapter.key)}</b>
      <small className="text-[10px] text-faint">{chapter.total} words</small>
    </div>
  );

  return chapter.locked ? (
    <div aria-disabled="true">{body}</div>
  ) : (
    <Link href={`/speaking?chapter=${chapter.key}`} aria-label={`Play ${chapter.title}`}>
      {body}
    </Link>
  );
}

export default function PronunciationTrail({
  chapters,
  currentKey,
}: {
  chapters: ChapterProgress[];
  currentKey: string | null;
}) {
  return (
    <div className="relative pl-[26px] max-w-[820px]">
      <div
        className="absolute top-1.5 bottom-1.5 left-[9px] w-1 rounded-full"
        style={{
          background: `linear-gradient(to bottom, ${TIER_STYLE[1].c}, ${TIER_STYLE[2].c}, ${TIER_STYLE[3].c}, ${TIER_STYLE[4].c}, ${TIER_STYLE[5].c})`,
        }}
        aria-hidden="true"
      />

      {TIER_META.map((meta, ti) => {
        const camp = chapters.filter((c) => c.tier === meta.tier);
        if (camp.length === 0) return null;
        const clearedCount = camp.filter((c) => c.cleared).length;
        const campLocked = camp[0]?.locked;
        const style = TIER_STYLE[meta.tier];
        const previous = TIER_META[ti - 1];

        // A locked tier is one quiet row — its chapters can't be opened yet,
        // so a full card grid only adds scrolling.
        if (campLocked) {
          return (
            <div key={meta.tier} className="relative mb-1.5">
              <div className="flex items-center gap-2.5 py-3 opacity-70">
                <span
                  className="absolute left-[-26px] w-5 h-5 rounded-full border-[3px] border-white"
                  style={{ background: "#D6D0C4", boxShadow: `0 0 0 2px ${style.c}` }}
                  aria-hidden="true"
                />
                <b className="font-bold text-[14px] tracking-[-0.01em] text-muted">
                  {meta.emoji} {meta.name}
                </b>
                <span className="text-[12px] text-faint font-medium">
                  · {camp.length} chapters{previous ? ` · unlocks after ${previous.name}` : ""}
                </span>
                <span className="ml-auto text-[13px] text-faint" aria-hidden="true">🔒</span>
              </div>
            </div>
          );
        }

        return (
          <div key={meta.tier} className="relative mb-1.5">
            <div className="flex items-center gap-2.5 py-4 pb-2.5">
              <span
                className="absolute left-[-26px] w-5 h-5 rounded-full border-[3px] border-white"
                style={{ background: style.c, boxShadow: `0 0 0 2px ${style.c}` }}
                aria-hidden="true"
              />
              <b className="font-bold text-[15px] tracking-[-0.01em]">
                {meta.emoji} {meta.name}
              </b>
              <span className="ml-auto text-[12px] text-faint font-medium">
                {clearedCount}/{camp.length} chapters cleared
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-2 sm:gap-2.5 pb-3">
              {camp.map((c) => (
                <Stone key={c.key} chapter={c} current={c.key === currentKey} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
