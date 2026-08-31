"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { track } from "@/lib/analytics";
import { DEFAULT_WORD_BANK_SLOTS, countSavedWords, getWordBankSlots, saveToBank } from "@/lib/word-bank";

// "Add to my words" on the public dictionary page (/words/[slug]).
//
// The page itself is statically generated for SEO, so it can't read the
// session cookie — this island resolves the session on mount and swaps
// between states: signed out (→ login, come back with ?save=1 and auto-save),
// signed in with room, signed in with a full bank, and already saved.

type Status =
  | { kind: "loading" }
  | { kind: "anon" }
  | { kind: "unsaved"; userId: string }
  | { kind: "full" }
  | { kind: "saved" };

const BTN =
  "inline-flex items-center justify-center rounded-full px-6 py-3 font-semibold transition disabled:cursor-default";
const BTN_PRIMARY = `${BTN} bg-[var(--leaf)] text-[var(--leaf-ink)] shadow-[0_3px_0_var(--leaf-shadow)] hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70`;
const BTN_QUIET = `${BTN} bg-[var(--mint)] text-[var(--deep)] shadow-[0_3px_0_var(--mint-shadow)]`;

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
  const t = useTranslations("vocabulary");
  const tu = useTranslations("ui");
  // The word pages are prerendered public SEO pages, and @supabase/supabase-js
  // is 66KB compressed. Loading it at module scope put it in the critical path
  // of every crawl and every reader who never touches this button; behind a
  // dynamic import it is fetched after paint instead, and only once.
  const sbRef = useRef<Promise<SupabaseClient> | null>(null);
  function getSupabase(): Promise<SupabaseClient> {
    sbRef.current ??= import("@/lib/supabase/client").then((m) => m.createClient());
    return sbRef.current;
  }
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [used, setUsed] = useState(0);
  const [slots, setSlots] = useState(DEFAULT_WORD_BANK_SLOTS);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [toast, setToast] = useState(false);
  const savingRef = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function save(userId: string) {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setFailed(false);
    try {
      const res = await saveToBank(await getSupabase(), userId, wordKey);
      if (!res.ok) {
        if (res.reason === "full") {
          setUsed(res.used);
          setSlots(res.slots);
          setStatus({ kind: "full" });
        } else {
          setFailed(true);
        }
        return;
      }
      track("word_saved", { source: "dictionary", level });
      setUsed((n) => n + 1);
      setStatus({ kind: "saved" });
      setToast(true);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(false), 10_000);
    } catch {
      setFailed(true);
    } finally {
      // Both of these had to be released here: a throw left the button
      // disabled AND savingRef latched, so every later tap returned early.
      setSaving(false);
      savingRef.current = false;
    }
  }

  // Resolve session + saved state once; honour ?save=1 from the login round
  // trip by saving straight away (and dropping the flag from the URL so a
  // reload doesn't re-trigger it).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // getClientUserId swallows its own errors and returns null, which is
      // what the old try/catch here did: never leave the button spinning —
      // treat an unreadable session as signed out, which still offers a way
      // forward.
      const [supabase, { getClientUserId }] = await Promise.all([
        getSupabase(),
        import("@/lib/supabase/client"),
      ]);
      const userId = await getClientUserId(supabase);
      if (cancelled) return;
      if (cancelled) return;
      if (!userId) {
        setStatus({ kind: "anon" });
        return;
      }

      const row = await supabase
        .from("vocabulary_progress")
        .select("saved")
        .eq("user_id", userId)
        .eq("word_key", wordKey)
        .maybeSingle();
      // Pre-0039 checkouts have no `saved` column: any row counts as saved.
      let isSaved = (row.data as { saved?: boolean | null } | null)?.saved ?? false;
      if (row.error?.code === "42703") {
        const fallback = await supabase
          .from("vocabulary_progress")
          .select("word_key")
          .eq("user_id", userId)
          .eq("word_key", wordKey)
          .maybeSingle();
        isSaved = fallback.data !== null;
      }

      const [count, capacity] = await Promise.all([
        countSavedWords(supabase, userId),
        getWordBankSlots(supabase, userId),
      ]);
      if (cancelled) return;
      setUsed(count);
      setSlots(capacity);

      const params = new URLSearchParams(window.location.search);
      const wantsSave = params.get("save") === "1";
      if (wantsSave) {
        params.delete("save");
        const qs = params.toString();
        window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
      }

      if (isSaved) {
        setStatus({ kind: "saved" });
      } else if (count >= capacity) {
        setStatus({ kind: "full" });
      } else {
        setStatus({ kind: "unsaved", userId });
        if (wantsSave) void save(userId);
      }
    })();
    return () => {
      cancelled = true;
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordKey]);

  const loginHref = `/auth/login?next=${encodeURIComponent(`/words/${slug}?save=1`)}`;

  return (
    <div className="mt-8">
      {status.kind === "saved" ? (
        <>
          <button type="button" disabled className={BTN_QUIET} aria-disabled="true">
            {t("bank.savedWithCount", { used, slots })}
          </button>
          <p className="mt-2 text-sm text-[var(--soft)]">
            <Link href="/review/words" className="hover:underline">
              {t("bank.seeAll")}
            </Link>
          </p>
        </>
      ) : status.kind === "full" ? (
        // Inert, like the saved state: this replaces the add button in place,
        // and a tap's trailing click arrives after React has already swapped
        // the element — a link here would navigate on the press that filled
        // the bank. The way to the bank goes on the hint line instead.
        <>
          <button type="button" disabled className={BTN_QUIET} aria-disabled="true">
            {t("bank.fullShort", { used, slots })}
          </button>
          <p className="mt-2 text-sm text-[var(--soft)]">
            {t("bank.fullHint", { slots })}{" "}
            <Link href="/review/words" className="hover:underline">
              {t("bank.seeAll")}
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
            {saving ? tu("saving") : `＋ ${tu("addToMyWords")}`}
          </button>
          {failed ? (
            <p role="alert" className="mt-2 text-sm font-semibold text-danger">
              {t("bank.addFailed")}
            </p>
          ) : (
            status.kind === "unsaved" && (
              <p className="mt-2 text-sm text-[var(--soft)]">{t("bank.budgetLine", { used, slots })}</p>
            )
          )}
        </>
      ) : (
        <Link href={loginHref} className={BTN_PRIMARY}>
          ＋ {t("bank.saveThisWord")}
        </Link>
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-4 bottom-6 z-[100] mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl bg-[var(--deep)] px-5 py-3.5 text-white shadow-[0_8px_24px_rgba(24,20,10,.25)]"
          style={{ animation: "fadeUp .18s ease" }}
        >
          <span className="text-sm">
            ✓ <span className="kr font-semibold">{korean}</span> · {t("bank.budgetLine", { used, slots })}{" "}
            <Link href="/review/words" className="font-semibold underline underline-offset-2">
              {t("bank.seeAll")}
            </Link>
          </span>
          <button
            type="button"
            onClick={() => setToast(false)}
            aria-label={tu("closeMenu")}
            className="flex-none rounded-full px-2 text-lg leading-none opacity-70 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
