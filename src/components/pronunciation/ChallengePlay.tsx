"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { buttonClassName } from "@/components/ui/Button";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { recordCompletion } from "@/lib/activity";
import { useKoreanSpeaker, useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { bestSimilarity } from "@/lib/speech-match";
import { isTableMissing } from "@/lib/resume";
import { playCorrect, playWrong, playChapterClear } from "@/lib/sfx";
import {
  starsFor,
  type Challenge,
  type ChallengeResult,
} from "@/lib/pronunciation";

const MINUTES_PER_RUN = 2;
// A challenge line is long, so the mic stays open longer than in practice.
const MAX_LISTEN_MS = 12000;

const BTN_EMBER = "rounded-[10px] px-[22px] py-2.5 text-sm font-semibold transition-colors bg-[var(--c-danger)] text-white hover:brightness-95 disabled:opacity-60";
const BTN_LINE = buttonClassName("line");

function Stars({ n, big = false, label }: { n: number; big?: boolean; label: string }) {
  return (
    <span className={`tracking-[2px] text-[#D9A23B] ${big ? "text-[22px]" : ""}`} aria-label={label}>
      {"★".repeat(n)}
      <span className="text-line">{"★".repeat(3 - n)}</span>
    </span>
  );
}

// One challenge: say the whole line in one go. Scored on accuracy and on how
// long you were speaking — the clock starts at the first syllable heard, not
// when the mic opens, and retries are never counted.
export default function ChallengePlay({
  challenge,
  userId,
  initialBest,
}: {
  challenge: Challenge;
  userId?: string;
  initialBest: ChallengeResult | null;
}) {
  const t = useTranslations("pronunciation.challenge");
  const tk = useTranslations("pronunciation.challenge.kinds");
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [best, setBest] = useState<ChallengeResult | null>(initialBest);
  const [run, setRun] = useState<ChallengeResult | null>(null);
  const [typed, setTyped] = useState("");
  const [typedFallback, setTypedFallback] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const scoringRef = useRef(false);

  const { speak, isSpeaking, isSupported: ttsOk } = useKoreanSpeaker();
  const { isSupported: micOk, isListening, interim, error, listen, setError } = useSpeechRecognition(
    "ko-KR",
    MAX_LISTEN_MS,
  );
  const showFallback = typedFallback || !micOk;

  const runStars = run ? starsFor(challenge, run) : 0;
  const bestStars = starsFor(challenge, best);

  async function score(text: string, ms: number) {
    // A fast double-tap on "check" used to fire the run twice.
    if (scoringRef.current) return;
    scoringRef.current = true;
    const accuracy = Math.round(bestSimilarity(text, [challenge.kr]) * 100);
    const result: ChallengeResult = { accuracy, ms };
    setRun(result);

    const stars = starsFor(challenge, result);
    if (stars >= 3) playChapterClear();
    else if (stars >= 2) playCorrect();
    else playWrong();

    // Keep the best run: highest accuracy wins, and among equal accuracy the
    // faster time. A slow perfect run never loses to a fast sloppy one.
    const improved =
      !best || accuracy > best.accuracy || (accuracy === best.accuracy && ms > 0 && (best.ms === 0 || ms < best.ms));
    const nextBest = improved ? result : best;
    setBest(nextBest);

    try {
      if (userId && improved) {
        const { error: upsertError } = await supabase.from("challenge_progress").upsert(
          {
            user_id: userId,
            challenge_key: challenge.key,
            best_accuracy: accuracy,
            best_ms: ms,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,challenge_key" },
        );
        // Migration 0038 may not have reached this environment yet — a missing
        // table must never break the run, it just won't persist.
        if (upsertError && !isTableMissing(upsertError)) {
          setSaveError(t("saveError"));
        } else {
          setSaveError(null);
        }
      }

      if (userId) {
        await recordCompletion(supabase, "pronunciation", MINUTES_PER_RUN);
        router.refresh();
      }
    } catch {
      // The score is already on screen; only persistence failed.
      setSaveError(t("saveError"));
    } finally {
      scoringRef.current = false;
    }
  }

  function reset() {
    setRun(null);
    setTyped("");
    setError(null);
  }

  return (
    <div className="max-w-[680px]">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <Link
          href="/speaking?tab=challenge"
          className="text-[12.5px] font-bold text-faint hover:text-charcoal transition-colors"
        >
          {t("backToChallenges")}
        </Link>
        <span className="text-[12.5px] text-muted">
          {"🔥".repeat(challenge.heat)} <b className="text-charcoal">{tk(challenge.kind)}</b>
        </span>
      </div>

      <div className="border border-line rounded-[16px] bg-cream overflow-hidden">
        {/* the line */}
        <div
          className="px-[clamp(16px,3vw,26px)] py-7 text-center"
          style={{ background: "radial-gradient(ellipse at 50% 0%, var(--c-danger-bg) 0%, var(--c-warm) 70%)" }}
        >
          <span className="text-[11px] font-extrabold tracking-[.1em] uppercase text-[var(--c-danger)]">
            {t("sayInOneBreath")}
          </span>
          <p className="kr font-extrabold text-[clamp(20px,3.2vw,28px)] leading-[1.35] tracking-[-0.01em] mt-2.5 mb-1.5 [text-wrap:balance]">
            {challenge.kr}
          </p>
          <p className="text-[13px] text-muted italic">{challenge.romanization}</p>

          {/* the two things that are scored */}
          <div className="flex justify-center gap-2 flex-wrap mt-4">
            <span
              className={`inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-full border ${
                run && run.accuracy >= challenge.targetAccuracy
                  ? "bg-success-bg border-success-line text-success"
                  : "bg-cream border-line text-muted"
              }`}
            >
              {t("targetAccuracy", { n: challenge.targetAccuracy })}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-full border ${
                run && run.ms > 0 && run.ms <= challenge.targetMs
                  ? "bg-success-bg border-success-line text-success"
                  : "bg-cream border-line text-muted"
              }`}
            >
              {t("targetTime", { s: (challenge.targetMs / 1000).toFixed(1) })}
            </span>
          </div>

          <button
            aria-label={t("hearItFirst")}
            className="mt-4 inline-flex items-center gap-2 text-[12.5px] font-semibold text-muted hover:text-charcoal transition-colors disabled:opacity-40"
            onClick={() => speak(challenge.kr, 0.8)}
            disabled={!ttsOk}
          >
            {isSpeaking ? t("playing") : t("hearItFirst")}
          </button>
        </div>

        {/* mic / result */}
        <div className="px-[clamp(16px,3vw,26px)] py-6 border-t border-dashed border-dash">
          {run === null ? (
            <div className="flex flex-col items-center gap-3">
              {micOk && (
                <>
                  <button
                    aria-label={t("tapAndSay")}
                    onClick={() => listen((text, meta) => void score(text, meta.ms))}
                    disabled={isListening}
                    className={`w-24 h-24 rounded-full text-[34px] grid place-items-center transition-all ${
                      isListening
                        ? "bg-[var(--c-danger)] text-white wave-on"
                        : "bg-[var(--c-danger)] text-white hover:scale-105 shadow-[0_8px_24px_rgba(220,38,38,.35)]"
                    }`}
                  >
                    🎤
                  </button>
                  <p className="text-[13px] text-muted min-h-[20px] text-center">
                    {isListening ? (
                      <span className="kr text-[15px] text-charcoal">{interim || "…"}</span>
                    ) : (
                      t("tapPrompt")
                    )}
                  </p>
                </>
              )}
              {error && <p className="text-[12.5px] text-[var(--c-danger)] text-center max-w-[420px]">{error}</p>}
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
                    className="kr w-full resize-none rounded-[10px] border border-line bg-cream px-3.5 py-2.5 text-[16px] outline-none focus:border-[var(--c-danger)] transition-colors"
                  />
                  <div className="flex justify-end mt-2">
                    <button className={BTN_EMBER} disabled={!typed.trim()} onClick={() => void score(typed.trim(), 0)}>
                      {t("check")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              className="grid sm:grid-cols-[150px_minmax(0,1fr)] gap-5 items-center"
              style={{ animation: "fadeUp .35s ease" }}
            >
              <div
                className="w-[150px] h-[150px] rounded-full grid place-items-center mx-auto"
                style={{
                  background: `conic-gradient(var(--c-danger) ${run.accuracy * 3.6}deg, var(--c-line) 0)`,
                }}
              >
                <span className="w-[122px] h-[122px] rounded-full bg-cream grid place-items-center text-center">
                  <span>
                    <b
                      className="block text-[44px] leading-none text-[var(--c-danger)]"
                      style={{ fontFamily: "var(--font-hand)" }}
                    >
                      {run.accuracy}
                    </b>
                    <small className="text-[11px] text-faint font-bold">% MATCH</small>
                  </span>
                </span>
              </div>

              <div>
                <p className="text-[17px] font-extrabold mb-2 flex items-center gap-2.5">
                  <Stars n={runStars} big label={t("starsLabel", { n: runStars })} />
                  {runStars === 3 ? t("verdictThree") : runStars === 2 ? t("verdictTwo") : t("verdictOne")}
                </p>
                <div className="grid gap-1.5 mb-3">
                  <div className="flex justify-between text-[13px] px-3 py-1.5 rounded-[9px] bg-warm">
                    <span>{t("rowAccuracy")}</span>
                    <b className="tabular-nums">
                      {run.accuracy}%{" "}
                      {run.accuracy >= challenge.targetAccuracy
                        ? "✓"
                        : t("rowAccuracyNeed", { n: challenge.targetAccuracy })}
                    </b>
                  </div>
                  <div
                    className={`flex justify-between text-[13px] px-3 py-1.5 rounded-[9px] ${
                      run.ms > 0 && run.ms <= challenge.targetMs
                        ? "bg-success-bg border border-success-line"
                        : "bg-warm"
                    }`}
                  >
                    <span>{t("rowTime")}</span>
                    <b className="tabular-nums">
                      {run.ms > 0 ? `${(run.ms / 1000).toFixed(1)}s` : "—"}
                      {run.ms > 0 && run.ms <= challenge.targetMs
                        ? " ✓"
                        : ` ${t("rowTimeNeed", { s: (challenge.targetMs / 1000).toFixed(1) })}`}
                    </b>
                  </div>
                  {best && (
                    <div className="flex justify-between text-[13px] px-3 py-1.5 rounded-[9px] bg-[var(--tint-amber)] border border-amber-line">
                      <span>{t("rowBest")}</span>
                      <b className="tabular-nums">
                        {best.accuracy}%{best.ms > 0 && ` in ${(best.ms / 1000).toFixed(1)}s`} · <Stars n={bestStars} label={t("starsLabel", { n: bestStars })} />
                      </b>
                    </div>
                  )}
                </div>
                {saveError && <p className="text-[11.5px] text-[var(--c-danger)] mb-2">⚠️ {saveError}</p>}
                <div className="flex gap-2 flex-wrap">
                  <button className={BTN_EMBER} onClick={reset}>
                    {runStars === 3 ? t("runAgain") : t("tryForMore")}
                  </button>
                  <Link href="/speaking?tab=challenge" className={BTN_LINE}>
                    {t("allChallenges")}
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
