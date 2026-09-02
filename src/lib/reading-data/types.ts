import type { CefrLevel } from "@/lib/tree";

export type ReadingQuestion = {
  question_en: string;
  question_es?: string;
  question_ja?: string;
  question_zh?: string;
  options: string[];
  answerIndex: number;
};

// Genre taxonomy scales with level: A1-A2 use diary/notice/dialogue/story;
// B1-B2 use email/explainer/review/story; C1-C2 use editorial/article/essay/story.
// Optional so older un-tagged levels keep compiling while each level is migrated.
export type RawPassage = {
  level: CefrLevel;
  genre?: string;
  title_kr: string;
  title_en: string;
  title_es?: string;
  title_ja?: string;
  title_zh?: string;
  body_kr: string;
  body_en: string;
  body_es?: string;
  body_ja?: string;
  body_zh?: string;
  questions: ReadingQuestion[];
};
