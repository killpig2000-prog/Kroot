import type { CefrLevel } from "@/lib/tree";

export type WritingGenre = "journal" | "reply" | "description" | "opinion";

export type RawPrompt = {
  level: CefrLevel;
  genre: WritingGenre;
  prompt_kr: string;
  prompt_en: string;
  prompt_es?: string;
  prompt_ja?: string;
  prompt_zh?: string;
  example_kr: string;
  /** English rendering of example_kr — the line the tap-to-assemble board shows. */
  example_en: string;
  example_es?: string;
  example_ja?: string;
  example_zh?: string;
  /** reply only: the incoming message the learner is responding to. */
  stimulus_kr?: string;
  stimulus_en?: string;
  stimulus_es?: string;
  stimulus_ja?: string;
  stimulus_zh?: string;
};
