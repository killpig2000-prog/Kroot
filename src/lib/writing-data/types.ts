import type { CefrLevel } from "@/lib/tree";

export type RawPrompt = {
  level: CefrLevel;
  prompt_kr: string;
  prompt_en: string;
  example_kr: string;
};
