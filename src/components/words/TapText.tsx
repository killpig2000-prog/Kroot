"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/analytics";
import { lookupWord, tokenizeKorean } from "@/lib/word-bank";
import { useKoreanSpeaker } from "@/hooks/useSpeechRecognition";
import type { VocabWord } from "@/lib/vocabulary";

// Tap any Korean word in learning content to see it, hear it, and plant it
// into the SRS deck ("Save to garden"). Only one popover is open at a time
// across every TapText on the page — opening one closes the others.
const closers = new Set<() => void>();
function closeAll() {
  for (const c of closers) c();
}

export type TapSource = "listening" | "reading" | "grammar" | "slang";

type Popover = {
  token: string;
  rect: DOMRect;
  word: VocabWord | null | "loading";
  saved: boolean;
  saving: boolean;
};

const POP_W = 250;
const POP_H = 190; // generous estimate for above/below flip

export default function TapText({
  text,
  userId,
  source,
  className = "",
}: {
  text: string;
  /** null = signed-out (no save button); undefined = resolve from the session on first tap. */
  userId?: string | null;
  source: TapSource;
  className?: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const tokens = useMemo(() => tokenizeKorean(text), [text]);
  const [pop, setPop] = useState<Popover | null>(null);
  // Session-resolved user, only consulted when the caller passed no userId.
  const [sessionUser, setSessionUser] = useState<string | null | undefined>(undefined);
  const resolvedUser = userId !== undefined ? userId : sessionUser;
  const popRef = useRef<HTMLDivElement | null>(null);
  const { speak, isSupported: ttsOk } = useKoreanSpeaker();

  // Register with the global "close others" set for as long as we're mounted.
  useEffect(() => {
    const close = () => setPop(null);
    closers.add(close);
    return () => {
      closers.delete(close);
    };
  }, []);

  // Outside tap / Esc / scroll close the popover.
  useEffect(() => {
    if (!pop) return;
    const onDown = (e: PointerEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setPop(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPop(null);
    };
    const onScroll = () => setPop(null);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [pop]);

  async function open(e: React.MouseEvent<HTMLSpanElement>, token: string) {
    e.stopPropagation();
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    if (pop?.token === token && pop.rect.top === rect.top && pop.rect.left === rect.left) {
      setPop(null);
      return;
    }
    closeAll();
    setPop({ token, rect, word: "loading", saved: false, saving: false });

    let uid = resolvedUser;
    if (uid === undefined) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      uid = user?.id ?? null;
      setSessionUser(uid);
    }

    const word = await lookupWord(token);
    let saved = false;
    if (word && uid) {
      const { data } = await supabase
        .from("vocabulary_progress")
        .select("id")
        .eq("user_id", uid)
        .eq("word_key", word.key)
        .maybeSingle();
      saved = !!data;
    }
    setPop((p) => (p && p.token === token ? { ...p, word, saved } : p));
  }

  async function save() {
    if (!pop || pop.word === "loading" || !pop.word || !resolvedUser || pop.saving || pop.saved) return;
    const word = pop.word;
    setPop((p) => (p ? { ...p, saving: true } : p));
    // ignoreDuplicates: an already-learned word keeps its box + counts.
    const { error } = await supabase.from("vocabulary_progress").upsert(
      {
        user_id: resolvedUser,
        word_key: word.key,
        correct_count: 0,
        incorrect_count: 0,
        box: 1,
        next_review_at: new Date().toISOString(),
        last_reviewed_at: null,
      },
      { onConflict: "user_id,word_key", ignoreDuplicates: true }
    );
    if (error) console.error("save word failed:", error.message);
    else track("word_saved", { source, level: word.level });
    setPop((p) => (p ? { ...p, saving: false, saved: !error } : p));
  }

  const placeAbove = pop ? pop.rect.bottom + POP_H > window.innerHeight && pop.rect.top > POP_H : false;
  const left = pop ? Math.max(8, Math.min(pop.rect.left, window.innerWidth - POP_W - 8)) : 0;
  const top = pop ? (placeAbove ? pop.rect.top - 6 : pop.rect.bottom + 6) : 0;

  return (
    <span className={className}>
      {tokens.map((t, i) =>
        t.isWord ? (
          <span
            key={i}
            role="button"
            tabIndex={0}
            onClick={(e) => void open(e, t.text)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                void open(e as unknown as React.MouseEvent<HTMLSpanElement>, t.text);
              }
            }}
            className={`cursor-pointer rounded-[3px] transition-colors hover:bg-black/10 ${
              pop?.token === t.text ? "bg-black/15 underline decoration-dotted underline-offset-4" : ""
            }`}
          >
            {t.text}
          </span>
        ) : (
          <span key={i}>{t.text}</span>
        )
      )}

      {pop &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popRef}
            role="dialog"
            aria-label="Word details"
            onClick={(e) => e.stopPropagation()}
            className="fixed z-[100] bg-white border border-line rounded-[12px] shadow-[0_8px_24px_rgba(24,20,10,.12)] p-3 text-left text-charcoal font-body"
            style={{
              left,
              top,
              width: POP_W,
              transform: placeAbove ? "translateY(-100%)" : undefined,
              animation: "fadeUp .18s ease",
            }}
          >
            {pop.word === "loading" ? (
              <p className="text-[13px] text-muted">Looking up…</p>
            ) : pop.word ? (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="kr text-[18px] font-semibold leading-tight">{pop.word.korean}</p>
                    <p className="text-[12px] text-faint italic">{pop.word.romanization}</p>
                  </div>
                  <span className="flex-none text-[10.5px] font-bold rounded-md px-1.5 py-px bg-warm-2 border border-line text-muted">
                    {pop.word.level}
                  </span>
                </div>
                <p className="text-[13.5px] text-charcoal mt-1.5 leading-snug">{pop.word.meaning_en}</p>
                <div className="flex items-center gap-2 mt-2.5">
                  {ttsOk && (
                    <button
                      type="button"
                      aria-label={`Hear ${pop.word.korean}`}
                      onClick={() => speak(pop.token)}
                      className="flex-none w-8 h-8 rounded-full bg-warm border border-line text-[13px] hover:border-faint transition-colors"
                    >
                      🔊
                    </button>
                  )}
                  {resolvedUser &&
                    (pop.saved ? (
                      <span className="text-[12px] font-semibold text-success leading-snug">
                        Saved ✓ — it&apos;ll come up in Watering time
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void save()}
                        disabled={pop.saving}
                        className="flex-1 rounded-[9px] bg-success text-white text-[12.5px] font-semibold px-3 py-1.5 hover:bg-success-deep transition-colors disabled:opacity-60"
                      >
                        {pop.saving ? "Planting…" : "🌱 Save to garden"}
                      </button>
                    ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2">
                  <p className="kr text-[18px] font-semibold leading-tight">{pop.token}</p>
                  {ttsOk && (
                    <button
                      type="button"
                      aria-label={`Hear ${pop.token}`}
                      onClick={() => speak(pop.token)}
                      className="flex-none w-8 h-8 rounded-full bg-warm border border-line text-[13px] hover:border-faint transition-colors"
                    >
                      🔊
                    </button>
                  )}
                </div>
                <p className="text-[12.5px] text-muted mt-1.5 leading-snug">Not in the word deck yet.</p>
              </>
            )}
          </div>,
          document.body
        )}
    </span>
  );
}
