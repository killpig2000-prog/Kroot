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
const DRAG_THRESHOLD = 6;
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

function TileButton({
  tile,
  used,
  usedClass,
  wrong,
  onTap,
  hold,
}: {
  tile: Tile;
  used?: boolean;
  usedClass?: string;
  wrong?: boolean;
  onTap: () => void;
  hold: ReturnType<typeof useHoldToSpeak>;
}) {
  return (
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
  );
}

/** A placed tile in the new-mode answer zone: press and drag to reorder it,
 * a plain tap does nothing (nothing to toggle — it's already placed), hold
 * still speaks it, and the small badge removes it outright. */
function DraggableZoneTile({
  id,
  tile,
  dragging,
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
        className={`${TILE} ${dragging ? "opacity-0" : ""}`}
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
   * where a placed tile can only be removed, never reordered.
   */
  checked?: boolean | null;
  onCheck?: () => void;
}) {
  const t = useTranslations("writing.board");
  const hold = useHoldToSpeak();
  const byId = new Map(board.tiles.map((t) => [t.id, t]));
  const legacyCheck = onCheck !== undefined;

  // Press-and-drag reordering for the placed tiles — new mode only. Pointer
  // capture (set on pointerdown) keeps move/up events targeted at the tile
  // that started the drag even once the finger leaves its bounds, so this
  // needs no document-level listeners.
  const [dragId, setDragId] = useState<string | null>(null);
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
    }
    if (ghostRef.current) {
      ghostRef.current.style.transform = `translate(${e.clientX - info.offsetX}px, ${e.clientY - info.offsetY}px)`;
    }
    for (const [tid, el] of tileRefs.current) {
      if (tid === info.id) continue;
      const r = el.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) continue;
      const from = picked.indexOf(info.id);
      const to = picked.indexOf(tid);
      if (from === -1 || to === -1 || from === to) break;
      const next = [...picked];
      next.splice(from, 1);
      next.splice(to, 0, info.id);
      onChange(next);
      break;
    }
  }

  function handleDragEnd() {
    hold.end();
    dragInfo.current = null;
    setDragId(null);
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
          if (legacyCheck) {
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
          // New mode: press and drag a placed tile to reorder it; the small
          // badge removes it outright.
          return (
            <DraggableZoneTile
              key={id}
              id={id}
              tile={tile}
              dragging={dragId === id}
              setRef={setTileRef}
              onDragStart={handleDragStart(id, tile.text)}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              onRemove={() => onChange(picked.filter((x) => x !== id))}
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
      <div className="flex flex-wrap gap-2 mb-3.5">
        {board.tiles.map((tile) => {
          const used = picked.includes(tile.id);
          return (
            <TileButton
              key={tile.id}
              tile={tile}
              used={used}
              usedClass={legacyCheck ? TILE_USED_LOCKED : TILE_USED}
              hold={hold}
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
            <button type="button" className={BTN_CHECK} onClick={onCheck} disabled={picked.length === 0}>
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
