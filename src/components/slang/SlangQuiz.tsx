"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { recordCompletion } from "@/lib/activity";
import { SLANG, type SlangEntry } from "@/lib/slang";

const QUESTIONS = 5;
const OPTIONS = 4;

// Deterministic PRNG so today's quiz is the same on every visit (and safe to
// build during render).
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

type Question = { entry: SlangEntry; options: string[]; answer: number };

function buildQuiz(dayKey: string): Question[] {
  let seed = 0;
  for (const ch of dayKey) seed = (seed * 31 + ch.charCodeAt(0)) | 0;
  const rand = mulberry32(seed);
  const pool = [...SLANG];
  const picks: SlangEntry[] = [];
  for (let i = 0; i < QUESTIONS && pool.length; i++) {
    picks.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  }
  return picks.map((entry) => {
    const wrong = SLANG.filter((s) => s.kr !== entry.kr);
    const options = [entry.meaning];
    while (options.length < OPTIONS && wrong.length) {
      const w = wrong.splice(Math.floor(rand() * wrong.length), 1)[0];
      if (!options.includes(w.meaning)) options.push(w.meaning);
    }
    // seeded shuffle
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return { entry, options, answer: options.indexOf(entry.meaning) };
  });
}

const DONE_KEY = "kroot-slang-quiz";

export default function SlangQuiz() {
  const supabase = useMemo(() => createClient(), []);
  const day = todayKey();
  const quiz = useMemo(() => buildQuiz(day), [day]);
  // Read the "done today" flag lazily on the client; before hydration we show
  // the closed (start) state, which is also what the server rendered.
  const [expanded, setExpanded] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [doneToday, setDoneToday] = useState<number | null>(null);

  function start() {
    try {
      const raw = window.localStorage.getItem(DONE_KEY);
      if (raw) {
        const [d, s] = raw.split(":");
        if (d === day) {
          setDoneToday(Number(s));
          return;
        }
      }
    } catch {
      // storage blocked — just let them play
    }
    setExpanded(true);
  }

  async function finish(finalScore: number) {
    setFinished(true);
    try {
      window.localStorage.setItem(DONE_KEY, `${day}:${finalScore}`);
    } catch {
      // ignore
    }
    await recordCompletion(supabase, "slang", 2);
  }

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    const correct = i === quiz[qIndex].answer;
    if (correct) setScore((s) => s + 1);
    const finalScore = score + (correct ? 1 : 0);
    setTimeout(() => {
      if (qIndex + 1 < quiz.length) {
        setQIndex(qIndex + 1);
        setPicked(null);
      } else {
        void finish(finalScore);
      }
    }, 900);
  }

  const q = quiz[qIndex];

  return (
    <div className="border-[1.5px] border-[#FBCFE8] bg-[#FDF2F8] rounded-[14px] px-5 py-4 mb-6">
      {!expanded || doneToday !== null ? (
        <div className="flex items-center gap-3.5 flex-wrap">
          <span className="text-[22px] flex-none">🎯</span>
          <div className="flex-1 min-w-[180px]">
            <b className="block text-[14px] font-bold text-[#AF3166]">Daily slang challenge</b>
            <span className="text-[12.5px] text-[#97687D]">
              {doneToday !== null
                ? `Done today — ${doneToday}/${QUESTIONS} correct. New round tomorrow!`
                : `Guess the meaning of ${QUESTIONS} expressions · +4 XP`}
            </span>
          </div>
          {doneToday === null && (
            <button
              onClick={start}
              className="flex-none rounded-[9px] px-[18px] py-2 text-[13px] font-semibold text-white bg-[#C13E78] hover:bg-[#AF3166] transition-colors"
            >
              Start ▶
            </button>
          )}
        </div>
      ) : finished ? (
        <div className="flex items-center gap-3.5 flex-wrap">
          <span className="text-[22px] flex-none">{score >= 4 ? "🏆" : score >= 2 ? "🌱" : "💧"}</span>
          <div className="flex-1">
            <b className="block text-[14px] font-bold text-[#AF3166]">
              {score}/{quiz.length} correct · +4 XP
            </b>
            <span className="text-[12.5px] text-[#97687D]">
              {score >= 4
                ? "Fluent in Street Talk — see you tomorrow!"
                : "Flip the cards below and come back tomorrow."}
            </span>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <b className="text-[12px] font-bold tracking-[.06em] uppercase text-[#C13E78]">
              What does it mean? · {qIndex + 1}/{quiz.length}
            </b>
            <span className="text-[12px] font-semibold text-[#97687D] tabular-nums">
              score {score}
            </span>
          </div>
          <p className="kr text-[22px] font-bold mb-3">
            {q.entry.kr}{" "}
            <span className="text-[13px] font-medium text-[#97687D]">({q.entry.romanization})</span>
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {q.options.map((opt, i) => {
              const state =
                picked === null ? "idle" : i === q.answer ? "correct" : i === picked ? "wrong" : "dim";
              return (
                <button
                  key={i}
                  disabled={picked !== null}
                  onClick={() => pick(i)}
                  className={`text-left px-3.5 py-2.5 rounded-[10px] text-[13px] font-medium border-[1.5px] transition-all disabled:cursor-default ${
                    state === "correct"
                      ? "border-success bg-success-bg"
                      : state === "wrong"
                        ? "border-danger bg-danger-bg"
                        : state === "dim"
                          ? "border-[#FBCFE8] bg-white opacity-60"
                          : "border-[#FBCFE8] bg-white hover:border-[#C13E78]"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
