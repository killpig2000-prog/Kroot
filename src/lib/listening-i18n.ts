import type { DialogueLine, LocalizedString } from "@/lib/listening-dialogues";
import { isTranslated } from "@/lib/i18n-fallback";

export function getLocalizedDialogueTitle(title: LocalizedString | string, locale: string): string {
  if (typeof title === "string") return title;

  const titles: Record<string, string | undefined> = {
    ja: title.ja,
    "zh-Hans": title.zh,
    vi: title.vi,
    en: title.en,
  };

  const localized = titles[locale];
  if (locale === "en") return title.en;
  // Most of this data set is the English title with a word swapped; showing
  // the English itself is the honest version of that.
  return isTranslated(localized, title.en, locale) ? localized : title.en;
}

export function getLocalizedDialogueLine(line: DialogueLine, locale: string): string {
  const lines: Record<string, string | undefined> = {
    ja: line.ja,
    "zh-Hans": line.zh,
    vi: line.vi,
    en: line.en,
  };

  const localized = lines[locale];
  if (locale === "en") return line.en;
  return isTranslated(localized, line.en, locale) ? localized : line.en;
}
