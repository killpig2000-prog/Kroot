import { Link } from "@/i18n/navigation";
import { buttonClassName } from "@/components/ui/Button";
import type { CefrLevel } from "@/lib/tree";

const BTN_TEAL = buttonClassName("teal");
const BTN_LINE = buttonClassName("line");

// All-done celebration, shown right after the last clip in a situation completes.
export default function FinishedAllCard({
  situationLabel,
  clipCount,
  level,
  newLevel,
  onBackToClips,
}: {
  situationLabel: string;
  clipCount: number;
  level: CefrLevel;
  newLevel: number | null;
  onBackToClips: () => void;
}) {
  return (
    <div
      className="max-w-[680px] text-center border border-line rounded-[14px] px-7 py-10 bg-cream"
      style={{ animation: "fadeUp .4s ease" }}
    >
      <svg width="104" height="104" viewBox="0 0 150 160" aria-hidden="true" className="inline-block">
        <ellipse cx="75" cy="150" rx="46" ry="7" fill="#E3DDD0" />
        <path d="M75 146 C75 122 74 112 74 98" stroke="#8B7355" strokeWidth="8" strokeLinecap="round" />
        <g className="sway">
          <circle cx="75" cy="72" r="36" fill="#22C55E" />
          <circle cx="49" cy="88" r="18" fill="#4ADE80" />
          <circle cx="101" cy="88" r="18" fill="#4ADE80" />
          <circle className="blink" cx="64" cy="72" r="3.6" fill="#14532D" />
          <circle className="blink d2" cx="86" cy="72" r="3.6" fill="#14532D" />
          <path d="M66 82 Q75 90 84 82" stroke="#14532D" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="50" cy="58" r="5.5" fill="#FACC15" />
          <circle cx="102" cy="56" r="5.5" fill="#FB7185" />
        </g>
        <text x="116" y="54" fontSize="20">
          💧
        </text>
      </svg>
      <h2 className="font-bold text-[21px] tracking-[-0.02em] mt-3 mb-1.5">Great listening!</h2>
      <p className="text-sm text-muted mb-5">
        {situationLabel} · all {clipCount} clips done at {level}. Your ears (and your tree) grew today.
      </p>
      {newLevel && (
        <p className="text-[13.5px] font-semibold text-success mb-5">🎉 Level up! Now Lv. {newLevel}</p>
      )}
      <div className="flex justify-center gap-2.5 flex-wrap">
        <Link href={`/listening?level=${level}`} className={BTN_TEAL}>
          Choose another topic
        </Link>
        <button className={BTN_LINE} onClick={onBackToClips}>
          Back to the clips
        </button>
      </div>
    </div>
  );
}
