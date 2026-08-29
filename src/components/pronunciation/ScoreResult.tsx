import { buttonClassName } from "@/components/ui/Button";
import type { Verdict } from "@/lib/speech-match";

const TEAL = "#228980";
const BTN_TEAL = buttonClassName("teal");
const BTN_LINE = buttonClassName("line");

export const VERDICTS: Record<Verdict, { text: string; fg: string }> = {
  great: { text: "🔥 Nailed it!", fg: "#3E7C59" },
  close: { text: "😬 So close", fg: "#B45309" },
  again: { text: "💥 Try again", fg: "#C63958" },
};

export default function ScoreResult({
  heard,
  targetKr,
  verdict,
  animScore,
  saveError,
  ttsOk,
  onReplay,
  onTryAgain,
  onNext,
  isLastWord,
}: {
  heard: string;
  targetKr: string;
  verdict: { text: string; fg: string };
  animScore: number;
  saveError: string | null;
  ttsOk: boolean;
  onReplay: () => void;
  onTryAgain: () => void;
  onNext: () => void;
  isLastWord: boolean;
}) {
  return (
    <div
      className="border-t border-line pt-6 flex flex-col items-center"
      style={{ animation: "fadeUp .35s ease" }}
    >
      <div
        className="w-[220px] h-[220px] rounded-full flex items-center justify-center mb-3"
        style={{ background: `conic-gradient(${verdict.fg} ${animScore * 3.6}deg, #E3DDD0 0)` }}
      >
        <div className="w-[184px] h-[184px] rounded-full bg-cream flex flex-col items-center justify-center">
          <span
            className="font-bold text-[64px] leading-none tabular-nums"
            style={{ fontFamily: "var(--font-hand)", color: verdict.fg }}
          >
            {animScore}
          </span>
          <span className="text-[13px] text-faint font-semibold mt-1">% match</span>
        </div>
      </div>
      <span className="text-[18px] font-bold text-center mb-6" style={{ color: verdict.fg }}>
        {verdict.text}
      </span>

      <div className="grid gap-2.5 mb-4 w-full max-w-[420px]">
        <div className="bg-warm border border-line rounded-[10px] px-4 py-3">
          <b className="block text-[11px] font-bold tracking-[.06em] text-faint mb-1">YOU SAID</b>
          <p className="kr text-[17px] font-medium">{heard}</p>
        </div>
        <div className="bg-[#F0FDFA] border border-[#99F6E4] rounded-[10px] px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <b className="block text-[11px] font-bold tracking-[.06em] mb-1" style={{ color: TEAL }}>
                TARGET
              </b>
              <p className="kr text-[17px] font-medium">{targetKr}</p>
            </div>
            <button
              aria-label="Replay"
              className="flex-none text-sm text-faint hover:text-teal transition-colors disabled:opacity-40"
              onClick={onReplay}
              disabled={!ttsOk}
            >
              🔁
            </button>
          </div>
        </div>
      </div>

      {saveError && <p className="text-[11.5px] text-[#C63958] mb-2.5">⚠️ {saveError}</p>}
      <div className="flex gap-2.5">
        <button className={BTN_LINE} onClick={onTryAgain}>
          Try again
        </button>
        <button className={BTN_TEAL} onClick={onNext}>
          {isLastWord ? "Finish →" : "Next →"}
        </button>
      </div>
    </div>
  );
}
