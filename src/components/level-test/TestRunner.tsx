"use client";

import { useMemo, useState } from "react";
import { buttonClassName } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { Link, redirect, useRouter, usePathname, getPathname } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { track } from "@/lib/analytics";
import {
  COOLDOWN_HOURS,
  servedKeysOf,
  testVerdict,
  type ServedPromotionTest,
  type SkillScores,
} from "@/lib/promotion-test";
import Mcq from "@/components/level-test/Mcq";
import SpeakingStage from "@/components/level-test/SpeakingStage";
import ResultStage from "@/components/level-test/ResultStage";

// The promotion test: listening MCQ → reading MCQ → writing (AI) → speaking
// (AI over a speech transcript) → verdict. Pass → apply_level_test RPC.

type Stage = "intro" | "listening" | "reading" | "writing" | "speaking" | "grading" | "result";

const BTN_GREEN = buttonClassName("success");

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

      track("level_test_finished", { from: spec.from, to: spec.to, passed: verdict.passed, score: verdict.avg });

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
          Promotion test · {spec.from} → {spec.to}
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
    return (
      <SpeakingStage
        spec={spec}
        speech={speech}
        transcript={transcript}
        setTranscript={setTranscript}
        grading={stage === "grading"}
        error={error}
        onSubmit={finish}
      />
    );
  }

  return (
    <ResultStage spec={spec} scores={scores} feedback={feedback} promoted={promoted} playerLevel={playerLevel} />
  );
}
