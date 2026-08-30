"use client";

import { useEffect, useMemo, useState } from "react";
import { buttonClassName } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/analytics";
import { lookupWord, plantWord, tokenizeKorean } from "@/lib/word-bank";
import { estMinutes } from "@/lib/listening-resume";
import type { Dialogue } from "@/lib/listening-dialogues";
import type { VocabWord } from "@/lib/vocabulary";
import type { CefrLevel } from "@/lib/tree";

const BTN_GHOST = buttonClassName("line");
const BTN_GREEN = buttonClassName("success");

type ClipWord = { word: VocabWord; saved: boolean; saving: boolean };

// Shown right after a clip is marked heard: what you earned, the words from
// the clip that live in the vocab deck (save any you missed), and the next
// clip one tap away.
export default function ClipDone({
  dialogue,
  clipNo,
  clipCount,
  situationLabel,
  situationIcon,
  level,
  correct,
  xp,
  next,
  userId,
  onReplay,
  onAllClips,
  onNext,
}: {
  dialogue: Dialogue;
  clipNo: number;
  clipCount: number;
  situationLabel: string;
  situationIcon: string;
  level: CefrLevel;
  /** null = this clip has no quiz. */
  correct: boolean | null;
  xp: number;
  next: Dialogue | null;
  userId: string | null;
  onReplay: () => void;
  onAllClips: () => void;
  /** Next clip, or the situation summary when this was the last one. */
  onNext: () => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [words, setWords] = useState<ClipWord[] | null>(null);
  const allDone = clipNo === clipCount && !next;

  // Which words in this clip are in the dictionary, and which are already
  // planted — up to six, in order of appearance.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const seen = new Set<string>();
      const found: VocabWord[] = [];
      for (const line of dialogue.lines) {
        for (const t of tokenizeKorean(line.kr)) {
          if (!t.isWord || seen.has(t.text)) continue;
          seen.add(t.text);
          const w = await lookupWord(t.text);
          if (w && !found.some((f) => f.key === w.key)) found.push(w);
          if (found.length >= 6) break;
        }
        if (found.length >= 6) break;
      }
      let savedKeys = new Set<string>();
      if (userId && found.length > 0) {
        const { data } = await supabase
          .from("vocabulary_progress")
          .select("word_key")
          .eq("user_id", userId)
          .in(
            "word_key",
            found.map((w) => w.key)
          );
        savedKeys = new Set((data ?? []).map((r) => r.word_key as string));
      }
      if (!cancelled) setWords(found.map((word) => ({ word, saved: savedKeys.has(word.key), saving: false })));
    })();
    return () => {
      cancelled = true;
    };
  }, [dialogue, userId, supabase]);

  async function save(key: string) {
    if (!userId) return;
    setWords((ws) => ws && ws.map((w) => (w.word.key === key ? { ...w, saving: true } : w)));
    const error = await plantWord(supabase, userId, key);
    if (!error) track("word_saved", { source: "listening", level });
    setWords((ws) => ws && ws.map((w) => (w.word.key === key ? { ...w, saving: false, saved: !error } : w)));
  }

  return (
    <div
      className="max-w-[720px] border border-line rounded-[16px] bg-cream overflow-hidden"
      style={{ animation: "fadeUp .4s ease" }}
    >
      <div
        className="px-[clamp(16px,3vw,24px)] py-7 text-center"
        style={{ background: "radial-gradient(ellipse at 50% 0%, var(--c-success-bg) 0%, var(--c-warm) 70%)" }}
      >
        <div className="text-[46px] leading-none">🎧</div>
        <h2 className="font-extrabold text-[22px] tracking-[-0.02em] mt-2">Clip heard!</h2>
        <p className="text-[13.5px] text-muted mt-1">
          “{dialogue.title as string}” is in your ears now. {clipNo} of {clipCount} {situationLabel.toLowerCase()} clips
          done.
        </p>

        <div className="flex justify-center gap-2 flex-wrap mt-4 mb-5">
          {correct !== null && (
            <span
              className={`text-[12.5px] font-bold px-[11px] py-1.5 rounded-full border ${
                correct
                  ? "bg-success-bg text-success border-success-line"
                  : "bg-danger-bg text-danger border-[var(--tint-rose-line)]"
              }`}
            >
              {correct ? "🌱 Quiz correct" : "💧 Quiz missed"}
            </span>
          )}
          <span className="text-[12.5px] font-bold px-[11px] py-1.5 rounded-full border bg-[var(--tint-teal)] text-teal border-[var(--tint-teal-line)]">
            +{estMinutes(dialogue.lines.length)} min · +{xp} XP
          </span>
          <span className="text-[12.5px] font-bold px-[11px] py-1.5 rounded-full border bg-cream text-muted border-line tabular-nums">
            {situationIcon} {situationLabel} · {clipNo} / {clipCount}
          </span>
        </div>

        {words && words.length > 0 && (
          <div className="flex justify-center gap-2 flex-wrap mb-5">
            {words.map(({ word, saved, saving }) => (
              <span
                key={word.key}
                className="inline-flex items-center gap-2 px-3 py-[7px] rounded-[10px] bg-cream border border-line text-[13.5px]"
              >
                <b className="kr font-bold">{word.korean}</b>
                <span className="text-muted text-[12px]">{word.meaning_en}</span>
                {saved ? (
                  <i className="not-italic text-teal font-extrabold text-[12px]">saved ✓</i>
                ) : (
                  <button
                    className="text-teal font-extrabold text-[12px] hover:underline disabled:opacity-50"
                    disabled={saving || !userId}
                    onClick={() => save(word.key)}
                  >
                    {saving ? "…" : "+ save"}
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        {next ? (
          <button
            onClick={onNext}
            className="w-full max-w-[440px] mx-auto flex items-center gap-3 text-left px-3.5 py-3 bg-cream border border-line rounded-[12px] transition-colors hover:border-teal"
          >
            <span className="w-[34px] h-[34px] rounded-full bg-warm border border-line grid place-items-center font-extrabold text-[12px] text-muted tabular-nums flex-none">
              {clipNo + 1}
            </span>
            <span className="min-w-0 flex-1">
              <b className="block text-[14px] truncate">{next.title as string}</b>
              <span className="text-[12px] text-muted">
                {next.lines.length} lines · ~{estMinutes(next.lines.length)} min
              </span>
            </span>
            <span className="text-teal font-extrabold text-[13px] flex-none">Play ▶</span>
          </button>
        ) : (
          <p className="text-[13px] font-semibold text-success">
            🎉 Every {situationLabel.toLowerCase()} clip at {level} heard
          </p>
        )}

        <div className="flex justify-center gap-2.5 flex-wrap mt-4">
          <button className={BTN_GHOST} onClick={onReplay}>
            ↻ Replay this clip
          </button>
          <button className={BTN_GHOST} onClick={onAllClips}>
            All clips
          </button>
          <button className={BTN_GREEN} onClick={onNext}>
            {allDone ? "See summary →" : "Next clip →"}
          </button>
        </div>
      </div>
    </div>
  );
}
