"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/analytics";
import { countDueWords, plantWord } from "@/lib/word-bank";

// "Add to my words" on the public dictionary page (/words/[slug]).
//
// The page itself is statically generated for SEO, so it can't read the
// session cookie — this island resolves the session on mount and swaps
// between three states: signed out (→ login, come back with ?save=1 and
// auto-save), signed in & not saved (plant it), signed in & saved (quiet).

type Status =
  | { kind: "loading" }
  | { kind: "anon" }
  | { kind: "unsaved"; userId: string }
  | { kind: "saved"; nextReviewAt: string | null };

const BTN =
  "inline-flex items-center justify-center rounded-full px-6 py-3 font-semibold transition disabled:cursor-default";
const BTN_PRIMARY = `${BTN} bg-[var(--leaf)] text-[var(--leaf-ink)] shadow-[0_3px_0_var(--leaf-shadow)] hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70`;
const BTN_QUIET = `${BTN} bg-[var(--mint)] text-[var(--deep)] shadow-[0_3px_0_var(--mint-shadow)]`;

function dueLabel(iso: string | null, now = Date.now()): string {
  if (!iso) return "due today";
  const t = Date.parse(iso);
  if (Number.isNaN(t) || t <= now) return "due today";
  const days = Math.ceil((t - now) / 86_400_000);
  if (days <= 1) return "due tomorrow";
  return `due in ${days} days`;
}

export default function AddToMyWords({
  slug,
  wordKey,
  korean,
  level,
}: {
  slug: string;
  /** vocabulary_progress.word_key — see wordBankKey() in lib/word-bank. */
  wordKey: string;
  korean: string;
  level: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ waiting: number } | null>(null);
  const savingRef = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function save(userId: string) {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    const error = await plantWord(supabase, userId, wordKey);
    if (error) {
      console.error("add to my words failed:", error);
      setSaving(false);
      savingRef.current = false;
      return;
    }
    track("word_saved", { source: "dictionary", level });
    const waiting = await countDueWords(supabase, userId);
    setStatus({ kind: "saved", nextReviewAt: new Date().toISOString() });
    setSaving(false);
    savingRef.current = false;
    setToast({ waiting });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 10_000);
  }

  // Resolve session + saved state once; honour ?save=1 from the login round
  // trip by saving straight away (and dropping the flag from the URL so a
  // reload doesn't re-trigger it).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        setStatus({ kind: "anon" });
        return;
      }
      const { data } = await supabase
        .from("vocabulary_progress")
        .select("next_review_at")
        .eq("user_id", user.id)
        .eq("word_key", wordKey)
        .maybeSingle();
      if (cancelled) return;

      const params = new URLSearchParams(window.location.search);
      const wantsSave = params.get("save") === "1";
      if (wantsSave) {
        params.delete("save");
        const qs = params.toString();
        window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
      }

      if (data) {
        setStatus({ kind: "saved", nextReviewAt: data.next_review_at ?? null });
      } else if (wantsSave) {
        setStatus({ kind: "unsaved", userId: user.id });
        void save(user.id);
      } else {
        setStatus({ kind: "unsaved", userId: user.id });
      }
    })();
    return () => {
      cancelled = true;
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, wordKey]);

  const loginHref = `/auth/login?next=${encodeURIComponent(`/words/${slug}?save=1`)}`;

  return (
    <div className="mt-8">
      {status.kind === "saved" ? (
        <>
          <button type="button" disabled className={BTN_QUIET} aria-disabled="true">
            In my words ✓ · {dueLabel(status.nextReviewAt)}
          </button>
          <p className="mt-2 text-sm text-[var(--soft)]">
            <Link href="/review/words" className="hover:underline">
              See all my words →
            </Link>
          </p>
        </>
      ) : status.kind === "unsaved" || status.kind === "loading" ? (
        <>
          <button
            type="button"
            disabled={saving || status.kind === "loading"}
            aria-busy={saving || status.kind === "loading"}
            onClick={() => status.kind === "unsaved" && void save(status.userId)}
            className={BTN_PRIMARY}
          >
            {saving ? "Adding…" : "＋ Add to my words"}
          </button>
          <p className="mt-2 text-sm text-[var(--soft)]">Goes straight into your Review queue</p>
        </>
      ) : (
        <>
          <Link href={loginHref} className={BTN_PRIMARY}>
            ＋ Save this word
          </Link>
          <p className="mt-2 text-sm text-[var(--soft)]">Free account · remembers it for you</p>
        </>
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-4 bottom-6 z-[100] mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl bg-[var(--deep)] px-5 py-3.5 text-white shadow-[0_8px_24px_rgba(24,20,10,.25)]"
          style={{ animation: "fadeUp .18s ease" }}
        >
          <span className="text-sm">
            ✓ Added <span className="kr font-semibold">{korean}</span> · {toast.waiting}{" "}
            {toast.waiting === 1 ? "word" : "words"} waiting —{" "}
            <Link href="/review/words" className="font-semibold underline underline-offset-2">
              Review →
            </Link>
          </span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss"
            className="flex-none rounded-full px-2 text-lg leading-none opacity-70 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
