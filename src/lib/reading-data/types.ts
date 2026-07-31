import type { CefrLevel } from "@/lib/tree";

export type ReadingQuestion = {
  question_en: string;
  options: string[];
  answerIndex: number;
};

export type RawPassage = {
  level: CefrLevel;
  title_kr: string;
  title_en: string;
  body_kr: string;
  body_en: string;
  questions: ReadingQuestion[];
};
