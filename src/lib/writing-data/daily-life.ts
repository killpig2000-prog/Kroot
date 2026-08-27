import type { RawPrompt } from "./types";
import { WRITING_A1_JOURNAL } from "./a1-journal";
import { WRITING_A1_REPLY } from "./a1-reply";
import { WRITING_A1_DESCRIPTION } from "./a1-description";
import { WRITING_A1_OPINION } from "./a1-opinion";
import { WRITING_A2_JOURNAL } from "./a2-journal";
import { WRITING_A2_REPLY } from "./a2-reply";
import { WRITING_A2_DESCRIPTION } from "./a2-description";
import { WRITING_A2_OPINION } from "./a2-opinion";
import { WRITING_B1_JOURNAL } from "./b1-journal";
import { WRITING_B1_REPLY } from "./b1-reply";
import { WRITING_B1_DESCRIPTION } from "./b1-description";
import { WRITING_B1_OPINION } from "./b1-opinion";
import { WRITING_B2_JOURNAL } from "./b2-journal";
import { WRITING_B2_REPLY } from "./b2-reply";
import { WRITING_B2_DESCRIPTION } from "./b2-description";
import { WRITING_B2_OPINION } from "./b2-opinion";
import { WRITING_C1_JOURNAL } from "./c1-journal";
import { WRITING_C1_REPLY } from "./c1-reply";
import { WRITING_C1_DESCRIPTION } from "./c1-description";
import { WRITING_C1_OPINION } from "./c1-opinion";
import { WRITING_C2_JOURNAL } from "./c2-journal";
import { WRITING_C2_REPLY } from "./c2-reply";
import { WRITING_C2_DESCRIPTION } from "./c2-description";
import { WRITING_C2_OPINION } from "./c2-opinion";

// Each level is 4 genres × 40 pages = 160. Order within a level is the
// learning order: journal → reply → description → opinion.
export const DAILY_LIFE_PROMPTS: RawPrompt[] = [
  ...WRITING_A1_JOURNAL,
  ...WRITING_A1_REPLY,
  ...WRITING_A1_DESCRIPTION,
  ...WRITING_A1_OPINION,
  ...WRITING_A2_JOURNAL,
  ...WRITING_A2_REPLY,
  ...WRITING_A2_DESCRIPTION,
  ...WRITING_A2_OPINION,
  ...WRITING_B1_JOURNAL,
  ...WRITING_B1_REPLY,
  ...WRITING_B1_DESCRIPTION,
  ...WRITING_B1_OPINION,
  ...WRITING_B2_JOURNAL,
  ...WRITING_B2_REPLY,
  ...WRITING_B2_DESCRIPTION,
  ...WRITING_B2_OPINION,
  ...WRITING_C1_JOURNAL,
  ...WRITING_C1_REPLY,
  ...WRITING_C1_DESCRIPTION,
  ...WRITING_C1_OPINION,
  ...WRITING_C2_JOURNAL,
  ...WRITING_C2_REPLY,
  ...WRITING_C2_DESCRIPTION,
  ...WRITING_C2_OPINION,
];
