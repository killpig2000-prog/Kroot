"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { speakKorean } from "@/lib/tts";
import {
  checkSlots,
  slotsText,
  wrongTilePositions,
  type ChunkBoard as ChunkBoardT,
  type SlotBoard as SlotBoardT,
  type Tile,
  type TileBoard as TileBoardT,
} from "@/lib/writing-builder";

// The three assemble boards. Each is a controlled component: the session
// owns the picks so a submitted chapter can rebuild the answer text.

const TILE =
  "kr text-[15.5px] font-medium px-3.5 py-2 rounded-[12px] border bg-cream text-charcoal border-line shadow-[0_1px_0_var(--c-line),0_3px_6px_rgba(0,0,0,.06)] transition-[transform,border-color,opacity] hover:border-success hover:-translate-y-px active:scale-95 focus-visible:outline-2 focus-visible:outline-success focus-visible:outline-offset-2 select-none leading-[1.3]";
const TILE_USED = "opacity-20 pointer-events-none shadow-none";
const ZONE =
  "min-h-[78px] rounded-[16px] p-2.5 flex flex-wrap gap-2 content-start mb-3 bg-warm border-[1.5px] border-dashed border-dash transition-colors";
const BTN_CHECK =
  "rounded-[12px] px-5 py-[10px] text-sm font-extrabold text-white bg-success hover:bg-success-deep transition-colors disabled:bg-line disabled:text-faint shadow-[0_3px_0_var(--c-success-deep)] active:translate-y-px active:shadow-[0_1px_0_var(--c-success-deep)] disabled:shadow-none";
const BTN_GHOST = "text-[12.5px] font-semibold text-muted hover:text-charcoal underline decoration-dotted underline-offset-4";

/** Tap = pick, hold ≈450ms = hear it. */
function useHoldToSpeak() {
  const timer = useRef<number | null>(null);
  const spoke = useRef(false);
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
  selected,
  wrong,
  onTap,
  hold,
  pill,
}: {
  tile: Tile;
  used?: boolean;
  /** Chosen for the active slot — highlighted, still tappable. */
  selected?: boolean;
  wrong?: boolean;
  onTap: () => void;
  hold: ReturnType<typeof useHoldToSpeak>;
  pill?: boolean;
}) {
  return (
    <button
      type="button"
      className={`${TILE} ${used ? TILE_USED : ""} ${
        selected ? "border-success bg-success-bg text-success-deep shadow-[0_2px_0_var(--c-success-line)]" : ""
      } ${wrong ? "border-danger bg-danger-bg shadow-[0_2px_0_var(--c-danger)]" : ""} ${
        pill ? "rounded-full text-[14px] px-4" : ""
      }`}
      onPointerDown={() => hold.start(tile.text)}
      onPointerUp={() => hold.end()}
      onPointerLeave={() => hold.end()}
      onPointerCancel={() => hold.end()}
      onClick={() => {
        if (!hold.consumed()) onTap();
      }}
      onContextMenu={(e) => e.preventDefault()}
      aria-pressed={used || selected}
    >
      {tile.text}
    </button>
  );
}

// ---------------------------------------------------------------------------

export function TileBoard({
  board,
  picked,
  checked,
  onChange,
  onCheck,
  onShuffle,
}: {
  board: TileBoardT;
  picked: string[];
  /** null = not checked yet; true/false = last check result. */
  checked: boolean | null;
  onChange: (picked: string[]) => void;
  onCheck: () => void;
  onShuffle: () => void;
}) {
  const t = useTranslations("writing.board");
  const hold = useHoldToSpeak();
  const byId = new Map(board.tiles.map((t) => [t.id, t]));
  const wrong = checked === false ? new Set(wrongTilePositions(board, picked)) : new Set<number>();
  const zoneState = checked === true ? "border-solid border-success-line bg-success-bg" : checked === false ? "border-solid border-danger bg-danger-bg" : "";

  return (
    <div>
      <div className={`${ZONE} ${zoneState}`} aria-live="polite">
        {picked.length === 0 && <span className="text-[12.5px] text-faint px-1.5 py-1">{t("tapWords")}</span>}
        {picked.map((id, i) => {
          const t = byId.get(id);
          if (!t) return null;
          return (
            <TileButton
              key={id}
              tile={t}
              wrong={wrong.has(i)}
              hold={hold}
              onTap={() => {
                if (checked === true) return;
                onChange(picked.filter((x) => x !== id));
              }}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2 mb-3.5">
        {board.tiles.map((t) => (
          <TileButton
            key={t.id}
            tile={t}
            used={picked.includes(t.id)}
            hold={hold}
            onTap={() => {
              if (checked === true) return;
              onChange([...picked, t.id]);
            }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {checked === true ? (
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
        )}
        <span className="text-[12px] text-faint">
          {t("holdWord")}
          {checked !== true && (
            <>
              {" · "}
              <button type="button" className={BTN_GHOST} onClick={onShuffle}>
                {t("shuffle")}
              </button>
            </>
          )}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function SlotBoard({
  board,
  chosen,
  active,
  checked,
  onPick,
  onActivate,
  onCheck,
}: {
  board: SlotBoardT;
  chosen: (string | null)[];
  active: number;
  checked: boolean | null;
  onPick: (slot: number, value: string) => void;
  onActivate: (slot: number) => void;
  onCheck: () => void;
}) {
  const t = useTranslations("writing.board");
  const hold = useHoldToSpeak();
  const results = checked === null ? null : checkSlots(board, chosen);
  const allRight = results?.every(Boolean) ?? false;
  const slotAt = new Map(board.slots.map((s, i) => [s.index, i]));
  const slot = board.slots[active];

  return (
    <div>
      <p
        className="kr text-[18px] leading-[1.9] mb-3.5 rounded-[16px] border border-line bg-warm px-4 py-3"
        style={{ backgroundImage: "repeating-linear-gradient(transparent 0 33px, var(--c-line) 33px 34px)", backgroundPosition: "0 9px" }}
      >
        {board.words.map((w, i) => {
          const si = slotAt.get(i);
          if (si === undefined) return <span key={i}>{w} </span>;
          const value = chosen[si];
          const right = results ? results[si] : null;
          return (
            <span key={i}>
              <button
                type="button"
                onClick={() => onActivate(si)}
                className={`inline-block min-w-[64px] px-1.5 rounded-t-[6px] border-b-[2.5px] text-center font-bold transition-colors ${
                  right === true
                    ? "border-success text-success-deep"
                    : right === false
                      ? "border-danger text-danger"
                      : value
                        ? "border-success text-success-deep"
                        : "border-amber text-amber"
                } ${si === active && !allRight ? "bg-[var(--tint-amber)]" : ""}`}
              >
                {value ?? "?"}
              </button>{" "}
            </span>
          );
        })}
      </p>

      {!allRight && slot && (
        <div className="flex flex-wrap gap-2 mb-3.5">
          {slot.options.map((o) => (
            <TileButton
              key={o}
              tile={{ id: o, text: o }}
              selected={chosen[active] === o}
              hold={hold}
              onTap={() => onPick(active, o)}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        {allRight ? (
          <span className="text-[13.5px] font-bold text-success flex items-center gap-2">
            {board.slots.length > 1 ? t("allRight") : t("singleCorrect")}
            <button type="button" className={BTN_GHOST} onClick={() => speakKorean(slotsText(board, chosen), { rate: 0.9 })}>
              {t("hearIt")}
            </button>
          </span>
        ) : (
          <button type="button" className={BTN_CHECK} onClick={onCheck} disabled={chosen.some((c) => !c)}>
            {checked === false ? t("tryAgain") : t("check")}
          </button>
        )}
        <span className="text-[12px] text-faint">
          {board.slots[active]?.kind === "ending" ? t("pickEnding") : t("pickParticle")}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function ChunkBoard({
  board,
  picked,
  onChange,
}: {
  board: ChunkBoardT;
  picked: string[];
  onChange: (picked: string[]) => void;
}) {
  const t = useTranslations("writing.board");
  const hold = useHoldToSpeak();
  const byId = new Map(board.chunks.map((t) => [t.id, t]));
  return (
    <div>
      <div className={`${ZONE} min-h-[96px]`} aria-live="polite">
        {picked.length === 0 && <span className="text-[12.5px] text-faint px-1.5 py-1">{t("tapBlocks")}</span>}
        {picked.map((id) => {
          const t = byId.get(id);
          if (!t) return null;
          return <TileButton key={id} tile={t} pill hold={hold} onTap={() => onChange(picked.filter((x) => x !== id))} />;
        })}
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        {board.chunks.map((t) => (
          <TileButton key={t.id} tile={t} pill used={picked.includes(t.id)} hold={hold} onTap={() => onChange([...picked, t.id])} />
        ))}
      </div>
      <p className="text-[12px] text-faint">Some blocks don&apos;t belong — leave them out. Graded like a written answer.</p>
    </div>
  );
}
