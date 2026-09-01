import type { RawPrompt } from "@/lib/writing-data/types";
import { isTranslated } from "@/lib/i18n-fallback";

// Structural subsets so callers that carry only the English fields (e.g.
// WritingSession) type-check; they simply fall back to English.
type PromptFields = Pick<RawPrompt, "prompt_en"> &
  Partial<Pick<RawPrompt, "prompt_es">>;
type ExampleFields = Pick<RawPrompt, "example_en"> &
  Partial<Pick<RawPrompt, "example_es">>;
type StimulusFields = Pick<RawPrompt, "stimulus_en"> &
  Partial<Pick<RawPrompt, "stimulus_es">>;

export function getLocalizedPrompt(prompt: PromptFields, locale: string): string {
  const prompts: Record<string, string | undefined> = {
    es: prompt.prompt_es,
  };
  const localized = prompts[locale];
  return isTranslated(localized, prompt.prompt_en, locale) ? localized : prompt.prompt_en;
}

export function getLocalizedExample(example: ExampleFields, locale: string): string {
  const examples: Record<string, string | undefined> = {
    es: example.example_es,
  };
  const localized = examples[locale];
  return isTranslated(localized, example.example_en, locale) ? localized : example.example_en;
}

export function getLocalizedStimulus(stimulus: StimulusFields, locale: string): string {
  const stimuli: Record<string, string | undefined> = {
    es: stimulus.stimulus_es,
  };
  const localized = stimuli[locale];
  if (!stimulus.stimulus_en) return "";
  return isTranslated(localized, stimulus.stimulus_en, locale) ? localized : stimulus.stimulus_en;
}
