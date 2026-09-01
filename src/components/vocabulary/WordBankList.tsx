"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { setSaved, SLOTS_PER_PURCHASE, SLOTS_PRICE, MAX_WORD_BANK_SLOTS } from "@/lib/word-bank";

// The learner's word bank, drawn as the inventory it is: one cell per slot,
// filled cells holding a word and the rest left visibly open, so "12 of 20"
// is something you see rather than read. Removing a card unsaves it — the SRS
// history in the same row is kept, so a word that comes back returns with
// everything it knew.

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

// Empty cells drawn past the filled ones. Enough to read as an inventory
// without paying to render 50 placeholder tiles on a near-empty bank.
const MAX_GHOST_SLOTS = 11;

const SLOT_BASE = "relative min-h-[104px] rounded-[14px] flex flex-col";

export default function WordBankList({
  userId,
  items: initialItems,
  slots,
}: {
  userId: string;
  items: BankItem[];
  slots: number;
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

  const open = Math.max(0, slots - items.length);
  const full = open === 0;
  const canBuyMore = slots < MAX_WORD_BANK_SLOTS;

  // The one live "add" cell. The rest are decoration — a dozen identical
  // links to the same page would only clutter the tab order.
  const addTile = (label: string) => (
    <Link
      href="/vocabulary"
      className={`${SLOT_BASE} items-center justify-center gap-[3px] border-[1.5px] border-dashed border-success-line bg-success-bg text-success-deep transition-colors hover:border-success`}
    >
      <span aria-hidden="true" className="text-[21px] leading-none">
        +
      </span>
      <span className="text-[11.5px] font-bold">{label}</span>
    </Link>
  );

  // A phone is two cells wide, so the same ghost count that reads as "a bit
  // of headroom" on desktop turns into a screen of empty tiles — past the
  // first few they're dropped below sm.
  const ghostTiles = (count: number, dim = false) =>
    Array.from({ length: count }, (_, i) => (
      <span
        key={`ghost-${i}`}
        aria-hidden="true"
        className={`${SLOT_BASE} items-center justify-center border-[1.5px] border-dashed border-dash text-[19px] text-dash ${
          dim ? "opacity-55" : ""
        } ${i >= 3 ? "hidden sm:flex" : ""}`}
      >
        +
      </span>
    ));

  const grid = "grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(158px,1fr))] gap-2 sm:gap-2.5";

  // `items`, not the prop it was seeded from: removing the last word left the
  // page rendering a search box over nothing, reading "No matches for ''",
  // with no way back to the vocabulary list until a reload.
  if (items.length === 0) {
    return (
      <div className="max-w-[680px]">
        <div className="text-center pb-5">
          <h2 className="font-bold text-[17px] tracking-[-0.01em] text-balance mb-1.5">
            {t("bank.emptyTitle", { slots })}
          </h2>
          <p className="mx-auto max-w-[44ch] text-[13.5px] text-muted mb-4">{t("bank.emptyWhat")}</p>
          <Link
            href="/vocabulary"
            className="inline-block rounded-[10px] bg-success px-[22px] py-[11px] text-sm font-bold text-white transition-colors hover:bg-success-deep"
          >
            {t("bank.emptyCta")}
          </Link>
        </div>

        <div className={grid}>
          {addTile(t("bank.firstWord"))}
          {ghostTiles(Math.min(open - 1, MAX_GHOST_SLOTS), true)}
        </div>
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
            className="w-full min-w-0 h-[42px] rounded-[10px] border border-line bg-cream px-3.5 text-[14px] text-charcoal placeholder:text-faint focus:outline-none focus:border-success"
          />
        </label>
        <button
          type="button"
          onClick={() => setHideMeanings((v) => !v)}
          aria-pressed={hideMeanings}
          className={`flex-none h-[42px] px-3.5 rounded-[10px] border text-[13px] font-semibold transition-colors ${
            hideMeanings
              ? "border-success-line bg-success-bg text-success-deep"
              : "border-line bg-cream text-muted hover:text-charcoal hover:border-faint"
          }`}
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
        <div className={grid}>
          {shown.map((item) => {
            const index = items.indexOf(item);
            const inner = (
              <>
                <b className="kr font-bold text-[20px] leading-[1.25] tracking-[-0.01em]">
                  {item.korean}
                </b>
                {item.romanization && (
                  <span className="text-[11.5px] text-faint mt-px">{item.romanization}</span>
                )}
                <span
                  className={`text-[12.5px] text-muted mt-[5px] line-clamp-2 ${
                    hideMeanings ? "invisible" : ""
                  }`}
                >
                  {item.meaning}
                </span>
                {item.incorrectCount > 0 && (
                  <span className="mt-auto pt-[7px] flex items-center gap-1 text-[10.5px] font-bold text-amber">
                    <i className="not-italic block w-[5px] h-[5px] rounded-full bg-amber" />
                    {t("bank.missed", { count: item.incorrectCount })}
                  </span>
                )}
              </>
            );
            const cell = `${SLOT_BASE} border border-line bg-cream px-[13px] pt-3 pb-[11px] shadow-[0_1px_2px_rgba(74,66,55,.04),0_8px_20px_-14px_rgba(74,66,55,.28)] transition-all group`;
            return (
              <div key={item.wordKey} className={`${cell} hover:-translate-y-0.5 hover:border-success-line`}>
                {item.href ? (
                  <Link href={item.href} className="flex flex-1 flex-col min-w-0">
                    {inner}
                  </Link>
                ) : (
                  <span className="flex flex-1 flex-col min-w-0">{inner}</span>
                )}

                {/* Slot number until the card is hovered, then the remove
                    control takes the same corner. */}
                <span
                  aria-hidden="true"
                  className="absolute top-[9px] right-[11px] text-[10.5px] font-bold text-faint tabular-nums transition-opacity group-hover:opacity-0"
                >
                  {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => void remove(item, index)}
                  aria-label={t("bank.remove", { word: item.korean })}
                  className="absolute top-[5px] right-[5px] w-[26px] h-[26px] inline-flex items-center justify-center rounded-full text-[13px] text-faint opacity-0 transition-all hover:text-danger hover:bg-warm-2 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-success"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </div>
            );
          })}

          {/* Open slots trail the filled ones — but only on the full list, so
              a search result isn't padded with cells that aren't matches. */}
          {!q && !full && addTile(t("bank.addWord"))}
          {!q && !full && ghostTiles(Math.min(open - 1, MAX_GHOST_SLOTS))}

          {/* At capacity the last cell becomes the way to get more. */}
          {!q && full && canBuyMore && (
            <Link
              href="/shop"
              className={`${SLOT_BASE} items-center justify-center gap-[3px] text-center border-[1.5px] border-dashed border-amber-line bg-[var(--tint-amber)] text-amber transition-colors hover:border-amber`}
            >
              <span aria-hidden="true" className="text-[18px] leading-none">
                🪙
              </span>
              <span className="text-[11.5px] font-bold">
                {t("bank.moreSlots", { count: SLOTS_PER_PURCHASE })}
              </span>
              <span className="text-[10.5px] font-semibold opacity-80">
                {t("bank.moreSlotsPrice", { price: SLOTS_PRICE })}
              </span>
            </Link>
          )}
        </div>
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
