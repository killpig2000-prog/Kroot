"use client";

import { useMemo, useState } from "react";
import { buttonClassName } from "@/components/ui/Button";
import Link from "next/link";
import { speakKorean } from "@/lib/tts";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import {
  COOLDOWN_HOURS,
  SKILL_LABELS,
  servedKeysOf,
  testVerdict,
  type McqQuestion,
  type ServedPromotionTest,
  type SkillScores,
} from "@/lib/promotion-test";
import { SPECIES } from "@/lib/tree";
import { treeStageForLevel } from "@/lib/level";
import TreeEvolution from "@/components/level-test/TreeEvolution";

// The promotion test: listening MCQ → reading MCQ → writing (AI) → speaking
// (AI over a speech transcript) → verdict. Pass → apply_level_test RPC.

type Stage = "intro" | "listening" | "reading" | "writing" | "speaking" | "grading" | "result";

const BTN_GREEN = buttonClassName("success");
const BTN_LINE = buttonClassName("line");

function speak(text: string) {
  speakKorean(text);
}

function Mcq({
  questions,
  showKr,
  onDone,
  title,
  passage,
}: {
  questions: McqQuestion[];
  showKr: boolean;
  onDone: (correct: number) => void;
  title: string;
  passage?: string;
}) {
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const qq = questions[index];

  function answer(opt: string) {
    if (selected !== null) return;
    setSelected(opt);
    const next = correct + (opt === qq.answer ? 1 : 0);
    setCorrect(next);
    setTimeout(() => {
      setSelected(null);
      if (index + 1 < questions.length) setIndex((i) => i + 1);
      else onDone(next);
    }, opt === qq.answer ? 600 : 1300);
  }

  return (
    <div>
      <p className="text-[11px] font-bold tracking-[.07em] uppercase text-faint mb-2">
        {title} · {index + 1}/{questions.length}
      </p>
      {passage && (
        <p className="kr border border-line bg-warm rounded-[12px] px-4 py-3 text-[15.5px] leading-[1.8] mb-4">
          {passage}
        </p>
      )}
      {qq.kr && !showKr && (
        <button
          onClick={() => speak(qq.kr)}
          className="mb-3 w-14 h-14 rounded-full bg-[#FF9E7D] text-white text-[22px] shadow-[0_3px_0_#f08560]"
          aria-label="Play audio"
        >
          🔊
        </button>
      )}
      <p className="font-bold text-[16px] mb-3">{qq.question}</p>
      <div className="grid gap-2">
        {qq.options.map((opt) => {
          const isAnswer = opt === qq.answer;
          const cls =
            selected === null
              ? "border-line bg-white hover:border-success"
              : isAnswer
                ? "border-success bg-success-bg font-bold"
                : selected === opt
                  ? "border-[#EF4444] bg-danger-bg"
                  : "border-line bg-white opacity-60";
          return (
            <button
              key={opt}
              onClick={() => answer(opt)}
              className={`text-left border-[1.5px] rounded-[12px] px-4 py-3 text-[14.5px] transition-colors ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function TestRunner({
  userId,
  spec,
  playerLevel = 1,
}: {
  userId: string;
  spec: ServedPromotionTest;
  /** Numeric Lv.1-30 — sizes the tree in the pass animation. */
  playerLevel?: number;
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const speech = useSpeechRecognition("ko-KR");
  const totalReadingQuestions = spec.reading.reduce((n, set) => n + set.questions.length, 0);

  const [stage, setStage] = useState<Stage>("intro");
  const [listeningCorrect, setListeningCorrect] = useState(0);
  const [readingSet, setReadingSet] = useState(0);
  const [readingCorrect, setReadingCorrect] = useState(0);
  const [writingText, setWritingText] = useState("");
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState<{ writing?: string; speaking?: string }>({});
  const [scores, setScores] = useState<SkillScores | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [promoted, setPromoted] = useState(false);

  async function gradeFree(kind: "writing" | "speaking", prompt: string, answer: string) {
    const res = await fetch("/api/level-test/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, prompt, answer, from_level: spec.from, to_level: spec.to }),
    });
    if (!res.ok) throw new Error("grading_failed");
    return (await res.json()) as { score: number; feedback_en: string };
  }

  async function finish() {
    setStage("grading");
    setError(null);
    try {
      const [w, s] = await Promise.all([
        gradeFree("writing", spec.writing.prompt, writingText),
        gradeFree("speaking", spec.speaking.prompt, transcript),
      ]);
      const skillScores: SkillScores = {
        listening: Math.round((listeningCorrect / spec.listening.length) * 100),
        reading: Math.round((readingCorrect / totalReadingQuestions) * 100),
        writing: w.score,
        speaking: s.score,
      };
      setFeedback({ writing: w.feedback_en, speaking: s.feedback_en });
      setScores(skillScores);

      const verdict = testVerdict(skillScores);
      const row = {
        user_id: userId,
        result_level: verdict.passed ? spec.to : spec.from,
        score: verdict.avg,
        total_questions: 100,
        details: {
          ...skillScores,
          passed: verdict.passed,
          weakest: verdict.weakest,
          target_level: spec.to,
          servedKeys: servedKeysOf(spec),
        },
      };
      // details column arrives with migration 0014; fall back without it.
      const ins = await supabase.from("level_test_results").insert(row);
      if (ins.error) {
        const { details: _details, ...basic } = row;
        void _details;
        await supabase.from("level_test_results").insert(basic);
      }

      if (verdict.passed) {
        const { error: applyErr } = await supabase.rpc("apply_level_test", { p_level: spec.to });
        if (!applyErr) {
          setPromoted(true);
          // The big evolution moment happens right here — don't repeat the
          // dashboard's promotion banner on top of it.
          localStorage.setItem("kroot-tree-species", spec.to);
        }
        router.refresh();
      }
      setStage("result");
    } catch {
      setError("Grading failed. Please try again in a moment.");
      setStage("speaking");
    }
  }

  if (stage === "intro") {
    return (
      <div className="border border-line rounded-[14px] p-6">
        <b className="block text-[16px] mb-1.5">
          {spec.from} → {spec.to} Level-Up Test
        </b>
        <p className="text-[13.5px] text-muted mb-3">
          Listening ({spec.listening.length}) → Reading ({totalReadingQuestions} questions over {spec.reading.length} passage{spec.reading.length > 1 ? "s" : ""}) → Writing (1) → Speaking (1). Writing and speaking are graded by an AI teacher. Questions are drawn at random each attempt.
        </p>
        <p className="text-[12.5px] text-faint mb-4">
          To pass: 70+ average with every skill at 60+. Failing is fine — practice your weakest skill and retake after {COOLDOWN_HOURS} hours.
        </p>
        <button onClick={() => setStage("listening")} className={BTN_GREEN}>
          Start
        </button>
      </div>
    );
  }

  if (stage === "listening") {
    return (
      <div className="border border-line rounded-[14px] p-6">
        <Mcq
          title="1 · Listening — tap 🔊, then answer"
          questions={spec.listening}
          showKr={false}
          onDone={(c) => {
            setListeningCorrect(c);
            setStage("reading");
          }}
        />
      </div>
    );
  }

  if (stage === "reading") {
    const set = spec.reading[readingSet];
    return (
      <div className="border border-line rounded-[14px] p-6">
        <Mcq
          key={readingSet}
          title={`2 · Reading — passage ${readingSet + 1}/${spec.reading.length}`}
          questions={set.questions}
          showKr
          passage={set.passage}
          onDone={(c) => {
            setReadingCorrect((total) => total + c);
            if (readingSet + 1 < spec.reading.length) setReadingSet(readingSet + 1);
            else setStage("writing");
          }}
        />
      </div>
    );
  }

  if (stage === "writing") {
    return (
      <div className="border border-line rounded-[14px] p-6">
        <p className="text-[11px] font-bold tracking-[.07em] uppercase text-faint mb-2">3 · Writing</p>
        <p className="font-bold text-[15.5px] mb-1">{spec.writing.promptKr}</p>
        <p className="text-[13px] text-muted mb-3">{spec.writing.prompt}</p>
        <textarea
          value={writingText}
          onChange={(e) => setWritingText(e.target.value)}
          rows={5}
          className="kr w-full border-[1.5px] border-line rounded-[12px] px-4 py-3 text-[15px] focus:border-success outline-none"
          placeholder="Write your answer in Korean…"
        />
        <div className="mt-3">
          <button
            onClick={() => setStage("speaking")}
            disabled={writingText.trim().length < 10}
            className={BTN_GREEN}
          >
            Next: Speaking →
          </button>
        </div>
      </div>
    );
  }

  if (stage === "speaking" || stage === "grading") {
    const grading = stage === "grading";
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
                  : speech.listen((t) => setTranscript((prev) => `${prev} ${t}`.trim()))
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
          <button onClick={finish} disabled={grading || transcript.trim().length < 5} className={BTN_GREEN}>
            {grading ? "AI grading…" : "Submit for grading"}
          </button>
          {grading && <span className="text-[12.5px] text-faint">Grading your writing & speaking (~10s)</span>}
        </div>
      </div>
    );
  }

  // result
  const verdict = scores ? testVerdict(scores) : null;
  return (
    <div className="border border-line rounded-[14px] p-6">
      {verdict?.passed ? (
        <div className="text-center mb-5">
          <TreeEvolution from={spec.from} to={spec.to} stage={treeStageForLevel(playerLevel)} />
          <b className="text-[19px] block mt-2">Congratulations! You leveled up to {spec.to}!</b>
          <p className="text-[13.5px] text-muted mt-1">
            Your {SPECIES[spec.from].name} grew into a <b>{SPECIES[spec.to].name}</b>.{" "}
            {promoted
              ? `${spec.to} content and the ${spec.to} league are now open.`
              : "We couldn\u2019t apply the promotion — check your profile shortly."}
          </p>
        </div>
      ) : (
        <div className="text-center mb-5">
          <p className="text-[34px] mb-1">🌱</p>
          <b className="text-[19px]">Not quite yet — but you&apos;re close!</b>
          <p className="text-[13.5px] text-muted mt-1">You can try again in {COOLDOWN_HOURS} hours.</p>
        </div>
      )}

      {scores && (
        <div className="grid gap-2 mb-4">
          {(Object.keys(scores) as (keyof SkillScores)[]).map((k) => (
            <div key={k} className="flex items-center gap-3">
              <span className="flex-none w-[72px] text-[13px] font-semibold">
                {SKILL_LABELS[k].en}
              </span>
              <span className="flex-1 h-2.5 rounded-full bg-[#F5F5F4] overflow-hidden">
                <span
                  className={`block h-full rounded-full ${scores[k] >= 60 ? "bg-success" : "bg-[#EF4444]"}`}
                  style={{ width: `${scores[k]}%` }}
                />
              </span>
              <b className="flex-none w-9 text-right text-[13px] tabular-nums">{scores[k]}</b>
            </div>
          ))}
        </div>
      )}

      {(feedback.writing || feedback.speaking) && (
        <div className="bg-warm border border-line rounded-[12px] px-4 py-3 text-[13px] text-[#3F3F46] grid gap-1.5 mb-4">
          {feedback.writing && <p>✏️ {feedback.writing}</p>}
          {feedback.speaking && <p>🎙 {feedback.speaking}</p>}
        </div>
      )}

      {!verdict?.passed && verdict && (
        <div className="border border-amber-line bg-[#FFFBEB] rounded-[12px] px-4 py-3 text-[13.5px] mb-4">
          Your weakest skill was <b>{SKILL_LABELS[verdict.weakest].en}</b>.{" "}
          <Link href={SKILL_LABELS[verdict.weakest].href} className="font-bold text-success hover:underline">
            Practice {SKILL_LABELS[verdict.weakest].en} →
          </Link>
        </div>
      )}

      <div className="flex gap-2">
        <Link href="/dashboard" className={BTN_GREEN}>
          Back to Garden
        </Link>
        <Link href="/league" className={BTN_LINE}>
          View league
        </Link>
      </div>
    </div>
  );
}
