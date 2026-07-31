import type { RawVocabWord } from "./types";
import { A1_WORDS } from "./daily-life-a1";
import { A2_WORDS } from "./daily-life-a2";
import { B1_WORDS } from "./daily-life-b1";
import { B2_WORDS } from "./daily-life-b2";
import { C1_WORDS } from "./daily-life-c1";
import { C2_WORDS } from "./daily-life-c2";

// Daily-life vocabulary, one file per CEFR level (they got too big for one
// file at production volume). Order matters: chapters are sliced from this
// array in order, so append new words at the END of a level file.
export const DAILY_LIFE_WORDS: RawVocabWord[] = [
  ...A1_WORDS,
  ...A2_WORDS,
  ...B1_WORDS,
  ...B2_WORDS,
  ...C1_WORDS,
  ...C2_WORDS,
];
