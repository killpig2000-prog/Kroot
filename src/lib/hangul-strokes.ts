// Hand-authored stroke-order paths for the 14 basic consonants and 10 basic
// vowels, on a 100x100 grid — Hangul strokes are straight lines plus one
// circle, so these are drawn directly rather than extracted from a font
// (glyph outlines don't carry pen-stroke sequence data).
//
// Double consonants, compound vowels, and anything else not listed here
// fall back to a plain static glyph — see StrokeOrderGlyph.
export type HangulStroke = {
  d: string;
  /** Circle strokes are drawn clockwise (reliable across browsers) then
   *  mirrored horizontally so they read as the correct left-first direction
   *  — a circle is symmetric, so mirroring never changes its shape. */
  mirror?: boolean;
};

export const HANGUL_STROKES: Record<string, HangulStroke[]> = {
  // -- consonants (초성) --
  ㄱ: [{ d: "M22,26 L74,26 L74,80" }],
  ㄴ: [{ d: "M26,20 L26,76 L80,76" }],
  ㄷ: [{ d: "M20,22 L78,22" }, { d: "M20,22 L20,78 L78,78" }],
  ㄹ: [
    { d: "M20,15 L68,15 L68,40 L20,40" },
    { d: "M20,40 L20,60 L68,60 L68,85 L20,85" },
  ],
  ㅁ: [{ d: "M20,20 L20,80" }, { d: "M20,20 L80,20 L80,80" }, { d: "M20,80 L80,80" }],
  ㅂ: [{ d: "M25,15 L25,55" }, { d: "M75,15 L75,55" }, { d: "M25,55 L75,55" }, { d: "M20,85 L80,85" }],
  ㅅ: [{ d: "M50,18 L20,82" }, { d: "M46,46 L80,82" }],
  ㅇ: [{ d: "M50,18 A32,32 0 1 1 49.99,18 Z", mirror: true }],
  ㅈ: [{ d: "M20,20 L80,20" }, { d: "M55,20 L25,80" }, { d: "M50,45 L80,80" }],
  ㅊ: [{ d: "M42,10 L50,18" }, { d: "M20,26 L80,26" }, { d: "M55,26 L25,84" }, { d: "M50,50 L80,84" }],
  ㅋ: [{ d: "M22,26 L74,26 L74,80" }, { d: "M50,50 L74,50" }],
  ㅌ: [{ d: "M20,20 L78,20" }, { d: "M20,50 L78,50" }, { d: "M20,20 L20,80 L78,80" }],
  ㅍ: [{ d: "M20,20 L80,20" }, { d: "M32,20 L32,80" }, { d: "M68,20 L68,80" }, { d: "M20,80 L80,80" }],
  ㅎ: [{ d: "M46,10 L54,10" }, { d: "M20,26 L80,26" }, { d: "M50,44 A26,26 0 1 1 49.99,44 Z", mirror: true }],

  // -- vowels (중성) --
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
