// Hand-authored stroke-order paths for all 40 jamo, on a 100x100 grid —
// Hangul strokes are straight lines plus one circle, so these are drawn
// directly rather than extracted from a font (glyph outlines don't carry
// pen-stroke sequence data).
export type HangulStroke = {
  d: string;
  /** SVG transform applied to this stroke only — used to mirror a circle
   *  (drawn clockwise, which is reliable across browsers, then flipped to
   *  read as counter-clockwise) and to compress a base jamo's strokes into
   *  one half of a compound letter's box. */
  transform?: string;
};

const MIRROR = "translate(100 0) scale(-1 1)";

// -- the 14 basic consonants (초성) --
const CONSONANTS: Record<string, HangulStroke[]> = {
  ㄱ: [{ d: "M22,26 L74,26 L74,80" }],
  ㄴ: [{ d: "M26,20 L26,76 L80,76" }],
  ㄷ: [{ d: "M20,22 L78,22" }, { d: "M20,22 L20,78 L78,78" }],
  // ㄱ shape, then a horizontal bridge, then an ㄴ shape — three separate
  // strokes, fully connected end to end. The ㄱ and ㄴ halves split the
  // height evenly at the bridge, and the bridge itself is drawn left to
  // right (matching how the following ㄴ stroke starts), not right to left.
  ㄹ: [
    { d: "M18,12 L70,12 L70,50" },
    { d: "M18,50 L70,50" },
    { d: "M18,50 L18,88 L70,88" },
  ],
  ㅁ: [{ d: "M20,20 L20,80" }, { d: "M20,20 L80,20 L80,80" }, { d: "M20,80 L80,80" }],
  // Two full-height verticals ("11"), then the middle bar, then the bottom
  // bar closing the shape onto both verticals' feet.
  ㅂ: [{ d: "M25,15 L25,82" }, { d: "M75,15 L75,82" }, { d: "M25,48 L75,48" }, { d: "M25,82 L75,82" }],
  ㅅ: [{ d: "M50,18 L20,82" }, { d: "M46,46 L80,82" }],
  ㅇ: [{ d: "M50,18 A32,32 0 1 1 49.99,18 Z", transform: MIRROR }],
  // Modern form: the second stroke drops from the right end of the top bar
  // (not from its middle), and the third stroke branches off partway down it.
  ㅈ: [{ d: "M20,20 L80,20" }, { d: "M80,20 L25,80" }, { d: "M57,45 L80,80" }],
  ㅊ: [{ d: "M42,10 L50,18" }, { d: "M20,26 L80,26" }, { d: "M80,26 L25,84" }, { d: "M57,50 L80,84" }],
  ㅋ: [{ d: "M22,26 L74,26 L74,80" }, { d: "M20,50 L74,50" }],
  ㅌ: [{ d: "M20,20 L78,20" }, { d: "M20,50 L78,50" }, { d: "M20,20 L20,80 L78,80" }],
  ㅍ: [{ d: "M20,20 L80,20" }, { d: "M32,20 L32,80" }, { d: "M68,20 L68,80" }, { d: "M20,80 L80,80" }],
  ㅎ: [{ d: "M46,10 L54,10" }, { d: "M20,26 L80,26" }, { d: "M50,44 A26,26 0 1 1 49.99,44 Z", transform: MIRROR }],
};

// -- the 10 basic vowels (중성) --
// Stroke order follows the hand, not the shape: a short bar that *reaches*
// a stem is drawn before that stem (ㅓ ㅕ: bar left-to-right, then the
// stem; ㅗ ㅛ: stem(s) down, then the long bar), while a bar the stem hangs
// *from* comes first (ㅜ ㅠ). ㅏ ㅑ: stem, then the bar(s) off it.
const VOWELS: Record<string, HangulStroke[]> = {
  ㅏ: [{ d: "M32,14 L32,86" }, { d: "M32,50 L68,50" }],
  ㅑ: [{ d: "M28,14 L28,86" }, { d: "M28,40 L60,40" }, { d: "M28,60 L60,60" }],
  ㅓ: [{ d: "M32,50 L68,50" }, { d: "M68,14 L68,86" }],
  ㅕ: [{ d: "M40,40 L72,40" }, { d: "M40,60 L72,60" }, { d: "M72,14 L72,86" }],
  ㅗ: [{ d: "M50,20 L50,58" }, { d: "M14,58 L86,58" }],
  ㅛ: [{ d: "M36,24 L36,62" }, { d: "M64,24 L64,62" }, { d: "M14,62 L86,62" }],
  ㅜ: [{ d: "M14,42 L86,42" }, { d: "M50,42 L50,80" }],
  ㅠ: [{ d: "M14,38 L86,38" }, { d: "M36,38 L36,76" }, { d: "M64,38 L64,76" }],
  ㅡ: [{ d: "M16,50 L84,50" }],
  ㅣ: [{ d: "M50,14 L50,86" }],
};

// Compress a jamo's own strokes into one half of a compound letter's box —
// same idea as writing two small letters side by side instead of one big
// one. Fits the glyph's *actual* horizontal footprint (not its full 100-wide
// canvas — e.g. ㅅ only draws between x20 and x80) into the target slot, so
// two narrow glyphs like ㅅ+ㅅ end up close together instead of each
// carrying its own unused margin. Y is left full height.
function footprintX(strokes: HangulStroke[]): [min: number, max: number] {
  const xs = strokes.flatMap((s) => [...s.d.matchAll(/(-?\d+(?:\.\d+)?),-?\d+(?:\.\d+)?/g)].map((m) => Number(m[1])));
  return [Math.min(...xs), Math.max(...xs)];
}
function scaleX(sx: number, tx: number) {
  const round = (n: number) => Math.round(n * 100) / 100;
  return (d: string) => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${round(tx + sx * Number(x))},${y}`);
}
function scaleXParams(strokes: HangulStroke[], targetMin: number, targetMax: number): [sx: number, tx: number] {
  const [min, max] = footprintX(strokes);
  const sx = (targetMax - targetMin) / (max - min);
  return [sx, targetMin - min * sx];
}
// Bakes the scale/translate into the path's own coordinates rather than an
// SVG transform, so an anisotropic x-only squeeze never distorts the
// rendered stroke *width* the way `transform="scale(sx 1)"` would.
function fitInto(strokes: HangulStroke[], targetMin: number, targetMax: number): HangulStroke[] {
  const remap = scaleX(...scaleXParams(strokes, targetMin, targetMax));
  return strokes.map((s) => ({ d: remap(s.d) }));
}
const LEFT_SLOT: [number, number] = [4, 46];
const RIGHT_SLOT: [number, number] = [54, 96];
const fitLeft = (s: HangulStroke[]) => fitInto(s, ...LEFT_SLOT);
const fitRight = (s: HangulStroke[]) => fitInto(s, ...RIGHT_SLOT);

// Double consonants: the base consonant written twice, side by side.
const DOUBLE_CONSONANTS: Record<string, HangulStroke[]> = {
  ㄲ: [...fitLeft(CONSONANTS.ㄱ), ...fitRight(CONSONANTS.ㄱ)],
  ㄸ: [...fitLeft(CONSONANTS.ㄷ), ...fitRight(CONSONANTS.ㄷ)],
  ㅃ: [...fitLeft(CONSONANTS.ㅂ), ...fitRight(CONSONANTS.ㅂ)],
  ㅆ: [...fitLeft(CONSONANTS.ㅅ), ...fitRight(CONSONANTS.ㅅ)],
  ㅉ: [...fitLeft(CONSONANTS.ㅈ), ...fitRight(CONSONANTS.ㅈ)],
};

// Compound vowels. ㅐ ㅒ ㅔ ㅖ are a base vowel with a second stem drawn last,
// set close enough that the bar visibly reaches it (ㅐ ㅒ) or the two stems
// read as a pair (ㅔ ㅖ) — the old 14-unit gap made them look like two
// letters. The w-shaped ones follow the base vowels' stroke order (ㅗ/ㅜ
// first, then ㅏ/ㅓ/ㅐ/ㅔ, then any trailing stem).
const COMPOUND_VOWELS: Record<string, HangulStroke[]> = {
  // stem · bar to the second stem · second stem
  ㅐ: [{ d: "M34,14 L34,86" }, { d: "M34,50 L64,50" }, { d: "M66,14 L66,86" }],
  ㅒ: [{ d: "M30,14 L30,86" }, { d: "M30,40 L60,40" }, { d: "M30,60 L60,60" }, { d: "M62,14 L62,86" }],
  // bar · the stem it reaches · the far stem
  ㅔ: [{ d: "M16,50 L44,50" }, { d: "M44,14 L44,86" }, { d: "M66,14 L66,86" }],
  // both bars, top then bottom · near stem · far stem
  ㅖ: [{ d: "M16,40 L44,40" }, { d: "M16,60 L44,60" }, { d: "M44,14 L44,86" }, { d: "M66,14 L66,86" }],
  // The w-shaped pairs are hand-set rather than two base vowels squeezed
  // together: squeezing kept ㅏ/ㅓ's full-length bar, which read as an H
  // (ㅙ) or just too long (ㅘ ㅝ ㅞ). Here the second vowel's bar is short,
  // and ㅗ/ㅜ sit low, with a short stem, leaving the upper-left free for the
  // consonant that shares the syllable block with them.
  ㅘ: [{ d: "M28,44 L28,70" }, { d: "M8,70 L48,70" }, { d: "M70,14 L70,86" }, { d: "M70,50 L86,50" }],
  ㅙ: [{ d: "M24,44 L24,70" }, { d: "M6,70 L42,70" }, { d: "M60,14 L60,86" }, { d: "M60,50 L74,50" }, { d: "M78,14 L78,86" }],
  ㅚ: [{ d: "M32,46 L32,72" }, { d: "M10,72 L54,72" }, { d: "M74,14 L74,86" }],
  ㅝ: [{ d: "M6,50 L48,50" }, { d: "M27,50 L27,76" }, { d: "M62,62 L80,62" }, { d: "M80,14 L80,86" }],
  ㅞ: [{ d: "M6,50 L46,50" }, { d: "M26,50 L26,76" }, { d: "M52,62 L64,62" }, { d: "M64,14 L64,86" }, { d: "M80,14 L80,86" }],
  ㅟ: [{ d: "M8,56 L56,56" }, { d: "M32,56 L32,82" }, { d: "M74,14 L74,86" }],
  ㅢ: [{ d: "M10,60 L60,60" }, { d: "M74,14 L74,86" }],
};

export const HANGUL_STROKES: Record<string, HangulStroke[]> = {
  ...CONSONANTS,
  ...DOUBLE_CONSONANTS,
  ...VOWELS,
  ...COMPOUND_VOWELS,
};
