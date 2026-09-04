"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { speakKorean, prefetchKorean } from "@/lib/tts";
import { wrongTilePositions, type Board, type Tile } from "@/lib/writing-builder";

// The single tile-assembly board. A controlled component: the session owns
// the picks so a submitted chapter can rebuild the answer text.

const TILE =
  "kr text-[15.5px] font-medium px-3.5 py-2 rounded-[12px] border bg-cream text-charcoal border-line shadow-[0_1px_0_var(--c-line),0_3px_6px_rgba(0,0,0,.06)] transition-[transform,border-color,opacity] hover:border-success hover:-translate-y-px active:scale-95 focus-visible:outline-2 focus-visible:outline-success focus-visible:outline-offset-2 select-none leading-[1.3] touch-none";
const TILE_USED = "opacity-35 border-dashed";
/** Legacy (checked-per-question) mode only — see the TileBoard doc comment. */
const TILE_USED_LOCKED = "opacity-20 pointer-events-none shadow-none";
/** Movement past this many px turns a press into a drag. */
const DRAG_THRESHOLD = 3;
const ZONE =
  "min-h-[78px] rounded-[16px] p-2.5 flex flex-wrap gap-2 content-start mb-3 bg-warm border-[1.5px] border-dashed border-dash transition-colors";
const BTN_CHECK =
  "rounded-[12px] px-5 py-[10px] text-sm font-extrabold text-white bg-success hover:bg-success-deep transition-colors disabled:bg-line disabled:text-faint shadow-[0_3px_0_var(--c-success-deep)] active:translate-y-px active:shadow-[0_1px_0_var(--c-success-deep)] disabled:shadow-none";
const BTN_GHOST = "text-[12.5px] font-semibold text-muted hover:text-charcoal underline decoration-dotted underline-offset-4";
const BTN_REMOVE =
  "absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-charcoal text-cream text-[11px] leading-none flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,.25)]";

/** Tap = pick, hold ≈450ms = hear it. */
function useHoldToSpeak() {
  const timer = useRef<number | null>(null);
  const spoke = useRef(false);
  // A tile held down as the board changes would otherwise still speak, 450ms
  // later, over whatever replaced it.
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);
  return {
    start(text: string) {
      spoke.current = false;
      timer.current = window.setTimeout(() => {
        spoke.current = true;
        speakKorean(text, { rate: 0.9 });
      }, 450);
    },
    end() {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = null;
    },
    /** True when the pointer-up should not count as a tap. */
    consumed() {
      const s = spoke.current;
      spoke.current = false;
      return s;
    },
  };
}

const ORDER_BADGE =
  "tryit-order-badge absolute -top-2.5 -left-2.5 w-[22px] h-[22px] rounded-full bg-success text-white text-[11px] font-extrabold leading-none flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,.25)] pointer-events-none";

function TileButton({
  tile,
  used,
  usedClass,
  wrong,
  onTap,
  hold,
  orderBadge,
}: {
  tile: Tile;
  used?: boolean;
  usedClass?: string;
  wrong?: boolean;
  onTap: () => void;
  hold: ReturnType<typeof useHoldToSpeak>;
  /** Shows the finger badge on this one tile — the next correct tap, not every tile at once (landing "try it" demo only). */
  orderBadge?: boolean;
}) {
  return (
    <span className="relative inline-block">
      {orderBadge && !used && (
        <span aria-hidden="true" className={ORDER_BADGE}>
          👆
        </span>
      )}
      <button
        type="button"
        className={`${TILE} ${used ? (usedClass ?? TILE_USED) : ""} ${
          wrong ? "border-danger bg-danger-bg shadow-[0_2px_0_var(--c-danger)]" : ""
        }`}
        onPointerDown={() => hold.start(tile.text)}
        onPointerUp={() => hold.end()}
        onPointerLeave={() => hold.end()}
        onPointerCancel={() => hold.end()}
        onClick={() => {
          if (!hold.consumed()) onTap();
        }}
        onContextMenu={(e) => e.preventDefault()}
        aria-pressed={used}
      >
        {tile.text}
      </button>
    </span>
  );
}

/** A placed tile in the new-mode answer zone: press and drag to reorder it,
 * or just tap it then tap another placed tile to swap the two with no drag
 * at all — either way is a full reorder. Hold still speaks it, and the
 * small badge removes it outright. */
function DraggableZoneTile({
  id,
  tile,
  dragging,
  selected,
  wrong,
  setRef,
  onDragStart,
  onDragMove,
  onDragEnd,
  onRemove,
  removeLabel,
}: {
  id: string;
  tile: Tile;
  dragging: boolean;
  selected: boolean;
  wrong?: boolean;
  setRef: (id: string, el: HTMLSpanElement | null) => void;
  onDragStart: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onDragMove: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onDragEnd: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <span ref={(el) => setRef(id, el)} className="relative inline-block">
      <button
        type="button"
        className={`${TILE} ${dragging ? "opacity-0" : ""} ${
          selected ? "border-success ring-2 ring-success/40 -translate-y-px" : ""
        } ${wrong ? "border-danger bg-danger-bg shadow-[0_2px_0_var(--c-danger)]" : ""}`}
        aria-pressed={selected}
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
        onContextMenu={(e) => e.preventDefault()}
      >
        {tile.text}
      </button>
      <button type="button" className={BTN_REMOVE} aria-label={removeLabel} onClick={onRemove}>
        ×
      </button>
    </span>
  );
}

export function TileBoard({
  board,
  picked,
  checked,
  onChange,
  onCheck,
  onReset,
  orderHint,
  reorder,
  requireFull = true,
}: {
  board: Board;
  picked: string[];
  onChange: (picked: string[]) => void;
  onReset: () => void;
  /**
   * Omit both `checked` and `onCheck` for the normal Writing flow: every tile
   * is a plain switch (tap either copy to add or take it back), placed words
   * can be reordered by tapping two of them to swap, and checking happens
   * once, for the whole chapter, after it's submitted.
   *
   * The level-test placement quiz is the one caller that still checks per
   * question (an adaptive test needs the right/wrong verdict immediately) —
   * passing both props opts back into that legacy locked/highlighted mode,
   * where a placed tile can only be removed, never reordered by default (see
   * `reorder` below).
   */
  checked?: boolean | null;
  onCheck?: () => void;
  /**
   * Shows a single 👆 badge on whichever untapped source tile is the next
   * correct tap — it moves as tiles are placed, never all three at once.
   * Never pass this in the real Writing flow — it would hand the answer
   * straight to the learner. Landing-page "try it" demo only.
   */
  orderHint?: boolean;
  /**
   * Lets placed tiles be press-dragged or tap-swapped even in legacy
   * (`checked`/`onCheck`) mode — normally that mode only supports tap-to-
   * remove. The real Writing flow (no `checked`/`onCheck`) always allows
   * this regardless of this prop. Landing-page "try it" demo only.
   */
  reorder?: boolean;
  /**
   * Legacy mode's Check button is disabled until every tile is placed by
   * default. Pass `false` to enable it as soon as one tile is placed — the
   * landing "try it" demo checks whatever prefix of the sentence is placed
   * so far instead of requiring the whole thing.
   */
  requireFull?: boolean;
}) {
  const t = useTranslations("writing.board");
  const hold = useHoldToSpeak();
  const byId = new Map(board.tiles.map((t) => [t.id, t]));
  const legacyCheck = onCheck !== undefined;
  const canReorder = !legacyCheck || reorder;

  // The one tile id the finger badge sits on: whichever source tile matches
  // the next unplaced word of the answer, skipping words a duplicate has
  // already claimed. Recomputes every render, so the badge walks from tile
  // to tile as `picked` grows instead of marking the whole order up front.
  let nextHintId: string | undefined;
  if (orderHint && picked.length < board.answer.length) {
    const claimed = new Set<string>();
    for (let i = 0; i < board.answer.length; i++) {
      const match = board.tiles.find((tl) => tl.text === board.answer[i] && !claimed.has(tl.id));
      if (!match) break;
      claimed.add(match.id);
      if (i === picked.length) {
        nextHintId = match.id;
        break;
      }
    }
  }

  // Press-and-drag reordering for the placed tiles — new mode only. Pointer
  // capture (set on pointerdown) keeps move/up events targeted at the tile
  // that started the drag even once the finger leaves its bounds, so this
  // needs no document-level listeners. A pointerdown/up with no movement in
  // between is a tap instead: it selects the tile, and tapping a second
  // placed tile swaps the two — a full reorder with two single clicks, no
  // press-and-hold required.
  const [dragId, setDragId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dragInfo = useRef<{
    id: string;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    moved: boolean;
  } | null>(null);
  const tileRefs = useRef(new Map<string, HTMLSpanElement>());
  const ghostRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);
  useEffect(() => () => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
  }, []);
  const setTileRef = (id: string, el: HTMLSpanElement | null) => {
    if (el) tileRefs.current.set(id, el);
    else tileRefs.current.delete(id);
  };

  function handleDragStart(id: string, text: string) {
    return (e: React.PointerEvent<HTMLButtonElement>) => {
      hold.start(text);
      e.currentTarget.setPointerCapture(e.pointerId);
      const rect = e.currentTarget.getBoundingClientRect();
      dragInfo.current = {
        id,
        startX: e.clientX,
        startY: e.clientY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        moved: false,
      };
    };
  }

  function handleDragMove(e: React.PointerEvent<HTMLButtonElement>) {
    const info = dragInfo.current;
    if (!info) return;
    if (!info.moved) {
      if (Math.abs(e.clientX - info.startX) < DRAG_THRESHOLD && Math.abs(e.clientY - info.startY) < DRAG_THRESHOLD) return;
      info.moved = true;
      hold.end(); // this is a drag, not a hold-to-speak
      setDragId(info.id);
      setSelectedId(null); // a real drag overrides any pending tap-to-swap
    }
    if (ghostRef.current) {
      // Move the ghost immediately, off the React/rAF cycle, so the tile
      // tracks the finger 1:1 with no per-frame batching delay.
      ghostRef.current.style.transform = `translate(${e.clientX - info.offsetX}px, ${e.clientY - info.offsetY}px)`;
    }
    // The swap hit-test does a getBoundingClientRect() per tile, which is a
    // layout read — running it on every raw pointermove (far more frequent
    // than paint) was what made the swap itself feel like it lagged behind
    // the finger. Coalesce it to at most once per animation frame.
    const x = e.clientX;
    const y = e.clientY;
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      for (const [tid, el] of tileRefs.current) {
        if (tid === info.id) continue;
        const r = el.getBoundingClientRect();
        if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
        const from = picked.indexOf(info.id);
        const to = picked.indexOf(tid);
        if (from === -1 || to === -1 || from === to) break;
        const next = [...picked];
        next.splice(from, 1);
        next.splice(to, 0, info.id);
        onChange(next);
        break;
      }
    });
  }

  function handleDragEnd() {
    const info = dragInfo.current;
    hold.end();
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    dragInfo.current = null;
    setDragId(null);
    if (!info || info.moved || hold.consumed()) return; // a real drag, or the hold-to-speak already fired
    // A plain tap: first tap on a placed tile selects it, second tap on a
    // different one swaps them, and tapping the same tile again deselects.
    // Reads `selectedId` from the closure rather than a functional updater —
    // the swap calls the parent's onChange, and doing that from inside a
    // setState updater trips React's "setState while rendering" warning.
    if (selectedId === null) {
      setSelectedId(info.id);
      return;
    }
    if (selectedId === info.id) {
      setSelectedId(null);
      return;
    }
    const from = picked.indexOf(selectedId);
    const to = picked.indexOf(info.id);
    setSelectedId(null);
    if (from !== -1 && to !== -1) {
      const next = [...picked];
      [next[from], next[to]] = [next[to], next[from]];
      onChange(next);
    }
  }

  // Warm the audio cache for every tile plus the full answer, so hold-to-
  // speak plays without a synthesis pause.
  useEffect(() => {
    prefetchKorean([...board.tiles.map((tile) => tile.text), board.answer.join(" ")]);
  }, [board]);

  const wrong = legacyCheck && checked === false ? new Set(wrongTilePositions(board, picked)) : new Set<number>();
  const zoneState = !legacyCheck
    ? ""
    : checked === true
      ? "border-solid border-success-line bg-success-bg"
      : checked === false
        ? "border-solid border-danger bg-danger-bg"
        : "";
  const locked = legacyCheck && checked === true;

  return (
    <div>
      <div className={`${ZONE} ${zoneState}`} aria-live="polite">
        {picked.length === 0 && <span className="text-[12.5px] text-faint px-1.5 py-1">{t("tapWords")}</span>}
        {picked.map((id, i) => {
          const tile = byId.get(id);
          if (!tile) return null;
          if (legacyCheck && (!canReorder || locked)) {
            return (
              <TileButton
                key={id}
                tile={tile}
                wrong={wrong.has(i)}
                hold={hold}
                onTap={() => {
                  if (locked) return;
                  onChange(picked.filter((x) => x !== id));
                }}
              />
            );
          }
          // Reorderable mode: press and drag a placed tile, or tap two to
          // swap them; the small badge removes it outright.
          return (
            <DraggableZoneTile
              key={id}
              id={id}
              tile={tile}
              dragging={dragId === id}
              selected={selectedId === id}
              wrong={legacyCheck ? wrong.has(i) : undefined}
              setRef={setTileRef}
              onDragStart={handleDragStart(id, tile.text)}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              onRemove={() => {
                if (selectedId === id) setSelectedId(null);
                onChange(picked.filter((x) => x !== id));
              }}
              removeLabel={t("remove", { word: tile.text })}
            />
          );
        })}
        {dragId && (
          <div
            ref={ghostRef}
            aria-hidden="true"
            className={`${TILE} fixed top-0 left-0 z-50 pointer-events-none shadow-lg scale-105`}
            style={{ transform: "translate(-9999px, -9999px)" }}
          >
            {byId.get(dragId)?.text}
          </div>
        )}
      </div>
      {/* Outside legacy mode, every word is a switch: tap to place it, tap its
          dimmed twin here (or tap it again in the zone above) to take it back
          — checking happens once the whole chapter is turned in. */}
      <div className="flex flex-wrap gap-2 mb-3.5" data-tiles>
        {board.tiles.map((tile) => {
          const used = picked.includes(tile.id);
          return (
            <TileButton
              key={tile.id}
              tile={tile}
              used={used}
              usedClass={legacyCheck ? TILE_USED_LOCKED : TILE_USED}
              hold={hold}
              orderBadge={orderHint && tile.id === nextHintId}
              onTap={() => {
                if (legacyCheck) {
                  if (locked || used) return;
                  onChange([...picked, tile.id]);
                  return;
                }
                onChange(used ? picked.filter((x) => x !== tile.id) : [...picked, tile.id]);
              }}
            />
          );
        })}
      </div>
      <div className={`flex items-center gap-3 flex-wrap ${legacyCheck ? "justify-between" : "justify-end"}`}>
        {legacyCheck &&
          (checked === true ? (
            <span className="text-[13.5px] font-bold text-success flex items-center gap-2">
              {t("correct")}
              <button type="button" className={BTN_GHOST} onClick={() => speakKorean(board.answer.join(" "), { rate: 0.9 })}>
                {t("hearIt")}
              </button>
            </span>
          ) : (
            // By default only a full answer can be checked — a partial one
            // always grades wrong, which read as the app marking a
            // half-built sentence "incorrect" out of nowhere. `requireFull`
            // false (landing demo) instead allows checking any non-empty
            // prefix.
            <button
              type="button"
              className={BTN_CHECK}
              onClick={onCheck}
              disabled={requireFull ? picked.length !== board.answer.length : picked.length === 0}
            >
              {checked === false ? t("tryAgain") : t("check")}
            </button>
          ))}
        {(!legacyCheck || checked !== true) && (
          <button type="button" className={BTN_GHOST} onClick={onReset}>
            {t("reset")}
          </button>
        )}
      </div>
    </div>
  );
}
