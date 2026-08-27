import { buttonClassName } from "@/components/ui/Button";
import type { ServedPromotionTest } from "@/lib/promotion-test";

const BTN_GREEN = buttonClassName("success");

// Shape of the useSpeechRecognition() hook's return value that this stage needs.
type Speech = {
  isSupported: boolean;
  isListening: boolean;
  interim: string;
  listen: (onResult: (text: string) => void) => void;
  stop: () => void;
};

export default function SpeakingStage({
  spec,
  speech,
  transcript,
  setTranscript,
  grading,
  error,
  onSubmit,
}: {
  spec: ServedPromotionTest;
  speech: Speech;
  transcript: string;
  setTranscript: (v: string) => void;
  grading: boolean;
  error: string | null;
  onSubmit: () => void;
}) {
  return (
    <div className="border border-line rounded-[14px] p-6">
      <p className="text-[11px] font-bold tracking-[.07em] uppercase text-faint mb-2">4 · Speaking</p>
      <p className="kr font-bold text-[15.5px] mb-1">{spec.speaking.promptKr}</p>
      <p className="text-[13px] text-muted mb-3">{spec.speaking.prompt}</p>

      {speech.isSupported ? (
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() =>
              speech.isListening
                ? speech.stop()
                : speech.listen((t) => setTranscript(`${transcript} ${t}`.trim()))
            }
            className={`w-14 h-14 rounded-full text-[22px] text-white shadow-[0_3px_0_#f08560] ${
              speech.isListening ? "bg-[#EF4444] animate-pulse" : "bg-[#FF9E7D]"
            }`}
            aria-label={speech.isListening ? "Stop recording" : "Start recording"}
          >
            {speech.isListening ? "⏹" : "🎙"}
          </button>
          <span className="text-[13px] text-muted">
            {speech.isListening ? "Listening… tap ⏹ when you finish" : "Tap 🎙 and answer in Korean"}
          </span>
        </div>
      ) : (
        <p className="text-[12.5px] text-faint mb-2">
          This browser doesn&apos;t support speech recognition — type your answer instead.
        </p>
      )}

      <textarea
        value={speech.isListening && speech.interim ? `${transcript} ${speech.interim}`.trim() : transcript}
        onChange={(e) => setTranscript(e.target.value)}
        rows={3}
        className="kr w-full border-[1.5px] border-line rounded-[12px] px-4 py-3 text-[15px] focus:border-success outline-none"
        placeholder="Your recognized speech appears here"
      />
      {error && <p className="text-[13px] text-[#EF4444] mt-2">{error}</p>}
      <div className="mt-3 flex items-center gap-3">
        <button onClick={onSubmit} disabled={grading || transcript.trim().length < 5} className={BTN_GREEN}>
          {grading ? "AI grading…" : "Submit for grading"}
        </button>
        {grading && <span className="text-[12.5px] text-faint">Grading your writing & speaking (~10s)</span>}
      </div>
    </div>
  );
}
