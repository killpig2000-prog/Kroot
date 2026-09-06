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
// then the ㅏ/ㅓ/ㅣ part). The ㅗ/ㅜ/ㅡ part sits in the lower half — the
// block's upper-left belongs to the consonant. Only a ㅜ-type part, whose
// stem hangs DOWN, lands on the same baseline as the side ㅣ (ㅝ ㅞ ㅟ);
// a ㅗ bar or a lone ㅡ (ㅘ ㅙ ㅚ ㅢ) sits a little higher, as it does in
// print — flush with the bottom it read as a floor line.
const COMPOUND_VOWELS: Record<string, StrokeAnchors[]> = {
  // ㅐ ㅒ ㅔ ㅖ (and ㅙ): the two stems sit a touch closer than a full letter apart.
  ㅐ: [[C(126, 52), C(126, 268)], [C(126, 160), C(190, 160)], [C(196, 52), C(196, 268)]],
  ㅒ: [[C(120, 52), C(120, 268)], [C(120, 124), C(186, 124)], [C(120, 196), C(186, 196)], [C(196, 52), C(196, 268)]],
  ㅔ: [[C(90, 160), C(136, 160)], [C(136, 52), C(136, 268)], [C(204, 52), C(204, 268)]],
  ㅖ: [[C(86, 124), C(138, 124)], [C(86, 196), C(138, 196)], [C(138, 52), C(138, 268)], [C(206, 52), C(206, 268)]],
  ㅘ: [[C(106, 180), C(106, 232)], [C(52, 232), C(160, 232)], [C(200, 52), C(200, 268)], [C(200, 150), C(254, 150)]],
  ㅙ: [[C(94, 180), C(94, 232)], [C(46, 232), C(142, 232)], [C(184, 52), C(184, 268)], [C(184, 150), C(246, 150)], [C(250, 52), C(250, 268)]],
  ㅚ: [[C(110, 180), C(110, 232)], [C(52, 232), C(170, 232)], [C(222, 52), C(222, 268)]],
  // ㅝ ㅞ: the ㅓ/ㅔ tick sits BELOW ㅜ's bar, as in print (워, 웨).
  ㅝ: [[C(48, 184), C(160, 184)], [C(104, 184), C(104, 268)], [C(170, 226), C(214, 226)], [C(214, 52), C(214, 268)]],
  ㅞ: [[C(42, 184), C(146, 184)], [C(94, 184), C(94, 268)], [C(156, 226), C(194, 226)], [C(194, 52), C(194, 268)], [C(254, 52), C(254, 268)]],
  ㅟ: [[C(48, 196), C(170, 196)], [C(108, 196), C(108, 268)], [C(222, 52), C(222, 268)]],
  ㅢ: [[C(48, 200), C(186, 200)], [C(222, 52), C(222, 268)]],
};

export const TRACE_ANCHORS: Record<string, StrokeAnchors[]> = {
  ...CONSONANTS,
  ...DOUBLE_CONSONANTS,
  ...VOWELS,
  ...COMPOUND_VOWELS,
};

// ---------------------------------------------------------------------------
// Syllable blocks — a composed 가…힣 is its jamo, each squeezed into the
// part of the block it owns, written 초성 → 중성 → 종성.
// ---------------------------------------------------------------------------

const CHO_LIST = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const JUNG_LIST = ["ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅗ","ㅘ","ㅙ","ㅚ","ㅛ","ㅜ","ㅝ","ㅞ","ㅟ","ㅠ","ㅡ","ㅢ","ㅣ"];
const JONG_LIST = ["","ㄱ","ㄲ","ㄳ","ㄴ","ㄵ","ㄶ","ㄷ","ㄹ","ㄺ","ㄻ","ㄼ","ㄽ","ㄾ","ㄿ","ㅀ","ㅁ","ㅂ","ㅄ","ㅅ","ㅆ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const JONG_CLUSTERS: Record<string, [string, string]> = {
  ㄳ: ["ㄱ","ㅅ"], ㄵ: ["ㄴ","ㅈ"], ㄶ: ["ㄴ","ㅎ"], ㄺ: ["ㄹ","ㄱ"], ㄻ: ["ㄹ","ㅁ"], ㄼ: ["ㄹ","ㅂ"],
  ㄽ: ["ㄹ","ㅅ"], ㄾ: ["ㄹ","ㅌ"], ㄿ: ["ㄹ","ㅍ"], ㅀ: ["ㄹ","ㅎ"], ㅄ: ["ㅂ","ㅅ"],
};
/** y where a w-vowel's ㅗ/ㅜ/ㅡ part begins — the consonant above must stop short of it. */
const W_VOWEL_BAR_TOP: Record<string, number> = { ㅘ: 180, ㅙ: 180, ㅚ: 180, ㅝ: 184, ㅞ: 184, ㅟ: 196, ㅢ: 200 };
const VERTICAL_VOWELS = new Set(["ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅣ"]);
const HORIZONTAL_VOWELS = new Set(["ㅗ","ㅛ","ㅜ","ㅠ","ㅡ"]);

type Box = [x0: number, x1: number, y0: number, y1: number];

/**
 * Fit a jamo's anchors inside `box`: uniform scale (never squashed — an
 * ㅓ tick stretched to the box width used to run into the consonant),
 * then centred. A zero-width ㅣ or zero-height ㅡ simply lands on the
 * box's centre line.
 */
function fitBox(strokes: StrokeAnchors[], [x0, x1, y0, y1]: Box): StrokeAnchors[] {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const s of strokes) for (const [x, y] of s) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  const w = maxX - minX, h = maxY - minY;
  const scale = Math.min(w > 1 ? (x1 - x0) / w : Infinity, h > 1 ? (y1 - y0) / h : Infinity, 1.4);
  const k = Number.isFinite(scale) ? scale : 1;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const mx = (minX + maxX) / 2, my = (minY + maxY) / 2;
  return strokes.map((s) => {
    const out: StrokeAnchors = s.map(([x, y]) => [cx + (x - mx) * k, cy + (y - my) * k] as Pt);
    out.circle = s.circle;
    return out;
  });
}

function jongAnchors(jong: string): StrokeAnchors[] {
  const pair = JONG_CLUSTERS[jong];
  if (!pair) return TRACE_ANCHORS[jong] ?? [];
  return [...halfWidth(TRACE_ANCHORS[pair[0]], 112), ...halfWidth(TRACE_ANCHORS[pair[1]], 208)];
}

export function isSyllable(char: string): boolean {
  const c = char.charCodeAt(0);
  return char.length === 1 && c >= 0xac00 && c <= 0xd7a3;
}

export function decompose(char: string): { cho: string; jung: string; jong: string } {
  const code = char.charCodeAt(0) - 0xac00;
  return { cho: CHO_LIST[Math.floor(code / 588)], jung: JUNG_LIST[Math.floor((code % 588) / 28)], jong: JONG_LIST[code % 28] };
}

const SYLLABLE_CACHE = new Map<string, StrokeAnchors[]>();
function syllableAnchors(char: string): StrokeAnchors[] {
  const hit = SYLLABLE_CACHE.get(char);
  if (hit) return hit;
  const { cho, jung, jong } = decompose(char);
  const hasJong = jong !== "";
  const CENTER = TRACE_BOX / 2;
  let choPart: StrokeAnchors[], jungPart: StrokeAnchors[];
  if (VERTICAL_VOWELS.has(jung)) {
    // 가: consonant fills the left of the centre line, vowel the right —
    // both span the same height so the block reads as one symmetric letter.
    const top = hasJong ? 36 : 52, bottom = hasJong ? 166 : 268;
    choPart = fitBox(TRACE_ANCHORS[cho], [36, CENTER - 12, top, bottom]);
    jungPart = fitBox(TRACE_ANCHORS[jung], [CENTER + 8, 284, top, bottom]);
  } else if (HORIZONTAL_VOWELS.has(jung)) {
    // 고: consonant above the centre line, vowel below it.
    choPart = fitBox(TRACE_ANCHORS[cho], hasJong ? [76, 244, 30, 106] : [60, 260, 40, CENTER - 12]);
    jungPart = fitBox(TRACE_ANCHORS[jung], hasJong ? [44, 276, 116, 182] : [40, 280, CENTER + 6, 274]);
  } else if (hasJong) {
    choPart = fitBox(TRACE_ANCHORS[cho], [44, 134, 34, 112]);
    jungPart = fitBox(TRACE_ANCHORS[jung], [40, 280, 34, 178]);
  } else {
    // 뒤: the w-vowel keeps its own coordinates (its ㅗ/ㅜ part is drawn low
    // on purpose), and the consonant fills the space above that bar, its top
    // on the same line as the ㅣ's top so all three parts line up.
    const barTop = W_VOWEL_BAR_TOP[jung] ?? 184;
    choPart = fitBox(TRACE_ANCHORS[cho], [40, 150, 52, barTop - 16]);
    jungPart = TRACE_ANCHORS[jung];
  }
  const jongBox: Box = [74, 246, 190, 282];
  const out = [...choPart, ...jungPart, ...(hasJong ? fitBox(jongAnchors(jong), jongBox) : [])];
  SYLLABLE_CACHE.set(char, out);
  return out;
}

/** Anchors for a jamo or a composed syllable block; empty for anything else. */
export function anchorsFor(char: string): StrokeAnchors[] {
  return TRACE_ANCHORS[char] ?? (isSyllable(char) ? syllableAnchors(char) : []);
}

/** A block packs three letters into the box a single jamo has, so it takes a thinner pen. */
export function strokeWidthFor(char: string): number {
  return isSyllable(char) ? 15 : STROKE_WIDTH;
}

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
    s = anchorsFor(char).map((a) => sampleStroke(a));
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
