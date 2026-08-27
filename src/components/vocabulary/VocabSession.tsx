"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { recordCompletion, type ProgressResult } from "@/lib/activity";
import { nextBox, nextReviewAt } from "@/lib/srs";
import { prefetchKorean, speakKorean } from "@/lib/tts";
import WORD_NOTES from "@/lib/vocabulary-data/word-notes.json";
import {
  MINUTES_PER_SESSION,
  VOCAB_ROOTS,
  buildQuizQuestions,
  type QuizQuestion,
  type VocabWordWithProgress,
} from "@/lib/vocabulary";

const QUIZ_BONUS_MINUTES = 3;

type Phase = "flip" | "quizIntro" | "quiz" | "summary";
type Counts = { correct: number; incorrect: number };

// Growth stage of a word, from how many times it's been reviewed.
const STAGE_META = [
  { label: "🌰 Seed", cls: "bg-[#FFFBEB] text-amber" },
  { label: "🌱 Sprout", cls: "bg-success-bg text-success" },
  { label: "🌿 Rooting", cls: "bg-[#DCFCE7] text-success-deep" },
  { label: "🌳 Settled", cls: "bg-[#166534] text-white" },
];

function stageFor(reviews: number): number {
  if (reviews <= 0) return 0;
  if (reviews === 1) return 1;
  if (reviews <= 3) return 2;
  return 3;
}

const BTN_VIOLET =
  "rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-white bg-[#7C3AED] hover:bg-[#6D28D9] transition-colors disabled:opacity-60";
const BTN_INK =
  "rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-white bg-charcoal hover:bg-[#3F3F46] transition-colors disabled:opacity-60";
const BTN_LINE =
  "rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-charcoal bg-white border border-line hover:bg-warm transition-colors disabled:opacity-60";
const CARD = "max-w-[560px] border border-line rounded-[14px] p-[clamp(20px,3vw,28px)]";

// A generated word note is either a hanja breakdown like
// "시(試 to test) + 험(驗 to examine)" or a loanword origin like
// "from English \"coffee\"" — parse it back into structure for the memo note.
type Morpheme = { syllable: string; hanja: string; gloss: string };
function parseMorphemeNote(
  note: string
): { parts: Morpheme[]; origin?: never } | { origin: string; parts?: never } | null {
  if (note.startsWith("from ")) return { origin: note.slice(5) };
  const parts = Array.from(note.matchAll(/([가-힣]+)\(([^\s)]+) ([^)]+)\)/g)).map((m) => ({
    syllable: m[1],
    hanja: m[2],
    gloss: m[3],
  }));
  return parts.length >= 2 ? { parts } : null;
}

// Sticky-note memo showing the word's building blocks (시 = 試 "to test" …).
function MorphemeNote({
  data,
  className = "",
}: {
  data: NonNullable<ReturnType<typeof parseMorphemeNote>>;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="relative bg-[#FFF9DB] border border-[#EDE3B4] rounded-[6px] px-4 pt-4 pb-3 text-left shadow-[0_5px_12px_rgba(0,0,0,0.07)]">
        {/* washi-tape strip */}
        <span
          aria-hidden="true"
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-[58px] h-[15px] bg-[#D8F0DD] opacity-90 rounded-[2px] rotate-[-3deg]"
        />
        <p className="text-[10.5px] font-bold tracking-[0.08em] uppercase text-[#A08F4E] mb-2">
          {data.parts ? "Word parts" : "Word origin"}
        </p>
        {data.parts ? (
          <div className="flex flex-col gap-1.5">
            {data.parts.map((p) => (
              <div key={p.syllable + p.hanja} className="flex items-baseline gap-2">
                <span className="kr text-[17px] font-bold text-charcoal leading-none">
                  {p.syllable}
                </span>
                <span className="kr text-[13px] text-[#A08F4E]">{p.hanja}</span>
                <span className="text-[12px] text-muted leading-[1.4]">{p.gloss}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12.5px] text-muted leading-[1.5]">from {data.origin}</p>
        )}
      </div>
    </div>
  );
}

export default function VocabSession({
  words,
  userId,
  topicLabel,
  topicKey,
  chapterIndex,
  hasNextChapter,
}: {
  words: VocabWordWithProgress[];
  userId: string;
  topicLabel: string;
  topicKey: string;
  chapterIndex: number;
  hasNextChapter: boolean;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [phase, setPhase] = useState<Phase>("flip");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [tricky, setTricky] = useState(0);
  const [navigating, setNavigating] = useState(false);

  // A refresh mid-session shouldn't restart the chapter — restore the flip-pass
  // position from sessionStorage. Restored in an effect (not the initializer)
  // so server and client render the same first frame.
  const resumeKey = `kroot-vocab-${topicKey}-${chapterIndex}-${words[0]?.level ?? ""}`;
  useEffect(() => {
    void Promise.resolve().then(() => {
      try {
        const raw = sessionStorage.getItem(resumeKey);
        if (!raw) return;
        const saved = JSON.parse(raw) as { index: number; known: number; tricky: number; phase: Phase };
        if (saved.phase === "quizIntro" || (saved.phase === "flip" && saved.index > 0 && saved.index < words.length)) {
          setIndex(Math.min(saved.index, words.length - 1));
          setKnown(saved.known);
          setTricky(saved.tricky);
          setPhase(saved.phase === "quizIntro" ? "quizIntro" : "flip");
        }
      } catch {
        // Corrupt or unavailable storage — just start fresh.
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveResume(next: { index: number; known: number; tricky: number; phase: Phase }) {
    try {
      sessionStorage.setItem(resumeKey, JSON.stringify(next));
    } catch {}
  }

  function clearResume() {
    try {
      sessionStorage.removeItem(resumeKey);
    } catch {}
  }

  // Local source of truth for each word's counts, seeded from props and kept
  // current across both the flip pass and the quiz pass on the same words.
  const [counts, setCounts] = useState<Record<string, Counts>>(() =>
    Object.fromEntries(words.map((w) => [w.key, { correct: w.correct_count, incorrect: w.incorrect_count }]))
  );
  // Leitner boxes for spaced repetition; answering twice in one session
  // (flip + quiz) legitimately moves a word two boxes.
  const [boxes, setBoxes] = useState<Record<string, number>>(() =>
    Object.fromEntries(words.map((w) => [w.key, w.box ?? 1]))
  );

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizKnown, setQuizKnown] = useState(0);
  const [quizTricky, setQuizTricky] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [tookQuiz, setTookQuiz] = useState(false);
  const [levelUp, setLevelUp] = useState<ProgressResult | null>(null);
  const [rootOpen, setRootOpen] = useState(false);
  const loggedMinutes = useRef(false);

  const word = words[index];

  // Warm the next few cards' audio so the speaker button plays instantly.
  useEffect(() => {
    prefetchKorean(
      words.slice(index, index + 3).flatMap((w) => [
        w.korean,
        w.example_kr,
        ...(w.moreExamples ?? []).map((e) => e.kr),
      ].filter(Boolean))
    );
  }, [index, words]);

  async function saveProgress(wordKey: string, gotIt: boolean) {
    const prev = counts[wordKey] ?? { correct: 0, incorrect: 0 };
    const next: Counts = {
      correct: prev.correct + (gotIt ? 1 : 0),
      incorrect: prev.incorrect + (gotIt ? 0 : 1),
    };
    setCounts((c) => ({ ...c, [wordKey]: next }));

    const box = nextBox(boxes[wordKey] ?? 1, gotIt);
    setBoxes((b) => ({ ...b, [wordKey]: box }));

    const { error } = await supabase.from("vocabulary_progress").upsert(
      {
        user_id: userId,
        word_key: wordKey,
        correct_count: next.correct,
        incorrect_count: next.incorrect,
        last_reviewed_at: new Date().toISOString(),
        box,
        next_review_at: nextReviewAt(box),
      },
      { onConflict: "user_id,word_key" }
    );
    // Before migration 0022 the box columns don't exist — keep counts working.
    if (error) {
      await supabase.from("vocabulary_progress").upsert(
        {
          user_id: userId,
          word_key: wordKey,
          correct_count: next.correct,
          incorrect_count: next.incorrect,
          last_reviewed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,word_key" }
      );
    }
  }

  async function answerFlip(gotIt: boolean) {
    await saveProgress(word.key, gotIt);
    const nextKnown = known + (gotIt ? 1 : 0);
    const nextTricky = tricky + (gotIt ? 0 : 1);
    if (gotIt) setKnown(nextKnown);
    else setTricky(nextTricky);

    setFlipped(false);
    setRootOpen(false);
    if (index + 1 < words.length) {
      setIndex((i) => i + 1);
      saveResume({ index: index + 1, known: nextKnown, tricky: nextTricky, phase: "flip" });
    } else {
      setPhase("quizIntro");
      saveResume({ index, known: nextKnown, tricky: nextTricky, phase: "quizIntro" });
    }
  }

  function startQuiz() {
    setQuizQuestions(buildQuizQuestions(words));
    setQuizIndex(0);
    setQuizKnown(0);
    setQuizTricky(0);
    setTookQuiz(true);
    setPhase("quiz");
  }

  async function answerQuiz(option: string) {
    if (selected) return;
    setSelected(option);
    const q = quizQuestions[quizIndex];
    const gotIt = option === (q.mode === "meaning" ? q.word.meaning_en : q.word.korean);
    await saveProgress(q.word.key, gotIt);
    if (gotIt) setQuizKnown((k) => k + 1);
    else setQuizTricky((t) => t + 1);

    setTimeout(() => {
      setSelected(null);
      if (quizIndex + 1 < quizQuestions.length) {
        setQuizIndex((i) => i + 1);
      } else {
        setPhase("summary");
        void logMinutesOnce();
      }
    }, 700);
  }

  async function logMinutesOnce() {
    if (loggedMinutes.current) return;
    loggedMinutes.current = true;
    clearResume();

    const minutes = MINUTES_PER_SESSION + (tookQuiz ? QUIZ_BONUS_MINUTES : 0);
    const result = await recordCompletion(supabase, "vocabulary", minutes);
    if (result?.leveled_up) setLevelUp(result);
  }

  async function goTo(href: string) {
    setNavigating(true);
    await logMinutesOnce();
    router.push(href);
    router.refresh();
  }

  if (words.length === 0) {
    return (
      <div className={`${CARD} text-center`}>
        <p className="font-bold text-[17px] tracking-[-0.01em] mb-1.5">No words here yet</p>
        <p className="text-sm text-muted mb-5">This chapter doesn&apos;t have cards yet — try another one.</p>
        <Link href="/vocabulary" className={BTN_INK}>
          Back to topics
        </Link>
      </div>
    );
  }

  if (phase === "quizIntro") {
    return (
      <div className={`${CARD} text-center`} style={{ animation: "fadeUp .35s ease" }}>
        <p className="text-3xl mb-2">🎯</p>
        <h2 className="font-bold text-[19px] tracking-[-0.02em] mb-1.5">Chapter quiz</h2>
        <p className="text-sm text-muted mb-6">
          {known} of {words.length} felt easy. Ready to fill in the blanks?
        </p>
        <div className="flex justify-center gap-2.5 flex-wrap">
          <button className={BTN_VIOLET} onClick={startQuiz}>
            Start the quiz →
          </button>
          <button
            className={BTN_LINE}
            onClick={() => {
              setPhase("summary");
              void logMinutesOnce();
            }}
          >
            Skip the quiz
          </button>
        </div>
      </div>
    );
  }

  if (phase === "quiz") {
    const q = quizQuestions[quizIndex];
    const quizPct = quizQuestions.length ? (quizIndex / quizQuestions.length) * 100 : 0;
    return (
      <div className={CARD}>
        <div className="flex justify-between items-center mb-2.5 text-[12.5px] font-medium text-faint">
          <span>
            Quiz · Question {quizIndex + 1} of {quizQuestions.length}
          </span>
          <span>{quizKnown} correct</span>
        </div>
        <div className="h-1.5 bg-line rounded-full overflow-hidden mb-6">
          <i
            className="not-italic block h-full bg-[#7C3AED] rounded-full transition-[width] duration-300"
            style={{ width: `${quizPct}%` }}
          />
        </div>

        {q.mode === "meaning" ? (
          <>
            <p className="kr text-[clamp(30px,5vw,40px)] text-center mb-1">{q.prompt}</p>
            <p className="text-[13px] text-muted mb-6 text-center">{q.word.romanization}</p>
          </>
        ) : (
          <>
            <p className="kr text-[clamp(18px,3vw,22px)] leading-[1.6] mb-1.5 text-center">{q.prompt}</p>
            {q.word.example_en && (
              <p className="text-[13px] text-muted mb-6 text-center">{q.word.example_en}</p>
            )}
          </>
        )}

        <div className={q.mode === "meaning" ? "grid grid-cols-1 gap-2.5" : "grid grid-cols-2 gap-2.5"}>
          {q.options.map((opt) => {
            const correctAnswer = q.mode === "meaning" ? q.word.meaning_en : q.word.korean;
            const isCorrect = opt === correctAnswer;
            const show = selected !== null;
            const state = !show ? "idle" : isCorrect ? "correct" : opt === selected ? "wrong" : "idle";
            return (
              <button
                key={opt}
                onClick={() => answerQuiz(opt)}
                disabled={show}
                className={`${
                  q.mode === "blank" ? "kr text-base" : "text-[14.5px]"
                } text-left px-4 py-[13px] rounded-[10px] font-medium transition-all border-[1.5px] disabled:cursor-default ${
                  state === "correct"
                    ? "border-success bg-success-bg"
                    : state === "wrong"
                    ? "border-danger bg-danger-bg"
                    : show
                    ? "border-line bg-white opacity-90"
                    : "border-line bg-white hover:border-[#7C3AED] hover:bg-[#F5F3FF]"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (phase === "summary") {
    return (
      <div className={`${CARD} text-center`} style={{ animation: "fadeUp .4s ease" }}>
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
        </svg>
        <h2 className="font-bold text-[21px] tracking-[-0.02em] mt-3 mb-1.5">
          {words.length} words watered today! 🌱
        </h2>
        <p className="text-sm text-muted mb-[22px]">Those words are rooted a little deeper now.</p>
        {levelUp && (
          <p className="text-sm font-semibold text-success mb-[22px] -mt-3">
            🎉 Level up! You&apos;re now Lv. {levelUp.new_level}
          </p>
        )}

        <div className="flex justify-center gap-3 mb-6 flex-wrap">
          <div className="border border-line rounded-[10px] px-5 py-3 min-w-[100px]">
            <b className="block text-[19px] font-bold text-success">{known}</b>
            <small className="text-xs text-muted">Marked known</small>
          </div>
          <div className="border border-line rounded-[10px] px-5 py-3 min-w-[100px]">
            <b className="block text-[19px] font-bold">{tricky}</b>
            <small className="text-xs text-muted">Still learning</small>
          </div>
          {tookQuiz && (
            <div className="border border-line rounded-[10px] px-5 py-3 min-w-[100px]">
              <b className="block text-[19px] font-bold text-success">
                {quizKnown}/{quizKnown + quizTricky}
              </b>
              <small className="text-xs text-muted">Quiz</small>
            </div>
          )}
        </div>

        <span className="inline-flex items-center gap-2 bg-success-bg border border-success-line rounded-full px-[18px] py-2 text-[13.5px] font-semibold text-success mb-6">
          💧 Vocabulary · chapter watered
        </span>

        <div className="flex justify-center gap-2.5 flex-wrap">
          <button
            className="rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-white bg-success hover:bg-success-deep transition-colors disabled:opacity-60"
            onClick={() => goTo(`/vocabulary?level=${words[0].level}`)}
            disabled={navigating}
          >
            {navigating ? "Saving…" : "Choose another unit"}
          </button>
          {hasNextChapter && (
            <button
              className={BTN_LINE}
              onClick={() =>
                goTo(`/vocabulary/${topicKey}/session?chapter=${chapterIndex + 1}&level=${words[0].level}`)
              }
              disabled={navigating}
            >
              {navigating ? "Saving…" : `${words.length} more words`}
            </button>
          )}
        </div>
      </div>
    );
  }

  const wordCounts = counts[word.key] ?? { correct: 0, incorrect: 0 };
  const stage = STAGE_META[stageFor(wordCounts.correct + wordCounts.incorrect)];
  const root = word.root ? VOCAB_ROOTS[word.root] : undefined;
  // Generated morpheme memo — hanja breakdown for Sino-Korean words,
  // origin for loanwords ("" for native/uncertain words).
  const morphemeNote = (WORD_NOTES as Record<string, string>)[word.korean] || null;
  const morpheme = morphemeNote ? parseMorphemeNote(morphemeNote) : null;

  return (
    <div className="max-w-[640px]">
      {/* progress dots + daily counter */}
      <div className="flex items-center justify-between gap-3 mb-[18px]">
        <div className="flex gap-[7px]">
          {words.map((w, k) => (
            <span
              key={w.key}
              className={`w-[26px] h-1.5 rounded-full ${
                k < index ? "bg-[#7C3AED]" : k === index ? "bg-[#7C3AED] opacity-40" : "bg-line"
              }`}
            />
          ))}
        </div>
        <span className="text-[13px] text-muted flex-none">
          Today: <b className="text-[#7C3AED]">{index}</b> of {words.length} words
        </span>
      </div>

      {/* word card */}
      <div className="relative border border-line rounded-[16px] p-[clamp(24px,4vw,34px)] text-center">
        {/* desktop: sticky-note memo in the empty space to the right */}
        {flipped && morpheme && (
          <MorphemeNote
            data={morpheme}
            className="hidden xl:block absolute left-full top-8 ml-7 w-[220px] rotate-[1.5deg]"
          />
        )}
        <span
          className={`absolute top-5 right-5 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-[5px] ${stage.cls}`}
        >
          {stage.label}
        </span>

        <p className="text-xs font-semibold text-[#7C3AED] mb-1.5">
          {topicLabel} · {word.level} · word {index + 1} of {words.length}
        </p>
        <p className="kr text-[clamp(36px,6vw,46px)] mt-1.5 mb-1">
          <button
            type="button"
            onClick={() => speakKorean(word.korean)}
            title="Hear it"
            className="inline-flex items-baseline gap-2.5 hover:text-[#7C3AED] transition-colors"
          >
            {word.korean}
            <span aria-hidden="true" className="text-[20px] translate-y-[-4px]">🔊</span>
          </button>
        </p>
        <p className="text-[13.5px] text-faint mb-4">{word.romanization}</p>

        {flipped ? (
          <>
            <p
              className="text-[19px] font-semibold mb-4"
              style={{ animation: "fadeUp .3s ease" }}
            >
              {word.meaning_en}
            </p>
            {morpheme && (
              <MorphemeNote
                data={morpheme}
                className="xl:hidden -mt-1 mb-5 mx-auto w-[min(260px,100%)] rotate-[-1deg]"
              />
            )}
            <div className="grid gap-2.5 mb-[22px]" style={{ animation: "fadeUp .3s ease" }}>
              <div className="bg-warm border border-line rounded-[10px] px-4 py-3.5 text-left">
                <p className="kr text-[15px] font-medium mb-[3px]">
                  <button
                    type="button"
                    onClick={() => speakKorean(word.example_kr)}
                    title="Hear the sentence"
                    className="text-left hover:text-[#7C3AED] transition-colors"
                  >
                    {word.example_kr} <span aria-hidden="true" className="text-[12px]">🔊</span>
                  </button>
                </p>
                <p className="text-[13px] text-muted">{word.example_en}</p>
              </div>
              {word.moreExamples?.map((ex, i) => (
                <div
                  key={i}
                  className="bg-white border border-dashed border-line rounded-[10px] px-4 py-3.5 text-left"
                >
                  <p className="flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.05em] uppercase text-faint mb-1.5">
                    {ex.source === "reading" ? "📖 Seen in Reading" : "🎧 Seen in Listening"}
                  </p>
                  <p className="kr text-[15px] font-medium mb-[3px]">
                    <button
                      type="button"
                      onClick={() => speakKorean(ex.kr)}
                      title="Hear the sentence"
                      className="text-left hover:text-[#7C3AED] transition-colors"
                    >
                      {ex.kr} <span aria-hidden="true" className="text-[12px]">🔊</span>
                    </button>
                  </p>
                  <p className="text-[13px] text-muted">{ex.en}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2.5 justify-center flex-wrap">
              <button
                className="rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-danger bg-white border-[1.5px] border-[#FECACA] hover:bg-danger-bg transition-colors"
                onClick={() => answerFlip(false)}
              >
                Still learning
              </button>
              <button className={BTN_VIOLET} onClick={() => answerFlip(true)}>
                I know this →
              </button>
            </div>
          </>
        ) : (
          <button
            className="border-[1.5px] border-dashed border-[#DDD6FE] rounded-[10px] bg-[#F5F3FF] px-[22px] py-3 text-[13.5px] font-semibold text-[#7C3AED] mb-1"
            onClick={() => setFlipped(true)}
          >
            👀 Reveal meaning
          </button>
        )}
      </div>

      {/* bonus root banner */}
      {root && !rootOpen && (
        <div className="mt-4 border border-dashed border-[#DDD6FE] rounded-[14px] bg-[#F5F3FF] px-5 py-4 flex items-center gap-3.5">
          <span className="w-[38px] h-[38px] rounded-[10px] bg-[#7C3AED] text-white flex items-center justify-center font-bold text-[17px] flex-none kr">
            {root.syllable}
          </span>
          <div className="min-w-0">
            <b className="block text-[13.5px] font-semibold">Bonus root: {root.name}</b>
            <span className="text-[12.5px] text-[#6D28D9]">A few more words that share this root</span>
          </div>
          <button
            className="ml-auto flex-none bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg px-4 py-2 text-[12.5px] font-semibold transition-colors"
            onClick={() => setRootOpen(true)}
          >
            Explore →
          </button>
        </div>
      )}

      {/* root explore panel */}
      {root && rootOpen && (
        <div className="mt-2.5 border border-[#DDD6FE] rounded-[14px] bg-white px-[22px] py-5" style={{ animation: "fadeUp .3s ease" }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-xl bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center kr text-xl flex-none">
                {root.syllable}
              </span>
              <div>
                <b className="block text-[15px] font-bold">{root.name}</b>
                <span className="text-[12.5px] text-muted">{root.desc}</span>
              </div>
            </div>
            <button
              className="border-none bg-warm w-7 h-7 rounded-lg text-faint hover:text-charcoal text-[13px]"
              onClick={() => setRootOpen(false)}
              aria-label="Close root panel"
            >
              ✕
            </button>
          </div>
          <div className="grid gap-2.5">
            {root.words.map(([kr, meaning]) => (
              <div key={kr} className="flex items-center gap-3 border border-line rounded-[10px] px-3.5 py-[11px] bg-warm">
                <span className="kr text-lg flex-none min-w-[52px]">{kr}</span>
                <span className="text-[13px] text-muted">
                  <b className="text-charcoal font-semibold">{meaning}</b>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
