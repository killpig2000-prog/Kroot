// Trace-to-write geometry for all 40 jamo: hand-authored stroke anchors on a
// 320×320 box, smoothed into polylines, plus the projection + scoring maths
// the practice/challenge canvases share. Pure TS — no DOM, no React.
//
// Stroke order and shapes follow the 교과서체 worksheets in _refs/ (한글획1,
// 한글획2, 한글획모음1): ㄱ·ㄴ·ㅇ are one stroke, ㅈ is two (the bar and the
// left leg are ONE ス-shaped stroke), ㅊ/ㅎ start with the short top tick,
// ㅇ starts at the top and runs counter-clockwise. Uniform stroke width —
// the learner is copying a textbook letter, not a brush.

export type Pt = [number, number];
export type StrokeAnchors = Pt[] & { circle?: boolean };

export const TRACE_BOX = 320;
/** Uniform stroke width, in box units. */
export const STROKE_WIDTH = 20;

// ---------------------------------------------------------------------------
// Anchor tables
// ---------------------------------------------------------------------------

const C = (x: number, y: number): Pt => [x, y];

/** Circle pre-sampled from the top, counter-clockwise on screen (left side first). */
function circle(cx: number, cy: number, r: number): StrokeAnchors {
  const pts: StrokeAnchors = [];
  for (let i = 0; i <= 48; i++) {
    const th = -Math.PI / 2 - (i / 48) * Math.PI * 2;
    pts.push([cx + r * Math.cos(th), cy + r * Math.sin(th)]);
  }
  pts.circle = true;
  return pts;
}

// Helper anchors ~14 units either side of a corner keep the bend tight —
// the corner-cutting smoother below would otherwise round a bare corner
// across a quarter of the run.
const CONSONANTS: Record<string, StrokeAnchors[]> = {
  ㄱ: [[C(78, 92), C(214, 92), C(228, 92), C(228, 106), C(228, 170), C(220, 222), C(196, 254)]],
  ㄴ: [[C(92, 66), C(92, 232), C(92, 246), C(106, 246), C(236, 246)]],
  ㄷ: [
    [C(92, 84), C(236, 84)],
    [C(92, 84), C(92, 232), C(92, 246), C(106, 246), C(236, 246)],
  ],
  ㄹ: [
    [C(92, 70), C(220, 70), C(232, 70), C(232, 84), C(232, 152)],
    [C(92, 156), C(232, 156)],
    [C(92, 156), C(92, 238), C(92, 250), C(106, 250), C(232, 250)],
  ],
  ㅁ: [
    [C(92, 74), C(92, 246)],
    [C(92, 74), C(218, 74), C(230, 74), C(230, 88), C(230, 246)],
    [C(92, 246), C(230, 246)],
  ],
  ㅂ: [
    [C(94, 66), C(94, 252)],
    [C(228, 66), C(228, 252)],
    [C(94, 160), C(228, 160)],
    [C(94, 252), C(228, 252)],
  ],
  ㅅ: [
    [C(160, 64), C(148, 140), C(74, 250)],
    [C(166, 134), C(206, 192), C(250, 250)],
  ],
  ㅇ: [circle(160, 160, 84)],
  ㅈ: [
    [C(78, 84), C(224, 84), C(236, 84), C(228, 102), C(150, 190), C(76, 252)],
    [C(170, 152), C(210, 200), C(250, 252)],
  ],
  ㅊ: [
    [C(136, 48), C(186, 48)],
    [C(78, 98), C(224, 98), C(236, 98), C(228, 116), C(150, 198), C(76, 258)],
    [C(172, 162), C(212, 210), C(250, 258)],
  ],
  ㅋ: [
    [C(78, 80), C(214, 80), C(228, 80), C(228, 94), C(228, 170), C(220, 226), C(196, 258)],
    [C(78, 166), C(226, 166)],
  ],
  ㅌ: [
    [C(92, 72), C(232, 72)],
    [C(92, 158), C(232, 158)],
    [C(92, 72), C(92, 236), C(92, 250), C(106, 250), C(232, 250)],
  ],
  ㅍ: [
    [C(70, 76), C(250, 76)],
    [C(112, 90), C(112, 236)],
    [C(208, 90), C(208, 236)],
    [C(70, 250), C(250, 250)],
  ],
  ㅎ: [[C(134, 46), C(186, 46)], [C(74, 92), C(246, 92)], circle(160, 186, 62)],
};

// Double consonants: the base letter squeezed to half width, written left
// copy first, then right.
const halfWidth = (strokes: StrokeAnchors[], cx: number): StrokeAnchors[] =>
  strokes.map((s) => {
    const out: StrokeAnchors = s.map(([x, y]) => [cx + (x - 160) * 0.5, y] as Pt);
    out.circle = s.circle;
    return out;
  });
const doubled = (base: string): StrokeAnchors[] => [...halfWidth(CONSONANTS[base], 112), ...halfWidth(CONSONANTS[base], 208)];
const DOUBLE_CONSONANTS: Record<string, StrokeAnchors[]> = {
  ㄲ: doubled("ㄱ"),
  ㄸ: doubled("ㄷ"),
  ㅃ: doubled("ㅂ"),
  ㅆ: doubled("ㅅ"),
  ㅉ: doubled("ㅈ"),
};

const VOWELS: Record<string, StrokeAnchors[]> = {
  ㅏ: [[C(150, 52), C(150, 268)], [C(150, 160), C(236, 160)]],
  ㅑ: [[C(144, 52), C(144, 268)], [C(144, 124), C(232, 124)], [C(144, 196), C(232, 196)]],
  ㅓ: [[C(84, 160), C(170, 160)], [C(170, 52), C(170, 268)]],
  ㅕ: [[C(88, 124), C(176, 124)], [C(88, 196), C(176, 196)], [C(176, 52), C(176, 268)]],
  ㅗ: [[C(160, 90), C(160, 190)], [C(60, 190), C(260, 190)]],
  ㅛ: [[C(118, 90), C(118, 190)], [C(202, 90), C(202, 190)], [C(60, 190), C(260, 190)]],
  ㅜ: [[C(60, 130), C(260, 130)], [C(160, 130), C(160, 240)]],
  ㅠ: [[C(60, 130), C(260, 130)], [C(118, 130), C(118, 240)], [C(202, 130), C(202, 240)]],
  ㅡ: [[C(60, 160), C(260, 160)]],
  ㅣ: [[C(160, 52), C(160, 268)]],
};

// Compound vowels: component vowels in writing order (the ㅗ/ㅜ part first,
// then the ㅏ/ㅓ/ㅣ part). The ㅗ/ㅜ/ㅡ part sits LOW — the block's upper-left
// belongs to the consonant — and every bottom landing (ㅜ's descender,
// ㅗ/ㅡ's bar, the side ㅣ) meets at the same y so the letter sits on one line.
const COMPOUND_VOWELS: Record<string, StrokeAnchors[]> = {
  ㅐ: [[C(118, 52), C(118, 268)], [C(118, 160), C(190, 160)], [C(204, 52), C(204, 268)]],
  ㅒ: [[C(112, 52), C(112, 268)], [C(112, 124), C(186, 124)], [C(112, 196), C(186, 196)], [C(204, 52), C(204, 268)]],
  ㅔ: [[C(82, 160), C(130, 160)], [C(130, 52), C(130, 268)], [C(210, 52), C(210, 268)]],
  ㅖ: [[C(78, 124), C(132, 124)], [C(78, 196), C(132, 196)], [C(132, 52), C(132, 268)], [C(212, 52), C(212, 268)]],
  ㅘ: [[C(106, 214), C(106, 268)], [C(52, 268), C(160, 268)], [C(200, 52), C(200, 268)], [C(200, 150), C(254, 150)]],
  ㅙ: [[C(94, 214), C(94, 268)], [C(46, 268), C(142, 268)], [C(178, 52), C(178, 268)], [C(178, 150), C(252, 150)], [C(252, 52), C(252, 268)]],
  ㅚ: [[C(110, 214), C(110, 268)], [C(52, 268), C(170, 268)], [C(222, 52), C(222, 268)]],
  ㅝ: [[C(48, 196), C(160, 196)], [C(104, 196), C(104, 268)], [C(170, 150), C(214, 150)], [C(214, 52), C(214, 268)]],
  ㅞ: [[C(42, 196), C(146, 196)], [C(94, 196), C(94, 268)], [C(156, 150), C(194, 150)], [C(194, 52), C(194, 268)], [C(254, 52), C(254, 268)]],
  ㅟ: [[C(48, 196), C(170, 196)], [C(108, 196), C(108, 268)], [C(222, 52), C(222, 268)]],
  ㅢ: [[C(48, 268), C(186, 268)], [C(222, 52), C(222, 268)]],
};

export const TRACE_ANCHORS: Record<string, StrokeAnchors[]> = {
  ...CONSONANTS,
  ...DOUBLE_CONSONANTS,
  ...VOWELS,
  ...COMPOUND_VOWELS,
};

// ---------------------------------------------------------------------------
// Sampling
// ---------------------------------------------------------------------------

/**
 * Chaikin corner-cutting (converges on a quadratic B-spline). Unlike
 * Catmull-Rom it never overshoots: straight runs stay perfectly straight and
 * corners become clean round bends. Endpoints are preserved.
 */
export function chaikin(anchors: Pt[], iters: number): Pt[] {
  let p = anchors;
  for (let it = 0; it < iters; it++) {
    const out: Pt[] = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i], b = p[i + 1];
      out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
      out.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    out.push(p[p.length - 1]);
    p = out;
  }
  return p;
}

export type SampledStroke = {
  pts: Pt[];
  /** Arc-length position of each sample, 0..1. */
  u: number[];
  total: number;
};

export function sampleStroke(anchors: StrokeAnchors, iters = anchors.circle ? 1 : 5): SampledStroke {
  const pts = chaikin(anchors, iters);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = cum[cum.length - 1] || 1;
  return { pts, u: cum.map((c) => c / total), total };
}

const SAMPLED_CACHE = new Map<string, SampledStroke[]>();
export function sampledStrokes(char: string): SampledStroke[] {
  let s = SAMPLED_CACHE.get(char);
  if (!s) {
    s = (TRACE_ANCHORS[char] ?? []).map((a) => sampleStroke(a));
    SAMPLED_CACHE.set(char, s);
  }
  return s;
}

export const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Nearest sample on a stroke → its index, distance, and arc-length progress. */
export function nearest(p: Pt, s: SampledStroke): { i: number; d: number; u: number } {
  let bi = 0, bd = Infinity;
  for (let i = 0; i < s.pts.length; i++) {
    const d = dist(p, s.pts[i]);
    if (d < bd) { bd = d; bi = i; }
  }
  return { i: bi, d: bd, u: s.u[bi] };
}

/** Point at arc-length progress u (0..1) along a stroke. */
export function pointAt(s: SampledStroke, u: number): Pt {
  let i = 0;
  while (i < s.u.length - 1 && s.u[i + 1] < u) i++;
  const a = s.pts[i], b = s.pts[Math.min(i + 1, s.pts.length - 1)];
  const span = (s.u[i + 1] ?? 1) - s.u[i] || 1;
  const t = Math.max(0, Math.min(1, (u - s.u[i]) / span));
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

// ---------------------------------------------------------------------------
// Challenge scoring
// ---------------------------------------------------------------------------

export type StrokeVerdict = { index: number; missing: boolean; shapePct: number; orderOk: boolean };
export type TraceScore = {
  /** 0–100. */
  score: number;
  /** 0–3. */
  stars: number;
  strokes: StrokeVerdict[];
  drawnCount: number;
  targetCount: number;
};

export function starsFor(score: number): number {
  return score >= 85 ? 3 : score >= 60 ? 2 : score >= 1 ? 1 : 0;
}

/**
 * Score a free-hand attempt against the target letter. Shape = average
 * distance from the drawn stroke to the target path (in box units); order =
 * whether each drawn stroke starts nearest the start of the target stroke
 * it should be; count = did they draw the right number of strokes.
 * 60% shape · 40% order, minus a flat penalty for a wrong stroke count.
 */
export function scoreAttempt(drawn: Pt[][], char: string): TraceScore {
  const target = sampledStrokes(char);
  const strokes: StrokeVerdict[] = [];
  let shapeSum = 0, orderHits = 0;

  target.forEach((t, i) => {
    const d = drawn[i];
    if (!d || d.length < 2) {
      strokes.push({ index: i, missing: true, shapePct: 0, orderOk: false });
      return;
    }
    const N = 24;
    let sum = 0;
    for (let k = 0; k < N; k++) {
      const idx = Math.floor((k / (N - 1)) * (d.length - 1));
      sum += nearest(d[idx], t).d;
    }
    const shapePct = Math.max(0, Math.round(100 - (sum / N) * 1.1));
    shapeSum += shapePct;

    let best = 0, bestD = Infinity;
    target.forEach((ts, ti) => {
      const dd = dist(d[0], ts.pts[0]);
      if (dd < bestD) { bestD = dd; best = ti; }
    });
    const orderOk = best === i;
    if (orderOk) orderHits++;
    strokes.push({ index: i, missing: false, shapePct, orderOk });
  });

  const n = target.length || 1;
  const avgShape = Math.round(shapeSum / n);
  const orderPct = Math.round((orderHits / n) * 100);
  const penalty = drawn.length === target.length ? 0 : 18;
  const score = Math.max(0, Math.min(100, Math.round(avgShape * 0.6 + orderPct * 0.4 - penalty)));
  return { score, stars: starsFor(score), strokes, drawnCount: drawn.length, targetCount: target.length };
}
