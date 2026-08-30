"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buttonClassName } from "@/components/ui/Button";
import { Link, useRouter } from "@/i18n/navigation";
import { useSaveResume } from "@/hooks/useSaveResume";
import { createClient } from "@/lib/supabase/client";
import { recordCompletion, type ProgressResult } from "@/lib/activity";
import { useKoreanSpeaker, useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { bestSimilarity, verdictFor } from "@/lib/speech-match";
import { wordsForChapter, orderedChapters, TIER_META, NAILED_THRESHOLD } from "@/lib/pronunciation";
import { playCorrect, playWrong, playStreak, playChapterClear } from "@/lib/sfx";
import FinishedCard from "@/components/pronunciation/FinishedCard";
import AnswerCapture from "@/components/pronunciation/AnswerCapture";
import ScoreResult, { VERDICTS } from "@/components/pronunciation/ScoreResult";
import WordPicker from "@/components/pronunciation/WordPicker";

const MINUTES_PER_SESSION = 4;
// The mic stays open this long before we force it to stop and grade whatever
// it heard — browsers vary a lot in when they'd otherwise cut off on their
// own, so this keeps the countdown ring honest.
const MAX_LISTEN_MS = 6000;

const BTN_LINE = buttonClassName("line");
const LABEL = "text-[11.5px] font-semibold tracking-[.06em] uppercase text-faint mb-2";

// Words within a chapter can be practiced in any order (pick from the list);
// the chapter clears — and the next one unlocks — once every word in it is
// nailed, regardless of the order they were done in.
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

  const [openId, setOpenId] = useState<string | null>(null);
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

  useSaveResume(finished ? null : userId, {
    skill: "pronunciation",
    href: `/speaking?chapter=${chapterKey}`,
    label: chapter?.title ?? chapterKey,
    detail: `Pronunciation · ${meta?.name ?? "chapter"}`,
    progress: words.length ? Math.round((nailed.length / words.length) * 100) : 0,
  });

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

  const word = openId ? words.find((w) => w.id === openId) : undefined;
  const wordNo = word ? words.findIndex((w) => w.id === word.id) + 1 : 0;
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

  function openWord(id: string) {
    setOpenId(id);
    resetAnswer();
  }

  if (!chapter || words.length === 0) {
    return (
      <div className="max-w-[680px] border border-line rounded-[14px] px-7 py-10 text-center">
        <p className="text-[15px] font-semibold mb-1.5">Chapter not found</p>
        <Link href="/speaking" className={BTN_LINE}>
          Back to the trail
        </Link>
      </div>
    );
  }

  async function logMinutesOnce() {
    if (logged.current) return;
    logged.current = true;
    const result = await recordCompletion(supabase, "pronunciation", MINUTES_PER_SESSION);
    if (result?.leveled_up) setLevelUp(result);
    router.refresh();
  }

  // Runs once a word's outcome (graded or skipped) is settled: finishes the
  // chapter if that was the last word left to nail, otherwise sends the
  // learner back to the picker to choose the next one themselves.
  function afterWord(updatedNailed: string[]) {
    if (updatedNailed.length === words.length) {
      setFinished(true);
      playChapterClear();
      void logMinutesOnce();
    } else {
      setOpenId(null);
      resetAnswer();
    }
  }

  function grade(text: string) {
    if (!word) return;
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
    if (!word) return;
    const updated = nailed.includes(word.id) ? nailed : [...nailed, word.id];
    setNailed(updated);
    afterWord(updated);
  }

  if (finished) {
    return (
      <FinishedCard
        words={words}
        nailed={nailed}
        bestStreak={bestStreak}
        levelUp={levelUp}
        attempts={attempts}
        saveError={saveError}
        meta={meta}
        nextChapter={nextChapter}
        onRunItBack={() => {
          setOpenId(null);
          setNailed([]);
          setStreak(0);
          resetAnswer();
          setFinished(false);
        }}
      />
    );
  }

  if (!word) {
    return (
      <>
        <Link
          href="/speaking"
          className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-faint hover:text-teal transition-colors mb-3"
        >
          ← Trail
        </Link>
        <WordPicker
          chapterTitle={chapter.title}
          chapterTip={chapter.tip}
          meta={meta}
          words={words}
          nailed={nailed}
          bestScores={bestScores}
          onOpenWord={openWord}
        />
      </>
    );
  }

  const verdict = heard !== null ? VERDICTS[verdictFor(score)] : null;
  const allNailed = nailed.length === words.length;

  return (
    <div>
      <button
        onClick={() => {
          setOpenId(null);
          resetAnswer();
        }}
        className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-faint hover:text-teal transition-colors mb-3"
      >
        ← All words
      </button>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex gap-[7px] flex-wrap">
          {words.map((w) => (
            <span
              key={w.id}
              className={`w-[26px] h-1.5 rounded-full transition-colors ${
                nailed.includes(w.id) ? "bg-teal" : w.id === word.id ? "bg-teal opacity-45" : "bg-line"
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
        className="max-w-[680px] border border-line rounded-[14px] p-[clamp(20px,3vw,28px)]"
        style={{ animation: "fadeUp .35s ease" }}
      >
        <div className="flex items-center justify-between mb-5 gap-2.5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-teal bg-[var(--tint-teal)] border border-[var(--tint-teal-line)] rounded-full px-2.5 py-[3px]">
            {meta.emoji} {word.groupTitle}
          </span>
          <span className="text-[12.5px] text-faint font-medium">
            Word {wordNo} of {words.length}
          </span>
        </div>

        <p className={LABEL}>Say this out loud</p>
        <p className="kr font-bold text-[34px] tracking-[-0.01em] leading-[1.2] mb-1">{word.kr}</p>
        <p className="text-[13.5px] text-muted mb-5">
          <span className="italic">{word.romanization}</span> · {word.en}
        </p>

        <div className="flex items-start gap-3 bg-warm border border-line rounded-xl px-[18px] py-3.5 mb-5">
          <button
            aria-label="Hear it"
            className="w-11 h-11 rounded-full flex-none bg-teal text-white text-[17px] flex items-center justify-center transition-transform hover:scale-105 disabled:opacity-50"
            onClick={() => speak(word.kr)}
            disabled={!ttsOk}
          >
            🔊
          </button>
          <div className="min-w-0">
            <b className="block text-[11px] font-bold tracking-[.06em] text-faint mb-0.5">HOW TO MAKE IT</b>
            <p className="text-[13px] text-muted leading-[1.5]">{word.tip}</p>
          </div>
          {isSpeaking && (
            <span className="ml-auto flex-none text-[12px] font-semibold text-teal wave-on">speaking…</span>
          )}
        </div>

        {heard === null && (
          <AnswerCapture
            bestScore={bestScores[word.id] ?? 0}
            micOk={micOk}
            isListening={isListening}
            micElapsedMs={micElapsedMs}
            interim={interim}
            error={error}
            typed={typed}
            setTyped={setTyped}
            showFallback={showFallback}
            setTypedFallback={setTypedFallback}
            onListen={() => listen(grade)}
            onSkip={skip}
            onCheck={() => grade(typed.trim())}
          />
        )}

        {heard !== null && verdict && (
          <ScoreResult
            heard={heard}
            targetKr={word.kr}
            verdict={verdict}
            animScore={animScore}
            saveError={saveError}
            ttsOk={ttsOk}
            onReplay={() => speak(word.kr)}
            onTryAgain={() => {
              setHeard(null);
              setTyped("");
            }}
            onNext={() => afterWord(nailed)}
            isFinishing={allNailed}
          />
        )}
      </div>
    </div>
  );
}
