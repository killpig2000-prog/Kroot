"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { recordCompletion, XP_POINTS, type ProgressResult } from "@/lib/activity";
import { useKoreanSpeaker, useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { bestSimilarity, verdictFor, type Verdict } from "@/lib/speech-match";
import { wordsForChapter, orderedChapters, TIER_META, NAILED_THRESHOLD } from "@/lib/pronunciation";
import { playCorrect, playWrong, playStreak, playChapterClear } from "@/lib/sfx";

const MINUTES_PER_SESSION = 4;
const TEAL = "#0D9488";
// The mic stays open this long before we force it to stop and grade whatever
// it heard — browsers vary a lot in when they'd otherwise cut off on their
// own, so this keeps the countdown ring honest.
const MAX_LISTEN_MS = 6000;
const RING_R = 47;
const RING_C = 2 * Math.PI * RING_R;
const RAINBOW =
  "conic-gradient(from 0deg, #EF4444, #F97316, #EAB308, #22C55E, #06B6D4, #6366F1, #A855F7, #EF4444)";

const BTN_TEAL =
  "rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] transition-colors disabled:opacity-60";
const BTN_LINE =
  "rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-[#18181B] bg-white border border-[#E3DDD0] hover:bg-[#FAF7EF] transition-colors";
const LABEL = "text-[11.5px] font-semibold tracking-[.06em] uppercase text-[#A19A8C] mb-2";

const VERDICTS: Record<Verdict, { text: string; fg: string }> = {
  great: { text: "🔥 Nailed it!", fg: "#16A34A" },
  close: { text: "😬 So close", fg: "#B45309" },
  again: { text: "💥 Try again", fg: "#E11D48" },
};

export default function PronunciationChallenge({
  chapterKey,
  userId,
  initialBestScores = {},
}: {
  chapterKey: string;
  userId?: string;
  initialBestScores?: Record<string, number>;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const chapters = useMemo(() => orderedChapters(), []);
  const chapter = chapters.find((c) => c.key === chapterKey);
  const words = useMemo(() => wordsForChapter(chapterKey), [chapterKey]);
  const meta = TIER_META.find((t) => t.tier === chapter?.tier)!;
  const nextChapter = chapter ? chapters[chapter.index + 1] : undefined;

  const [index, setIndex] = useState(0);
  const [heard, setHeard] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [typed, setTyped] = useState("");
  const [typedFallback, setTypedFallback] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [nailed, setNailed] = useState<string[]>(() =>
    words.filter((w) => (initialBestScores[w.id] ?? 0) >= NAILED_THRESHOLD).map((w) => w.id),
  );
  const [finished, setFinished] = useState(false);
  const [levelUp, setLevelUp] = useState<ProgressResult | null>(null);
  const [bestScores, setBestScores] = useState<Record<string, number>>(initialBestScores);
  const [attempts, setAttempts] = useState<Record<string, { count: number; best: number }>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const logged = useRef(false);

  const { speak, isSpeaking, isSupported: ttsOk } = useKoreanSpeaker();
  const {
    isSupported: micOk,
    isListening,
    listenStartedAt,
    interim,
    error,
    listen,
    setError,
  } = useSpeechRecognition("ko-KR", MAX_LISTEN_MS);

  const word = words[index];
  const showFallback = typedFallback || !micOk;

  // Ticks the mic countdown ring while listening.
  const [micElapsedMs, setMicElapsedMs] = useState(0);
  useEffect(() => {
    if (!isListening || listenStartedAt === null) return;
    let raf: number;
    const tick = () => {
      setMicElapsedMs(performance.now() - listenStartedAt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isListening, listenStartedAt]);

  // Animates the score gauge counting up whenever a fresh grade comes in.
  const [animScore, setAnimScore] = useState(0);
  useEffect(() => {
    if (heard === null) return;
    const target = Math.round(score * 100);
    const start = performance.now();
    const DURATION = 550;
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      setAnimScore(Math.round(target * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [heard, score]);

  function resetAnswer() {
    setHeard(null);
    setTyped("");
    setError(null);
  }

  if (!chapter || words.length === 0) {
    return (
      <div className="max-w-[680px] border border-[#E3DDD0] rounded-[14px] px-7 py-10 text-center">
        <p className="text-[15px] font-semibold mb-1.5">Chapter not found</p>
        <Link href="/speaking" className={BTN_LINE}>
          Back to the trail
        </Link>
      </div>
    );
  }

  function grade(text: string) {
    const s = bestSimilarity(text, [word.kr]);
    const pct = Math.round(s * 100);
    setHeard(text);
    setScore(s);

    const newBest = Math.max(bestScores[word.id] ?? 0, pct);
    setBestScores((m) => ({ ...m, [word.id]: newBest }));
    setAttempts((m) => ({ ...m, [word.id]: { count: (m[word.id]?.count ?? 0) + 1, best: newBest } }));

    if (verdictFor(s) === "great") {
      setStreak((n) => {
        const next = n + 1;
        setBestStreak((b) => Math.max(b, next));
        if (next >= 2) playStreak(next);
        else playCorrect();
        return next;
      });
    } else {
      setStreak(0);
      playWrong();
    }
    if (newBest >= NAILED_THRESHOLD) {
      setNailed((n) => (n.includes(word.id) ? n : [...n, word.id]));
    }

    // Keep whichever attempt scored highest — replays shouldn't be able to
    // knock a word's saved best back down.
    if (userId) {
      void supabase
        .from("speaking_progress")
        .upsert(
          { user_id: userId, prompt_key: word.id, best_score: newBest },
          { onConflict: "user_id,prompt_key" },
        )
        .then(({ error }) => {
          setSaveError(error ? "Couldn't save that attempt — check your connection. It may not stick after a refresh." : null);
        });
    }
  }

  function skip() {
    setNailed((n) => (n.includes(word.id) ? n : [...n, word.id]));
    next();
  }

  async function logMinutesOnce() {
    if (logged.current) return;
    logged.current = true;
    const result = await recordCompletion(supabase, "pronunciation", MINUTES_PER_SESSION);
    if (result?.leveled_up) setLevelUp(result);
    router.refresh();
  }

  function next() {
    if (index + 1 < words.length) {
      setIndex(index + 1);
      resetAnswer();
    } else {
      setFinished(true);
      if (nailed.length === words.length) playChapterClear();
      void logMinutesOnce();
    }
  }

  if (finished) {
    const cleared = nailed.length === words.length;
    const weakWords = words
      .filter((w) => (attempts[w.id]?.count ?? 0) > 1)
      .sort((a, b) => (attempts[a.id]?.best ?? 0) - (attempts[b.id]?.best ?? 0))
      .slice(0, 4);

    return (
      <div
        className="max-w-[680px] text-center border border-[#E3DDD0] rounded-[14px] px-7 py-10"
        style={{ animation: "fadeUp .4s ease" }}
      >
        <div
          className="w-[104px] h-[104px] mx-auto mb-3 rounded-full flex items-center justify-center"
          style={{
            background: cleared
              ? RAINBOW
              : `conic-gradient(${TEAL} ${(nailed.length / words.length) * 360}deg, #E3DDD0 0)`,
          }}
        >
          <div className="w-[84px] h-[84px] rounded-full bg-white flex items-center justify-center text-[34px]">
            {cleared ? "🎉" : meta.emoji}
          </div>
        </div>
        <h2 className="font-bold text-[21px] tracking-[-0.02em] mt-1 mb-1.5">
          {cleared ? "Chapter cleared!" : "Round finished!"}
        </h2>
        <p className="text-sm text-[#6B6560] mb-[22px]">
          {words.length} word{words.length > 1 ? "s" : ""} attempted — your mouth is learning the shapes.
        </p>
        {levelUp && (
          <p className="text-sm font-semibold text-[#16A34A] mb-[22px] -mt-3">
            🎉 Level up! You&apos;re now Lv. {levelUp.new_level}
          </p>
        )}
        <div className="flex justify-center gap-3 mb-6 flex-wrap">
          <div className="border border-[#E3DDD0] rounded-[10px] px-5 py-3 min-w-[100px]">
            <b className="block text-[19px] font-bold text-[#16A34A]">
              {nailed.length}/{words.length}
            </b>
            <small className="text-xs text-[#6B6560]">Nailed</small>
          </div>
          <div className="border border-[#E3DDD0] rounded-[10px] px-5 py-3 min-w-[100px]">
            <b className="block text-[19px] font-bold">🔥 {bestStreak}</b>
            <small className="text-xs text-[#6B6560]">Best streak</small>
          </div>
          <div className="border border-[#E3DDD0] rounded-[10px] px-5 py-3 min-w-[100px]">
            <b className="block text-[19px] font-bold text-[#16A34A]">+{XP_POINTS.pronunciation} XP</b>
            <small className="text-xs text-[#6B6560]">Earned</small>
          </div>
        </div>

        {weakWords.length > 0 && (
          <div className="text-left bg-[#FFFBEB] border border-[#FDE68A] rounded-[10px] px-4 py-3 mb-6">
            <b className="block text-[11px] font-bold tracking-[.06em] text-[#B45309] mb-2">
              TOOK A FEW TRIES
            </b>
            <div className="flex flex-wrap gap-2">
              {weakWords.map((w) => (
                <span
                  key={w.id}
                  className="kr inline-flex items-center gap-1.5 text-[13px] font-medium bg-white border border-[#FDE68A] rounded-full px-2.5 py-1"
                >
                  {w.kr}
                  <span className="text-[11px] text-[#A19A8C]">{attempts[w.id]?.best ?? 0}%</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {saveError && (
          <p className="text-[12px] text-[#E11D48] bg-[#FFF1F2] border border-[#FECDD3] rounded-[8px] px-3 py-2 mb-5">
            ⚠️ {saveError}
          </p>
        )}

        <div className="flex justify-center gap-2.5 flex-wrap">
          <Link href="/speaking" className={BTN_TEAL}>
            Back to the trail
          </Link>
          <button
            className={BTN_LINE}
            onClick={() => {
              setIndex(0);
              setNailed([]);
              setStreak(0);
              resetAnswer();
              setFinished(false);
            }}
          >
            Run it back
          </button>
          {cleared && nextChapter && (
            <Link href={`/speaking?chapter=${nextChapter.key}`} className={BTN_LINE}>
              Next: {TIER_META.find((t) => t.tier === nextChapter.tier)!.emoji} {nextChapter.title} →
            </Link>
          )}
        </div>
      </div>
    );
  }

  const verdict = heard !== null ? VERDICTS[verdictFor(score)] : null;

  return (
    <div>
      <Link
        href="/speaking"
        className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#A19A8C] hover:text-[#0D9488] transition-colors mb-3"
      >
        ← Trail
      </Link>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex gap-[7px] flex-wrap">
          {words.map((w, i) => (
            <span
              key={w.id}
              className={`w-[26px] h-1.5 rounded-full transition-colors ${
                i < index ? "bg-[#0D9488]" : i === index ? "bg-[#0D9488] opacity-45" : "bg-[#E3DDD0]"
              }`}
            />
          ))}
        </div>
        {streak >= 2 && (
          <span className="text-[12.5px] font-bold text-[#EA580C]" style={{ animation: "fadeUp .25s ease" }}>
            🔥 {streak} streak
          </span>
        )}
      </div>

      <div
        key={word.id}
        className="max-w-[680px] border border-[#E3DDD0] rounded-[14px] p-[clamp(20px,3vw,28px)]"
        style={{ animation: "fadeUp .35s ease" }}
      >
        <div className="flex items-center justify-between mb-5 gap-2.5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#0D9488] bg-[#F0FDFA] border border-[#99F6E4] rounded-full px-2.5 py-[3px]">
            {meta.emoji} {word.groupTitle}
          </span>
          <span className="text-[12.5px] text-[#A19A8C] font-medium">
            Word {index + 1} of {words.length}
          </span>
        </div>

        <p className={LABEL}>Say this out loud</p>
        <p className="kr font-bold text-[34px] tracking-[-0.01em] leading-[1.2] mb-1">{word.kr}</p>
        <p className="text-[13.5px] text-[#6B6560] mb-5">
          <span className="italic">{word.romanization}</span> · {word.en}
        </p>

        <div className="flex items-start gap-3 bg-[#FAF7EF] border border-[#E3DDD0] rounded-xl px-[18px] py-3.5 mb-5">
          <button
            aria-label="Hear it"
            className="w-11 h-11 rounded-full flex-none bg-[#0D9488] text-white text-[17px] flex items-center justify-center transition-transform hover:scale-105 disabled:opacity-50"
            onClick={() => speak(word.kr)}
            disabled={!ttsOk}
          >
            🔊
          </button>
          <div className="min-w-0">
            <b className="block text-[11px] font-bold tracking-[.06em] text-[#A19A8C] mb-0.5">HOW TO MAKE IT</b>
            <p className="text-[13px] text-[#6B6560] leading-[1.5]">{word.tip}</p>
          </div>
          {isSpeaking && (
            <span className="ml-auto flex-none text-[12px] font-semibold text-[#0D9488] wave-on">speaking…</span>
          )}
        </div>

        {heard === null && (
          <div className="flex flex-col items-center gap-3 mb-2">
            {(bestScores[word.id] ?? 0) >= NAILED_THRESHOLD && (
              <div className="inline-flex items-center gap-2.5 text-[12.5px] font-semibold text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0] rounded-full pl-3 pr-1.5 py-1.5">
                ✓ You&apos;ve nailed this before
                <button
                  className="text-[11.5px] font-bold bg-white border border-[#BBF7D0] rounded-full px-2.5 py-1 hover:bg-[#F0FDF4] transition-colors"
                  onClick={skip}
                >
                  Skip →
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
                            ? "#16A34A"
                            : micElapsedMs / MAX_LISTEN_MS < 0.8
                              ? "#B45309"
                              : "#E11D48"
                        }
                        strokeDasharray={RING_C}
                        strokeDashoffset={RING_C * Math.min(1, micElapsedMs / MAX_LISTEN_MS)}
                        style={{ transition: "stroke .2s linear" }}
                      />
                    </svg>
                  )}
                  <button
                    aria-label={isListening ? "Listening — tap to stop" : "Tap and speak"}
                    onClick={() => listen(grade)}
                    disabled={isListening}
                    className={`absolute rounded-full text-[30px] flex items-center justify-center border-[3px] transition-all ${
                      isListening
                        ? "inset-[9px] bg-[#0D9488] border-transparent text-white wave-on"
                        : "inset-0 bg-[#F0FDFA] border-[#99F6E4] text-[#0D9488] hover:scale-105 hover:bg-[#CCFBF1]"
                    }`}
                  >
                    🎤
                  </button>
                </div>
                <p className="text-[13px] text-[#6B6560] min-h-[20px] text-center">
                  {isListening ? (
                    <>
                      <span className="kr text-[15px] text-[#18181B]">{interim || "Listening…"}</span>
                      <span className="block text-[11.5px] text-[#A19A8C] mt-0.5 tabular-nums">
                        auto-stops in {Math.max(0, (MAX_LISTEN_MS - micElapsedMs) / 1000).toFixed(1)}s
                      </span>
                    </>
                  ) : (
                    "Tap the mic and say it out loud"
                  )}
                </p>
              </>
            )}

            {error && <p className="text-[12.5px] text-[#E11D48] text-center max-w-[420px]">{error}</p>}

            {!showFallback ? (
              <button
                className="text-[12.5px] font-semibold text-[#6B6560] hover:text-[#18181B] transition-colors"
                onClick={() => setTypedFallback(true)}
              >
                Type your answer instead
              </button>
            ) : (
              <div className="w-full max-w-[460px]">
                {!micOk && (
                  <p className="text-[12.5px] text-[#6B6560] mb-2 text-center">
                    Your browser doesn&apos;t support speech recognition — type your answer instead.
                  </p>
                )}
                <textarea
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder="한국어로 입력하세요…"
                  rows={2}
                  className="kr w-full resize-none rounded-[10px] border border-[#E3DDD0] bg-white px-3.5 py-2.5 text-[16px] outline-none focus:border-[#0D9488] transition-colors"
                />
                <div className="flex justify-end mt-2">
                  <button className={BTN_TEAL} disabled={!typed.trim()} onClick={() => grade(typed.trim())}>
                    Check it
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {heard !== null && verdict && (
          <div
            className="border-t border-[#E3DDD0] pt-[18px] grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center"
            style={{ animation: "fadeUp .35s ease" }}
          >
            <div>
              <div className="grid gap-2.5 mb-4">
                <div className="bg-[#FAF7EF] border border-[#E3DDD0] rounded-[10px] px-4 py-3">
                  <b className="block text-[11px] font-bold tracking-[.06em] text-[#A19A8C] mb-1">YOU SAID</b>
                  <p className="kr text-[17px] font-medium">{heard}</p>
                </div>
                <div className="bg-[#F0FDFA] border border-[#99F6E4] rounded-[10px] px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <b className="block text-[11px] font-bold tracking-[.06em] mb-1" style={{ color: TEAL }}>
                        TARGET
                      </b>
                      <p className="kr text-[17px] font-medium">{word.kr}</p>
                    </div>
                    <button
                      aria-label="Replay"
                      className="flex-none text-sm text-[#A19A8C] hover:text-[#0D9488] transition-colors disabled:opacity-40"
                      onClick={() => speak(word.kr)}
                      disabled={!ttsOk}
                    >
                      🔁
                    </button>
                  </div>
                </div>
              </div>

              {saveError && (
                <p className="text-[11.5px] text-[#E11D48] mb-2.5">⚠️ {saveError}</p>
              )}
              <div className="flex gap-2.5">
                <button
                  className={BTN_LINE}
                  onClick={() => {
                    setHeard(null);
                    setTyped("");
                  }}
                >
                  Try again
                </button>
                <button className={BTN_TEAL} onClick={next}>
                  {index + 1 === words.length ? "Finish →" : "Next →"}
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2.5 sm:border-l sm:border-[#E3DDD0] sm:pl-6 flex-none">
              <div
                className="w-[130px] h-[130px] rounded-full flex items-center justify-center"
                style={{ background: `conic-gradient(${verdict.fg} ${animScore * 3.6}deg, #E3DDD0 0)` }}
              >
                <div className="w-[105px] h-[105px] rounded-full bg-white flex flex-col items-center justify-center">
                  <span
                    className="font-bold text-[30px] leading-none tabular-nums"
                    style={{ fontFamily: "var(--font-hand)", color: verdict.fg }}
                  >
                    {animScore}
                  </span>
                  <span className="text-[11px] text-[#A19A8C] font-semibold mt-0.5">% match</span>
                </div>
              </div>
              <span className="text-[13px] font-bold text-center" style={{ color: verdict.fg }}>
                {verdict.text}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
