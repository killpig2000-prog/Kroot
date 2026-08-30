import { useTranslations } from "next-intl";
import { buttonClassName } from "@/components/ui/Button";
import { NAILED_THRESHOLD } from "@/lib/pronunciation";

const MAX_LISTEN_MS = 6000;
const RING_R = 47;
const RING_C = 2 * Math.PI * RING_R;
const BTN_TEAL = buttonClassName("teal");

// The mic/type input for the current word, shown until a grade comes back
// (heard === null in the parent). Handles both the mic-listening ring and
// the typed-answer fallback.
export default function AnswerCapture({
  bestScore,
  micOk,
  isListening,
  micElapsedMs,
  interim,
  error,
  typed,
  setTyped,
  showFallback,
  setTypedFallback,
  onListen,
  onSkip,
  onCheck,
}: {
  bestScore: number;
  micOk: boolean;
  isListening: boolean;
  micElapsedMs: number;
  interim: string;
  error: string | null;
  typed: string;
  setTyped: (v: string) => void;
  showFallback: boolean;
  setTypedFallback: (v: boolean) => void;
  onListen: () => void;
  onSkip: () => void;
  onCheck: () => void;
}) {
  const t = useTranslations("pronunciation.capture");
  return (
    <div className="flex flex-col items-center gap-3 mb-2">
      {bestScore >= NAILED_THRESHOLD && (
        <div className="inline-flex items-center gap-2.5 text-[12.5px] font-semibold text-success bg-success-bg border border-success-line rounded-full pl-3 pr-1.5 py-1.5">
          {t("nailedBefore")}
          <button
            className="text-[11.5px] font-bold bg-cream border border-success-line rounded-full px-2.5 py-1 hover:bg-success-bg transition-colors"
            onClick={onSkip}
          >
            {t("skip")}
          </button>
        </div>
      )}
      {micOk && (
        <>
          <div className="relative w-[104px] h-[104px]">
            {isListening && (
              <svg viewBox="0 0 104 104" className="absolute inset-0 -rotate-90">
                <circle cx="52" cy="52" r={RING_R} fill="none" stroke="#E3DDD0" strokeWidth="5" />
                <circle
                  cx="52"
                  cy="52"
                  r={RING_R}
                  fill="none"
                  strokeWidth="5"
                  strokeLinecap="round"
                  stroke={
                    micElapsedMs / MAX_LISTEN_MS < 0.55
                      ? "#3E7C59"
                      : micElapsedMs / MAX_LISTEN_MS < 0.8
                        ? "#B45309"
                        : "#C63958"
                  }
                  strokeDasharray={RING_C}
                  strokeDashoffset={RING_C * Math.min(1, micElapsedMs / MAX_LISTEN_MS)}
                  style={{ transition: "stroke .2s linear" }}
                />
              </svg>
            )}
            <button
              aria-label={isListening ? t("listeningStop") : t("tapAndSpeak")}
              onClick={onListen}
              disabled={isListening}
              className={`absolute rounded-full text-[30px] flex items-center justify-center border-[3px] transition-all ${
                isListening
                  ? "inset-[9px] bg-teal border-transparent text-white wave-on"
                  : "inset-0 bg-[var(--tint-teal)] border-[var(--tint-teal-line)] text-teal hover:scale-105 hover:bg-[var(--tint-teal-line)]"
              }`}
            >
              🎤
            </button>
          </div>
          <p className="text-[13px] text-muted min-h-[20px] text-center">
            {isListening ? (
              <>
                <span className="kr text-[15px] text-charcoal">{interim || t("listening")}</span>
                <span className="block text-[11.5px] text-faint mt-0.5 tabular-nums">
                  {t("autoStops", { s: Math.max(0, (MAX_LISTEN_MS - micElapsedMs) / 1000).toFixed(1) })}
                </span>
              </>
            ) : (
              t("tapPrompt")
            )}
          </p>
        </>
      )}

      {error && <p className="text-[12.5px] text-[#C63958] text-center max-w-[420px]">{error}</p>}

      {!showFallback ? (
        <button
          className="text-[12.5px] font-semibold text-muted hover:text-charcoal transition-colors"
          onClick={() => setTypedFallback(true)}
        >
          {t("typeInstead")}
        </button>
      ) : (
        <div className="w-full max-w-[460px]">
          {!micOk && (
            <p className="text-[12.5px] text-muted mb-2 text-center">
              {t("noMic")}
            </p>
          )}
          <textarea
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={t("placeholder")}
            rows={2}
            className="kr w-full resize-none rounded-[10px] border border-line bg-cream px-3.5 py-2.5 text-[16px] outline-none focus:border-teal transition-colors"
          />
          <div className="flex justify-end mt-2">
            <button className={BTN_TEAL} disabled={!typed.trim()} onClick={onCheck}>
              {t("check")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
