// Stroke-order data for basic jamo, drawn in a 100×100 viewBox.
// Paths are listed in writing order; every path is rendered with
// pathLength=100 so a single dash animation works for any stroke shape.

export type GlyphStrokes = {
  char: string;
  /** Romanized sound hint shown under the glyph. */
  sound: string;
  strokes: string[];
};

export const JAMO_STROKES: Record<string, GlyphStrokes> = {
  // ---- basic vowels ----
  "ㅏ": { char: "ㅏ", sound: "a", strokes: ["M42 15 V85", "M42 50 H70"] },
  "ㅓ": { char: "ㅓ", sound: "eo", strokes: ["M30 50 H58", "M58 15 V85"] },
  "ㅗ": { char: "ㅗ", sound: "o", strokes: ["M50 25 V60", "M20 60 H80"] },
  "ㅜ": { char: "ㅜ", sound: "u", strokes: ["M20 40 H80", "M50 40 V80"] },
  "ㅡ": { char: "ㅡ", sound: "eu", strokes: ["M20 50 H80"] },
  "ㅣ": { char: "ㅣ", sound: "i", strokes: ["M50 15 V85"] },
  // ---- y- and compound vowels ----
  "ㅑ": { char: "ㅑ", sound: "ya", strokes: ["M40 15 V85", "M40 38 H68", "M40 62 H68"] },
  "ㅕ": { char: "ㅕ", sound: "yeo", strokes: ["M30 38 H58", "M30 62 H58", "M58 15 V85"] },
  "ㅛ": { char: "ㅛ", sound: "yo", strokes: ["M38 28 V60", "M62 28 V60", "M20 60 H80"] },
  "ㅠ": { char: "ㅠ", sound: "yu", strokes: ["M20 40 H80", "M38 40 V78", "M62 40 V78"] },
  "ㅐ": { char: "ㅐ", sound: "ae", strokes: ["M32 15 V85", "M32 50 H64", "M64 15 V85"] },
  "ㅔ": { char: "ㅔ", sound: "e", strokes: ["M26 50 H50", "M50 15 V85", "M70 15 V85"] },
  // ---- basic consonants ----
  "ㄱ": { char: "ㄱ", sound: "g/k", strokes: ["M30 25 H68 V80"] },
  "ㄴ": { char: "ㄴ", sound: "n", strokes: ["M32 20 V75 H72"] },
  "ㄷ": { char: "ㄷ", sound: "d/t", strokes: ["M32 25 H68", "M32 25 V75 H68"] },
  "ㄹ": { char: "ㄹ", sound: "r/l", strokes: ["M30 22 H70 V48", "M70 48 H30", "M30 48 V76 H70"] },
  "ㅁ": { char: "ㅁ", sound: "m", strokes: ["M30 25 V75", "M30 25 H70 V75", "M30 75 H70"] },
  "ㅂ": { char: "ㅂ", sound: "b/p", strokes: ["M32 20 V78", "M68 20 V78", "M32 48 H68", "M32 78 H68"] },
  "ㅅ": {
    char: "ㅅ",
    sound: "s",
    strokes: ["M50 22 C46 44 38 60 26 76", "M52 36 C58 52 66 65 76 76"],
  },
  "ㅇ": { char: "ㅇ", sound: "silent / ng", strokes: ["M50 24 A26 27 0 1 0 50.01 24"] },
  "ㅈ": {
    char: "ㅈ",
    sound: "j",
    strokes: ["M28 25 H72", "M50 25 C46 46 38 61 26 77", "M53 41 C60 56 68 67 76 77"],
  },
  "ㅎ": {
    char: "ㅎ",
    sound: "h",
    strokes: ["M44 13 H56", "M30 28 H70", "M50 40 A17 19 0 1 0 50.01 40"],
  },
  // ---- aspirated consonants ----
  "ㅋ": { char: "ㅋ", sound: "k", strokes: ["M30 25 H68 V80", "M30 52 H68"] },
  "ㅌ": { char: "ㅌ", sound: "t", strokes: ["M32 22 H68", "M32 48 H68", "M32 22 V76 H68"] },
  "ㅍ": {
    char: "ㅍ",
    sound: "p",
    strokes: ["M25 25 H75", "M40 25 V70", "M60 25 V70", "M25 70 H75"],
  },
  "ㅊ": {
    char: "ㅊ",
    sound: "ch",
    strokes: ["M42 12 H58", "M28 27 H72", "M50 27 C46 47 38 62 26 78", "M53 43 C60 57 68 68 76 78"],
  },
};

export function getGlyphStrokes(char: string): GlyphStrokes | null {
  return JAMO_STROKES[char] ?? null;
}

/** Seconds one stroke takes to draw in the player animation. */
export const STROKE_SECONDS = 0.9;
