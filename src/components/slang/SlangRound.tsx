"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { recordCompletion } from "@/lib/activity";
import SpeakButton from "./SpeakButton";
import TapText from "@/components/words/TapText";
import { VIBES, type SlangEntry } from "@/lib/slang";

// Slang as rounds (2026-09-11, user's design): five cards drawn at random
// from the whole list, one at a time in the middle of the screen, then a
// five-question quiz on exactly those five, then the results. It replaces
// the three stacked blocks the signed-in page used to open with — the "slang
// of the day" banner, a separate daily challenge, and all 153 cards in a
// grid that ran 35,124px tall on a phone.
//
// · The first round of a visit is seeded by the date, so the server and the
//   browser draw the same five (no hydration mismatch) and today's slang is
//   its first card. Later rounds are random and prefer cards not yet flipped.
// · Flipping a card "collects" it — the same localStorage set the public
//   board uses, so the two views agree.
// · XP: the first quiz finished each day pays. The server enforces the
//   once-a-day through a per-day reward key, so a second device or a cleared
//   browser doesn't pay again. Rounds after that are practice — a round per
//   tap would otherwise be an XP tap.

const ROUND = 5;
const OPTIONS = 4;
const QUIZ_XP = 4;
const COLLECTED_KEY = "kroot-slang-collected";

type Question = { entry: SlangEntry; options: string[]; answer: number };
type Round = { cards: SlangEntry[]; quiz: Question[] };
type Mode = "cards" | "quiz" | "done";

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

function seedOf(s: string) {
  let seed = 0;
  for (const ch of s) seed = (seed * 31 + ch.charCodeAt(0)) | 0;
  return seed;
}

function shuffle<T>(list: T[], rand: () => number): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRound(
  entries: SlangEntry[],
  rand: () => number,
  { first, collected }: { first?: SlangEntry; collected?: Set<string> } = {},
): Round {
  const rest = entries.filter((e) => e.kr !== first?.kr);
  const pool = collected
    ? [...shuffle(rest.filter((e) => !collected.has(e.kr)), rand), ...shuffle(rest.filter((e) => collected.has(e.kr)), rand)]
    : shuffle(rest, rand);
  const cards = (first ? [first, ...pool] : pool).slice(0, ROUND);
  const quiz = cards.map((entry) => {
    const options = [entry.meaning];
    for (const w of shuffle(entries, rand)) {
      if (options.length >= OPTIONS) break;
      if (!options.includes(w.meaning)) options.push(w.meaning);
    }
    const mixed = shuffle(options, rand);
    return { entry, options: mixed, answer: mixed.indexOf(entry.meaning) };
  });
  // Asked in a different order than they were shown, so the quiz tests the
  // words rather than the sequence.
  return { cards, quiz: shuffle(quiz, rand) };
}

function loadCollected(): Set<string> {
  try {
    const raw = window.localStorage.getItem(COLLECTED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

const BTN_BASE =
  "h-[52px] rounded-[14px] text-[15px] font-extrabold inline-flex items-center justify-center gap-1.5 transition-all active:translate-y-[2px] active:shadow-none disabled:opacity-40 disabled:active:translate-y-0";
const BTN_GREEN = `${BTN_BASE} flex-1 bg-success text-white shadow-[0_3px_0_var(--c-success-deep)] hover:bg-success-deep`;
const BTN_PINK = `${BTN_BASE} flex-1 bg-[var(--tint-pink-ink)] text-white shadow-[0_3px_0_var(--tint-pink-ink-deep)]`;
const BTN_LINE = `${BTN_BASE} w-14 flex-none border border-line bg-cream text-muted shadow-[0_2px_0_var(--c-line)] hover:border-faint`;

const FACE =
  "absolute inset-0 [backface-visibility:hidden] rounded-[18px] bg-cream border border-line shadow-[0_2px_0_var(--c-line),0_18px_36px_-26px_rgba(60,50,30,.5)] px-[22px] pt-[22px] pb-[18px] flex flex-col text-left";

export default function SlangRound({ entries, today }: { entries: SlangEntry[]; today: SlangEntry }) {
  const t = useTranslations("slang.round");
  const tc = useTranslations("slang.card");
  const tv = useTranslations("slang.vibes");
  const [round, setRound] = useState<Round>(() =>
    buildRound(entries, mulberry32(seedOf(todayKey())), { first: today }),
  );
  const [firstRound, setFirstRound] = useState(true);
  const [mode, setMode] = useState<Mode>("cards");
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [q, setQ] = useState(0);
  const [picks, setPicks] = useState<(number | undefined)[]>([]);
  const [reward, setReward] = useState<"pending" | "paid" | "practice" | "failed" | null>(null);
  const [earned, setEarned] = useState(QUIZ_XP);
  // null until the browser has read it — "New" only shows once we know.
  const [collected, setCollected] = useState<Set<string> | null>(null);
  const swiped = useRef(false);
  const startX = useRef<number | null>(null);

  // localStorage is client-only; read it after mount (same pattern as the
  // public board, which shares this set).
  useEffect(() => {
    const id = setTimeout(() => setCollected(loadCollected()), 0);
    return () => clearTimeout(id);
  }, []);

  function collect(kr: string) {
    setCollected((prev) => {
      const base = prev ?? loadCollected();
      if (base.has(kr)) return base;
      const next = new Set(base).add(kr);
      try {
        window.localStorage.setItem(COLLECTED_KEY, JSON.stringify([...next]));
      } catch {
        // storage blocked — the collection just won't persist
      }
      return next;
    });
  }

  function flip() {
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    if (!flipped) collect(round.cards[idx].kr);
    setFlipped((f) => !f);
  }

  function go(dir: 1 | -1) {
    if (mode !== "cards") return;
    if (dir === 1 && idx === ROUND - 1) {
      setMode("quiz");
      setQ(0);
      return;
    }
    const n = idx + dir;
    if (n < 0) return;
    setIdx(n);
    setFlipped(false);
  }

  // Arrow keys page the cards — through a ref so the listener is added once.
  const goRef = useRef(go);
  useEffect(() => {
    goRef.current = go;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowRight") goRef.current(1);
      else if (e.key === "ArrowLeft") goRef.current(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function finish() {
    setMode("done");
    await claimReward();
  }

  async function claimReward() {
    setReward("pending");
    try {
      // Imported on completion, not at module scope: /slang is also a public
      // SEO page, and a top-level import put all of supabase-js in its chunk.
      const { createClient, getClientUserId } = await import("@/lib/supabase/client");
      const supabase = createClient();
      if (!(await getClientUserId(supabase))) {
        setReward(null);
        return;
      }
      const res = await recordCompletion(supabase, "slang", 2, 0, `slang:${todayKey()}`);
      if (!res) {
        setReward("failed");
      } else if (res.already_earned || res.points_awarded === 0) {
        setReward("practice");
      } else {
        setEarned(res.points_awarded ?? QUIZ_XP);
        setReward("paid");
      }
    } catch {
      setReward("failed");
    }
  }

  function newRound() {
    setRound(buildRound(entries, Math.random, { collected: collected ?? loadCollected() }));
    setFirstRound(false);
    setMode("cards");
    setIdx(0);
    setFlipped(false);
    setQ(0);
    setPicks([]);
    setReward(null);
  }

  const label =
    mode === "cards" ? t("cardOf", { n: idx + 1, total: ROUND }) : mode === "quiz" ? t("quizOf", { n: q + 1, total: ROUND }) : t("roundDone");

  return (
    <section className="mx-auto w-full max-w-[560px] flex flex-col gap-3.5" aria-live="polite">
      {/* five steps, then the quiz */}
      <div className="flex items-center gap-2.5 text-[12.5px] font-extrabold text-muted tabular-nums">
        <span className="flex-none min-w-[82px]">{label}</span>
        <span className="flex-1 flex gap-[5px]" aria-hidden="true">
          {round.cards.map((c, i) => {
            const done = mode !== "cards" || i < idx;
            const now = mode === "cards" && i === idx;
            return (
              <i
                key={c.kr}
                className={`not-italic flex-1 h-1.5 rounded-full border ${
                  done
                    ? "bg-[var(--tint-pink-ink)] border-[var(--tint-pink-ink)]"
                    : now
                      ? "bg-[var(--tint-pink-line)] border-[var(--tint-pink-ink)]"
                      : "bg-warm-2 border-line"
                }`}
              />
            );
          })}
        </span>
        <span aria-hidden="true" className="flex-none text-[13px]">
          🎯
        </span>
      </div>

      {mode === "cards" && renderCards()}
      {mode === "quiz" && renderQuiz()}
      {mode === "done" && renderResults()}
    </section>
  );

  // Plain render helpers, not components: a component declared inside
  // render would remount on every state change and lose the flip animation.
  function renderCards() {
    const entry = round.cards[idx];
    const isToday = firstRound && idx === 0 && entry.kr === today.kr;
    const isNew = !isToday && collected !== null && !collected.has(entry.kr);
    const vibe = VIBES.find((v) => v.key === entry.vibe);
    return (
      <>
        <div
          className="py-2 [perspective:1200px] touch-pan-y"
          onPointerDown={(e) => {
            startX.current = e.clientX;
            swiped.current = false;
          }}
          onPointerUp={(e) => {
            if (startX.current === null) return;
            const dx = e.clientX - startX.current;
            startX.current = null;
            if (Math.abs(dx) > 50) {
              swiped.current = true;
              go(dx < 0 ? 1 : -1);
            }
          }}
        >
          <div
            key={entry.kr}
            role="button"
            tabIndex={0}
            aria-label={flipped ? tc("flipBack", { word: entry.kr }) : tc("reveal", { word: entry.kr })}
            onClick={flip}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                flip();
              }
            }}
            className="relative w-full h-[clamp(300px,82vw,360px)] cursor-pointer motion-safe:animate-[fadeUp_.25s_ease] outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2 rounded-[18px]"
          >
            <div
              className="relative w-full h-full transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none [transform-style:preserve-3d]"
              style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
            >
              {/* front: the word alone */}
              <div className={FACE}>
                <div className="min-h-[22px] flex items-center">
                  {isToday && (
                    <span className="text-[10.5px] font-black tracking-[.08em] uppercase rounded-full px-2 py-0.5 border border-[var(--tint-pink-line)] bg-[var(--tint-pink)] text-[var(--tint-pink-ink)]">
                      {t("today")}
                    </span>
                  )}
                  {isNew && (
                    <span className="text-[10.5px] font-black tracking-[.08em] uppercase rounded-full px-2 py-0.5 border border-success-line bg-success-bg text-success-deep">
                      {t("new")}
                    </span>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <span className="kr text-[clamp(44px,13vw,56px)] leading-[1.05] font-bold tracking-[-0.01em] break-keep">
                    {entry.kr}
                  </span>
                  <span className="text-[15px] text-muted mt-2">{entry.romanization}</span>
                </div>
                <div className="flex items-center justify-between">
                  <SpeakButton text={entry.kr} className="w-10 h-10 rounded-full text-[15px]" />
                  <span className="text-[11.5px] font-extrabold tracking-[.08em] uppercase text-faint">{tc("tapToFlip")}</span>
                </div>
              </div>

              {/* back: one column, no boxes inside the box */}
              <div className={`${FACE} [transform:rotateY(180deg)]`}>
                <div className="flex items-center gap-2">
                  <span className="kr text-[15px] font-bold text-muted">{entry.kr}</span>
                  <SpeakButton text={entry.kr} className="rounded-full" />
                  <span className="flex-1" />
                  <span className="text-[11.5px] font-extrabold text-[var(--tint-pink-ink)]">
                    {vibe?.emoji} {tv(entry.vibe)}
                  </span>
                </div>
                <b className="mt-3.5 text-[clamp(20px,5.6vw,23px)] font-extrabold leading-[1.28] text-charcoal [text-wrap:balance]">
                  {entry.meaning}
                </b>
                <span className="mt-1.5 text-[13px] text-faint">{tc("literally", { text: entry.literal })}</span>
                <div className="mt-auto pt-3.5 border-t border-line flex items-start gap-2.5" onClick={(e) => e.stopPropagation()}>
                  <span className="flex-1 min-w-0">
                    <span className="block kr text-[15px] leading-[1.45] text-charcoal">
                      <TapText text={entry.example.kr} source="slang" />
                    </span>
                    <span className="block text-[13px] text-muted mt-0.5">{entry.example.en}</span>
                  </span>
                  <SpeakButton text={entry.example.kr} className="rounded-full flex-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2.5">
          <button type="button" onClick={() => go(-1)} disabled={idx === 0} aria-label={t("prev")} className={BTN_LINE}>
            ←
          </button>
          <button type="button" onClick={() => go(1)} className={idx === ROUND - 1 ? BTN_PINK : BTN_GREEN}>
            {idx === ROUND - 1 ? t("quizTime") : t("next")}
          </button>
        </div>
      </>
    );
  }

  function renderQuiz() {
    const item = round.quiz[q];
    const picked = picks[q];
    const answered = picked !== undefined;
    return (
      <>
        <div className="flex flex-col gap-[18px] py-2">
          <div>
            <span className="block text-[11px] font-black tracking-[.12em] uppercase text-faint">{t("whatMeans")}</span>
            <span className="block kr text-[clamp(40px,12vw,50px)] leading-[1.1] font-bold mt-1">{item.entry.kr}</span>
            <span className="block text-[15px] text-muted mt-1">{item.entry.romanization}</span>
          </div>
          <div className="grid gap-2.5">
            {item.options.map((opt, i) => {
              const state = !answered ? "idle" : i === item.answer ? "ok" : i === picked ? "no" : "dim";
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={answered}
                  onClick={() => setPicks((p) => Object.assign([...p], { [q]: i }))}
                  className={`min-h-[52px] rounded-[14px] border px-3.5 py-3 text-left text-[14.5px] font-bold leading-[1.3] transition-colors disabled:cursor-default ${
                    state === "ok"
                      ? "border-success bg-success-bg text-success-deep shadow-[0_2px_0_var(--c-success)]"
                      : state === "no"
                        ? "border-danger bg-danger-bg text-danger shadow-[0_2px_0_var(--c-danger)]"
                        : state === "dim"
                          ? "border-line bg-cream text-muted opacity-60"
                          : "border-line bg-cream text-charcoal shadow-[0_2px_0_var(--c-line)] hover:border-faint"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex gap-2.5">
          <button
            type="button"
            disabled={!answered}
            onClick={() => (q === ROUND - 1 ? void finish() : setQ(q + 1))}
            className={BTN_GREEN}
          >
            {q === ROUND - 1 ? t("seeResults") : t("nextQuestion")}
          </button>
        </div>
      </>
    );
  }

  function renderResults() {
    const score = round.quiz.filter((qq, i) => picks[i] === qq.answer).length;
    return (
      <>
        <div className="flex flex-col gap-3.5 py-2">
          <p className="font-extrabold text-[44px] leading-none tracking-[-0.02em] tabular-nums">
            {score}
            <span className="text-[18px] text-faint font-bold ml-1.5">{t("outOf", { total: ROUND })}</span>
          </p>
          {reward === "failed" ? (
            <span className="self-start inline-flex items-center gap-2 rounded-full border border-[var(--tint-rose-line)] bg-danger-bg pl-3 text-[13px] font-extrabold text-danger">
              {t("notSaved")}
              <button type="button" onClick={() => void claimReward()} className="min-h-[44px] rounded-full px-3 underline underline-offset-4">
                {t("retry")}
              </button>
            </span>
          ) : (
            reward && (
              <span
                className={`self-start inline-flex items-center rounded-full border px-3 py-1 text-[13px] font-extrabold ${
                  reward === "paid" ? "border-success-line bg-success-bg text-success-deep" : "border-line bg-warm-2 text-muted"
                }`}
              >
                {reward === "paid" ? t("reward", { xp: earned }) : reward === "pending" ? "…" : t("practice")}
              </span>
            )
          )}
          <div className="grid">
            {round.quiz.map((qq, i) => {
              const ok = picks[i] === qq.answer;
              return (
                <div key={qq.entry.kr} className="flex items-baseline gap-2.5 border-b border-line py-2 text-[13.5px]">
                  <span className="kr font-bold min-w-[64px]">{qq.entry.kr}</span>
                  <span className="flex-1 min-w-0 text-muted">{qq.entry.meaning}</span>
                  <span className={`font-black ${ok ? "text-success" : "text-danger"}`} aria-label={ok ? "✓" : "✗"}>
                    {ok ? "✓" : "✗"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex gap-2.5">
          <button type="button" onClick={newRound} className={BTN_GREEN}>
            {t("newRound", { n: ROUND })}
          </button>
        </div>
      </>
    );
  }
}
