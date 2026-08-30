"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { setSaved } from "@/lib/word-bank";

// The learner's word bank: the words they picked, in one flat list. Removing
// a row unsaves it — the SRS history in the same row is kept, so a word that
// comes back returns with everything it knew.

export type BankItem = {
  wordKey: string;
  korean: string;
  romanization: string;
  meaning: string;
  /** In-app vocabulary page for this word, when it's still in the deck. */
  href: string | null;
  incorrectCount: number;
};

type Pending = { item: BankItem; index: number };

const UNDO_MS = 6000;

export default function WordBankList({
  userId,
  items: initialItems,
}: {
  userId: string;
  items: BankItem[];
}) {
  const t = useTranslations("vocabulary");
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [hideMeanings, setHideMeanings] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function insertAt(list: BankItem[], item: BankItem, index: number): BankItem[] {
    if (list.some((i) => i.wordKey === item.wordKey)) return list;
    const next = [...list];
    next.splice(Math.min(Math.max(index, 0), next.length), 0, item);
    return next;
  }

  async function remove(item: BankItem, index: number) {
    if (timer.current) clearTimeout(timer.current);
    setError(null);
    setItems((prev) => prev.filter((i) => i.wordKey !== item.wordKey));
    setPending({ item, index });
    timer.current = setTimeout(() => setPending(null), UNDO_MS);

    const err = await setSaved(supabase, userId, item.wordKey, false);
    if (err) {
      if (timer.current) clearTimeout(timer.current);
      setPending(null);
      setItems((prev) => insertAt(prev, item, index));
      setError(t("bank.removeFailed", { word: item.korean }));
    }
  }

  async function undo() {
    const restore = pending;
    if (!restore) return;
    if (timer.current) clearTimeout(timer.current);
    setPending(null);
    setError(null);
    setItems((prev) => insertAt(prev, restore.item, restore.index));

    const err = await setSaved(supabase, userId, restore.item.wordKey, true);
    if (err) {
      setItems((prev) => prev.filter((i) => i.wordKey !== restore.item.wordKey));
      setError(t("bank.undoFailed", { word: restore.item.korean }));
    }
  }

  const q = query.trim().toLowerCase();
  const shown = q
    ? items.filter(
        (i) =>
          i.korean.includes(query.trim()) ||
          i.romanization.toLowerCase().includes(q) ||
          i.meaning.toLowerCase().includes(q)
      )
    : items;

  if (initialItems.length === 0) {
    return (
      <div className="max-w-[680px]">
        <p className="text-[14px] text-charcoal">{t("bank.emptyWhat")}</p>
        <p className="mt-2 text-sm text-muted">
          <Link href="/vocabulary" className="font-semibold text-charcoal hover:underline">
            {t("bank.emptyCta")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[680px]">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <label className="min-w-0 flex-1 basis-[180px]">
          <span className="sr-only">{t("bank.searchPlaceholder")}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("bank.searchPlaceholder")}
            className="w-full min-w-0 h-[42px] rounded-[10px] border border-line bg-cream px-3.5 text-[14px] text-charcoal placeholder:text-faint focus:outline-none focus:border-faint"
          />
        </label>
        <button
          type="button"
          onClick={() => setHideMeanings((v) => !v)}
          aria-pressed={hideMeanings}
          className="flex-none h-[42px] px-3.5 rounded-[10px] border border-line bg-cream text-[13px] font-semibold text-muted hover:text-charcoal hover:border-faint transition-colors"
        >
          {hideMeanings ? t("bank.showMeanings") : t("bank.hideMeanings")}
        </button>
      </div>

      {error && (
        <p role="alert" className="mb-3 text-[13px] font-semibold text-danger">
          {error}
        </p>
      )}

      {shown.length === 0 ? (
        <p className="text-sm text-muted">{t("bank.noMatches", { query: query.trim() })}</p>
      ) : (
        <ul className="border border-line rounded-[14px] bg-cream divide-y divide-line overflow-hidden">
          {shown.map((item) => {
            const index = items.indexOf(item);
            const inner = (
              <>
                <span className="flex-none text-[12px] font-semibold text-faint tabular-nums">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 flex items-baseline gap-x-2 gap-y-0.5 flex-wrap">
                  <b className="kr font-bold text-[17px] leading-tight">{item.korean}</b>
                  {item.romanization && (
                    <span className="text-[12px] text-faint">{item.romanization}</span>
                  )}
                  {!hideMeanings && (
                    <span className="min-w-0 text-[13px] text-muted break-words">{item.meaning}</span>
                  )}
                </span>
                {item.incorrectCount > 0 && (
                  <span className="flex-none text-[11.5px] font-semibold text-faint whitespace-nowrap">
                    {t("bank.missed", { count: item.incorrectCount })}
                  </span>
                )}
              </>
            );
            return (
              <li key={item.wordKey} className="flex items-center gap-1.5 pl-3 pr-1.5">
                {item.href ? (
                  <Link
                    href={item.href}
                    className="min-w-0 flex-1 flex items-center gap-2.5 py-3 pr-1 hover:text-charcoal transition-colors"
                  >
                    {inner}
                  </Link>
                ) : (
                  <span className="min-w-0 flex-1 flex items-center gap-2.5 py-3 pr-1">{inner}</span>
                )}
                <button
                  type="button"
                  onClick={() => void remove(item, index)}
                  aria-label={t("bank.remove", { word: item.korean })}
                  className="flex-none w-10 h-10 inline-flex items-center justify-center rounded-full text-[15px] text-faint hover:text-danger hover:bg-warm transition-colors"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {pending && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-4 bottom-[84px] md:bottom-6 z-[100] mx-auto flex max-w-[420px] items-center justify-between gap-3 rounded-[14px] bg-[var(--deep)] px-4 py-3 text-white shadow-[0_8px_24px_rgba(24,20,10,.25)]"
        >
          <span className="min-w-0 truncate text-[13px]">
            {t("bank.removed")} <span className="kr font-semibold">{pending.item.korean}</span>
          </span>
          <button
            type="button"
            onClick={() => void undo()}
            className="flex-none h-10 px-3 -my-1 text-[13px] font-bold underline underline-offset-2"
          >
            {t("bank.undo")}
          </button>
        </div>
      )}
    </div>
  );
}
