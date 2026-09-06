"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  dist,
  nearest,
  pointAt,
  sampleStroke,
  sampledStrokes,
  strokeWidthFor,
  TRACE_BOX,
  type Pt,
  type SampledStroke,
} from "@/lib/hangul-trace";

export type TraceMode = "practice" | "challenge";

export type TraceCanvasHandle = {
  reset: () => void;
  /** Free-hand strokes drawn so far (challenge mode), in box units. */
  drawn: () => Pt[][];
};

type Props = {
  char: string;
  mode: TraceMode;
  /** Every stroke traced end to end (practice). Fires once per reset. */
  onPracticeDone?: () => void;
  /** Number of free-hand strokes on the paper changed (challenge). */
  onDrawnCountChange?: (n: number) => void;
  /** Index of the stroke waiting to be traced changed (practice). */
  onActiveStrokeChange?: (index: number) => void;
  /** Stop taking input — e.g. after the attempt has been graded. */
  locked?: boolean;
  /** Short pointer for the learner, shown as a pill at the bottom of the paper. */
  hint?: string | null;
  tourId?: string;
  className?: string;
};

const HANGUL_ACCENT = "#C63958";
/** How close (box units) a press has to be to the stroke start / current ink tip to count. */
const GRAB_RADIUS = 44;
/** A press further along the stroke than this can't jump the ink forward — no skipping the middle. */
const MAX_JUMP = 0.18;
const DONE_AT = 0.95;

/**
 * The paper the learner writes on. Practice: the whole letter sits there in
 * grey, and a drag is projected onto the active stroke's path — only the
 * progress along the path counts, so a wobbly finger still draws a clean
 * textbook stroke. Challenge: no guide at all, free-hand strokes are
 * recorded for `scoreAttempt`.
 */
const TraceCanvas = forwardRef<TraceCanvasHandle, Props>(function TraceCanvas(
  { char, mode, onPracticeDone, onDrawnCountChange, onActiveStrokeChange, locked = false, hint, tourId, className },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokes = sampledStrokes(char);
  const penWidth = strokeWidthFor(char);

  // Mutable session state lives in refs (pointer events fire far faster than
  // React can re-render); React state only mirrors what the UI needs.
  const active = useRef(0);
  const progress = useRef<number[]>([]);
  const done = useRef<boolean[]>([]);
  const dragging = useRef(false);
  const drawn = useRef<Pt[][]>([]);
  const current = useRef<Pt[] | null>(null);
  const firedDone = useRef(false);
  // Parent callbacks through refs, so a parent re-render (new closure) never
  // re-triggers the reset effect below.
  const onPracticeDoneRef = useRef(onPracticeDone);
  const onDrawnCountChangeRef = useRef(onDrawnCountChange);
  const onActiveStrokeChangeRef = useRef(onActiveStrokeChange);
  onPracticeDoneRef.current = onPracticeDone;
  onDrawnCountChangeRef.current = onDrawnCountChange;
  onActiveStrokeChangeRef.current = onActiveStrokeChange;
  const [bars, setBars] = useState<{ active: number; progress: number[]; done: boolean[] }>({ active: 0, progress: [], done: [] });

  const css = useCallback((name: string, fallback: string) => {
    const el = canvasRef.current;
    if (!el) return fallback;
    return getComputedStyle(el).getPropertyValue(name).trim() || fallback;
  }, []);

  const drawStroke = useCallback((ctx: CanvasRenderingContext2D, s: SampledStroke, uMax: number, color: string, width = penWidth) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < s.pts.length; i++) {
      if (s.u[i] > uMax) break;
      if (!started) { ctx.moveTo(s.pts[i][0], s.pts[i][1]); started = true; }
      else ctx.lineTo(s.pts[i][0], s.pts[i][1]);
    }
    if (uMax > 0 && uMax < 1) { const p = pointAt(s, uMax); ctx.lineTo(p[0], p[1]); }
    if (started) ctx.stroke();
  }, [penWidth]);

  const draw = useCallback((travelU: number | null = null) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== TRACE_BOX * dpr) { canvas.width = TRACE_BOX * dpr; canvas.height = TRACE_BOX * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, TRACE_BOX, TRACE_BOX);

    const ink = css("--c-charcoal", "#4A4237");
    const guide = css("--c-dash", "#DDD6C8");
    const grid = css("--c-line", "#E3DDD0");

    // paper: dot grid + a faint cross, like a 원고지 cell
    ctx.fillStyle = grid;
    for (let x = 20; x <= 300; x += 28) for (let y = 20; y <= 300; y += 28) { ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = grid; ctx.lineWidth = 1; ctx.setLineDash([3, 6]);
    ctx.beginPath(); ctx.moveTo(160, 22); ctx.lineTo(160, 298); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(22, 160); ctx.lineTo(298, 160); ctx.stroke();
    ctx.setLineDash([]);

    if (mode === "practice") {
      strokes.forEach((s, i) => { if (!done.current[i]) drawStroke(ctx, s, 1, guide); });
      strokes.forEach((s, i) => { const u = done.current[i] ? 1 : progress.current[i] ?? 0; if (u > 0) drawStroke(ctx, s, u, ink); });

      if (travelU != null && active.current < strokes.length && !dragging.current) {
        const p = pointAt(strokes[active.current], travelU);
        ctx.globalAlpha = 0.55; ctx.fillStyle = HANGUL_ACCENT;
        ctx.beginPath(); ctx.arc(p[0], p[1], 7, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }

      strokes.forEach((s, i) => {
        if (done.current[i]) return;
        const a = s.pts[0];
        const isActive = i === active.current;
        ctx.beginPath(); ctx.arc(a[0], a[1], isActive ? 13 : 10, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? HANGUL_ACCENT : css("--c-faint", "#A19A8C");
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = `800 ${isActive ? 13 : 12}px "Noto Sans KR", sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(String(i + 1), a[0], a[1] + 1);
      });
    } else {
      const all = current.current ? [...drawn.current, current.current] : drawn.current;
      for (const pts of all) {
        if (pts.length < 2) continue;
        // decimate then smooth lightly so the ink reads clean, not jittery
        const anchors = pts.filter((_, i) => i % 3 === 0 || i === pts.length - 1);
        drawStroke(ctx, sampleStroke(anchors, 3), 1, ink);
      }
    }
  }, [css, drawStroke, mode, strokes]);

  const syncBars = useCallback(() => {
    setBars({ active: active.current, progress: [...progress.current], done: [...done.current] });
    onActiveStrokeChangeRef.current?.(active.current);
  }, []);

  const reset = useCallback(() => {
    active.current = 0;
    progress.current = strokes.map(() => 0);
    done.current = strokes.map(() => false);
    dragging.current = false;
    drawn.current = [];
    current.current = null;
    firedDone.current = false;
    syncBars();
    onDrawnCountChangeRef.current?.(0);
    draw(0);
  }, [draw, strokes, syncBars]);

  useImperativeHandle(ref, () => ({ reset, drawn: () => drawn.current }), [reset]);

  // New letter or mode → fresh paper.
  useEffect(() => { reset(); }, [char, mode, reset]);

  // Travelling dot on the active stroke (practice), unless motion is reduced.
  useEffect(() => {
    if (mode !== "practice") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const loop = (ts: number) => {
      if (active.current < strokes.length && !dragging.current) draw((ts / 1500) % 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [draw, mode, strokes.length]);

  const toBox = (e: React.PointerEvent<HTMLCanvasElement>): Pt => {
    const r = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * TRACE_BOX, ((e.clientY - r.top) / r.height) * TRACE_BOX];
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (locked) return;
    const p = toBox(e);
    if (mode === "practice") {
      if (active.current >= strokes.length) return;
      const s = strokes[active.current];
      const nearStart = dist(p, s.pts[0]) < GRAB_RADIUS;
      const nearTip = dist(p, pointAt(s, progress.current[active.current] ?? 0)) < GRAB_RADIUS;
      if (!nearStart && !nearTip) return;
    } else {
      current.current = [p];
    }
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    draw();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging.current) return;
    const p = toBox(e);
    if (mode === "practice") {
      const i = active.current;
      const s = strokes[i];
      const n = nearest(p, s);
      const cur = progress.current[i] ?? 0;
      if (n.u > cur && n.u - cur < MAX_JUMP) progress.current[i] = n.u;
      if (progress.current[i] >= DONE_AT) {
        done.current[i] = true;
        progress.current[i] = 1;
        dragging.current = false;
        active.current = i + 1;
        if (active.current >= strokes.length && !firedDone.current) {
          firedDone.current = true;
          onPracticeDoneRef.current?.();
        }
      }
      syncBars();
    } else {
      current.current?.push(p);
    }
    draw();
  };

  const endDrag = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (mode === "challenge" && current.current) {
      if (current.current.length > 3) drawn.current.push(current.current);
      current.current = null;
      onDrawnCountChangeRef.current?.(drawn.current.length);
    }
    draw();
  };

  const allDone = mode === "practice" && bars.done.length > 0 && bars.done.every(Boolean);

  return (
    <div className={className}>
      <div
        data-tour={tourId}
        className="relative w-full mx-auto aspect-square rounded-[18px] bg-cream overflow-hidden shadow-[inset_0_0_0_1.5px_var(--c-line)]"
        style={{ maxWidth: "clamp(240px, 80vw, 320px)", touchAction: "none" }}
      >
        <canvas
          ref={canvasRef}
          width={TRACE_BOX}
          height={TRACE_BOX}
          className="block w-full h-full"
          style={{ touchAction: "none", cursor: locked ? "default" : "crosshair" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={endDrag}
          aria-label={char}
          role="img"
        />
        {hint && !allDone ? (
          <span className="absolute left-1/2 bottom-2.5 -translate-x-1/2 whitespace-nowrap text-[11.5px] font-bold text-muted bg-warm border border-line rounded-full px-3 py-1 shadow-sm pointer-events-none">
            {hint}
          </span>
        ) : null}
      </div>

      {mode === "practice" && bars.progress.length > 0 ? (
        <div className="flex gap-1.5 w-full mx-auto mt-3" style={{ maxWidth: "clamp(240px, 80vw, 320px)" }} aria-hidden="true">
          {bars.progress.map((u, i) => {
            const isActive = i === bars.active && !bars.done[i];
            return (
              <span
                key={i}
                className={`flex-1 h-1.5 rounded-full bg-line overflow-hidden ${isActive ? "shadow-[0_0_0_2px_#FBE9EE]" : ""}`}
              >
                <i
                  className="block h-full rounded-full transition-[width] duration-100"
                  style={{ width: `${bars.done[i] ? 100 : Math.round(u * 100)}%`, background: isActive ? HANGUL_ACCENT : "var(--c-success)" }}
                />
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
});

export default TraceCanvas;
