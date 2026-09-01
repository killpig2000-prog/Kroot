import type { RawPassage, ReadingQuestion } from "@/lib/reading-data/types";
import { isTranslated } from "@/lib/i18n-fallback";

// Structural subsets so callers that carry only the English fields type-check.
type TitleFields = Pick<RawPassage, "title_en"> &
  Partial<Pick<RawPassage, "title_es">>;
type BodyFields = Pick<RawPassage, "body_en"> &
  Partial<Pick<RawPassage, "body_es">>;
type QuestionFields = Pick<ReadingQuestion, "question_en"> &
  Partial<Pick<ReadingQuestion, "question_es">>;

export function getLocalizedTitle(passage: TitleFields, locale: string): string {
  const titles: Record<string, string | undefined> = {
    es: passage.title_es,
  };
  const localized = titles[locale];
  return isTranslated(localized, passage.title_en, locale) ? localized : passage.title_en;
}

export function getLocalizedBody(passage: BodyFields, locale: string): string {
  const bodies: Record<string, string | undefined> = {
    es: passage.body_es,
  };
  const localized = bodies[locale];
  return isTranslated(localized, passage.body_en, locale) ? localized : passage.body_en;
}

export function getLocalizedQuestion(question: QuestionFields, locale: string): string {
  const questions: Record<string, string | undefined> = {
    es: question.question_es,
  };
  const localized = questions[locale];
  return isTranslated(localized, question.question_en, locale) ? localized : question.question_en;
}
