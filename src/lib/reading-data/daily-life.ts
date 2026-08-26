import type { RawPassage } from "./types";
import { READING_A1_DIARY } from "./a1-diary";
import { READING_A1_STORY } from "./a1-story";
import { READING_A1_NOTICE } from "./a1-notice";
import { READING_A1_DIALOGUE } from "./a1-dialogue";
import { READING_A2_DIARY } from "./a2-diary";
import { READING_A2_STORY } from "./a2-story";
import { READING_A2_MESSAGE } from "./a2-message";
import { READING_A2_INSTRUCTION } from "./a2-instruction";
import { READING_B1_STORY } from "./b1-story";
import { READING_B1_EMAIL } from "./b1-email";
import { READING_B1_EXPLAINER } from "./b1-explainer";
import { READING_B1_REVIEW } from "./b1-review";
import { READING_B2_ARTICLE } from "./b2-article";
import { READING_B2_EXPLAINER } from "./b2-explainer";
import { READING_B2_OPINION } from "./b2-opinion";
import { READING_B2_STORY } from "./b2-story";
import { READING_C1_EDITORIAL } from "./c1-editorial";
import { READING_C1_ARTICLE } from "./c1-article";
import { READING_C1_ESSAY } from "./c1-essay";
import { READING_C1_STORY } from "./c1-story";
import { READING_C2_EDITORIAL } from "./c2-editorial";
import { READING_C2_ACADEMIC } from "./c2-academic";
import { READING_C2_INTERVIEW } from "./c2-interview";
import { READING_C2_ESSAY } from "./c2-essay";

// 2026-08: all 6 CEFR levels are split into a genre taxonomy (160 passages
// each, 40 per genre) — see [[chapter-list-garden-path]] memory. Each
// level's 4 genre files replace what used to be a flat per-level pool.
export const DAILY_LIFE_PASSAGES: RawPassage[] = [
  ...READING_A1_DIARY,
  ...READING_A1_STORY,
  ...READING_A1_NOTICE,
  ...READING_A1_DIALOGUE,
  ...READING_A2_DIARY,
  ...READING_A2_STORY,
  ...READING_A2_MESSAGE,
  ...READING_A2_INSTRUCTION,
  ...READING_B1_EMAIL,
  ...READING_B1_EXPLAINER,
  ...READING_B1_REVIEW,
  ...READING_B1_STORY,
  ...READING_B2_ARTICLE,
  ...READING_B2_EXPLAINER,
  ...READING_B2_OPINION,
  ...READING_B2_STORY,
  ...READING_C1_EDITORIAL,
  ...READING_C1_ARTICLE,
  ...READING_C1_ESSAY,
  ...READING_C1_STORY,
  ...READING_C2_EDITORIAL,
  ...READING_C2_ACADEMIC,
  ...READING_C2_INTERVIEW,
  ...READING_C2_ESSAY,
];
