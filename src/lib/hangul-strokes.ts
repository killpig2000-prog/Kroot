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
  // strokes, fully connected end to end.
  ㄹ: [
    { d: "M18,12 L70,12 L70,36" },
    { d: "M70,36 L18,36" },
    { d: "M18,36 L18,88 L70,88" },
  ],
  ㅁ: [{ d: "M20,20 L20,80" }, { d: "M20,20 L80,20 L80,80" }, { d: "M20,80 L80,80" }],
  // Two full-height verticals ("11"), then the middle bar, then the bottom
  // bar closing the shape onto both verticals' feet.
  ㅂ: [{ d: "M25,15 L25,82" }, { d: "M75,15 L75,82" }, { d: "M25,48 L75,48" }, { d: "M25,82 L75,82" }],
  ㅅ: [{ d: "M50,18 L20,82" }, { d: "M46,46 L80,82" }],
  ㅇ: [{ d: "M50,18 A32,32 0 1 1 49.99,18 Z", transform: MIRROR }],
  ㅈ: [{ d: "M20,20 L80,20" }, { d: "M55,20 L25,80" }, { d: "M50,45 L80,80" }],
  ㅊ: [{ d: "M42,10 L50,18" }, { d: "M20,26 L80,26" }, { d: "M55,26 L25,84" }, { d: "M50,50 L80,84" }],
  ㅋ: [{ d: "M22,26 L74,26 L74,80" }, { d: "M20,50 L74,50" }],
  ㅌ: [{ d: "M20,20 L78,20" }, { d: "M20,50 L78,50" }, { d: "M20,20 L20,80 L78,80" }],
  ㅍ: [{ d: "M20,20 L80,20" }, { d: "M32,20 L32,80" }, { d: "M68,20 L68,80" }, { d: "M20,80 L80,80" }],
  ㅎ: [{ d: "M46,10 L54,10" }, { d: "M20,26 L80,26" }, { d: "M50,44 A26,26 0 1 1 49.99,44 Z", transform: MIRROR }],
};

// -- the 10 basic vowels (중성) --
const VOWELS: Record<string, HangulStroke[]> = {
  ㅏ: [{ d: "M32,14 L32,86" }, { d: "M32,50 L68,50" }],
  ㅑ: [{ d: "M28,14 L28,86" }, { d: "M28,40 L60,40" }, { d: "M28,60 L60,60" }],
  ㅓ: [{ d: "M68,14 L68,86" }, { d: "M32,50 L68,50" }],
  ㅕ: [{ d: "M72,14 L72,86" }, { d: "M40,40 L72,40" }, { d: "M40,60 L72,60" }],
  ㅗ: [{ d: "M14,58 L86,58" }, { d: "M50,20 L50,58" }],
  ㅛ: [{ d: "M14,62 L86,62" }, { d: "M36,24 L36,62" }, { d: "M64,24 L64,62" }],
  ㅜ: [{ d: "M14,42 L86,42" }, { d: "M50,42 L50,80" }],
  ㅠ: [{ d: "M14,38 L86,38" }, { d: "M36,38 L36,76" }, { d: "M64,38 L64,76" }],
  ㅡ: [{ d: "M16,50 L84,50" }],
  ㅣ: [{ d: "M50,14 L50,86" }],
};

// Compress a jamo's own strokes into one half of a compound letter's box —
// same idea as writing two small letters side by side instead of one big
// one. `tx`/`sx` place & scale on the x axis only; y is left full height.
function fit(strokes: HangulStroke[], sx: number, tx: number): HangulStroke[] {
  return strokes.map((s) => ({ d: s.d, transform: `translate(${tx} 0) scale(${sx} 1)` }));
}
const LEFT = { sx: 0.42, tx: 4 };
const RIGHT = { sx: 0.42, tx: 54 };
const fitLeft = (s: HangulStroke[]) => fit(s, LEFT.sx, LEFT.tx);
const fitRight = (s: HangulStroke[]) => fit(s, RIGHT.sx, RIGHT.tx);

// Double consonants: the base consonant written twice, side by side.
const DOUBLE_CONSONANTS: Record<string, HangulStroke[]> = {
  ㄲ: [...fitLeft(CONSONANTS.ㄱ), ...fitRight(CONSONANTS.ㄱ)],
  ㄸ: [...fitLeft(CONSONANTS.ㄷ), ...fitRight(CONSONANTS.ㄷ)],
  ㅃ: [...fitLeft(CONSONANTS.ㅂ), ...fitRight(CONSONANTS.ㅂ)],
  ㅆ: [...fitLeft(CONSONANTS.ㅅ), ...fitRight(CONSONANTS.ㅅ)],
  ㅉ: [...fitLeft(CONSONANTS.ㅈ), ...fitRight(CONSONANTS.ㅈ)],
};

// Compound vowels: either a vertical bar added next to a base vowel (ㅐㅒㅔㅖ,
// ㅚㅟ), or two base vowels compressed side by side (ㅘㅙㅝㅞ), or ㅡ+ㅣ (ㅢ).
const I_RIGHT: HangulStroke = { d: "M82,14 L82,86" };
const I_LEFT: HangulStroke = { d: "M18,14 L18,86" };

const COMPOUND_VOWELS: Record<string, HangulStroke[]> = {
  ㅐ: [...VOWELS.ㅏ, I_RIGHT],
  ㅒ: [...VOWELS.ㅑ, I_RIGHT],
  ㅔ: [...VOWELS.ㅓ, I_LEFT],
  ㅖ: [...VOWELS.ㅕ, I_LEFT],
  ㅘ: [...fitLeft(VOWELS.ㅗ), ...fitRight(VOWELS.ㅏ)],
  ㅙ: [...fitLeft(VOWELS.ㅗ), ...fitRight(VOWELS.ㅏ), { d: I_RIGHT.d, transform: `translate(${RIGHT.tx} 0) scale(${RIGHT.sx} 1)` }],
  ㅚ: [...fitLeft(VOWELS.ㅗ), { d: "M82,14 L82,86" }],
  ㅝ: [...fitLeft(VOWELS.ㅜ), ...fitRight(VOWELS.ㅓ)],
  ㅞ: [...fitLeft(VOWELS.ㅜ), ...fitRight(VOWELS.ㅓ), { d: "M82,14 L82,86" }],
  ㅟ: [...fitLeft(VOWELS.ㅜ), { d: "M82,14 L82,86" }],
  ㅢ: [{ d: "M10,50 L66,50" }, { d: "M84,14 L84,86" }],
};

export const HANGUL_STROKES: Record<string, HangulStroke[]> = {
  ...CONSONANTS,
  ...DOUBLE_CONSONANTS,
  ...VOWELS,
  ...COMPOUND_VOWELS,
};
