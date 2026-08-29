import type { DialogueLine, LocalizedString } from "@/lib/listening-dialogues";

export function getLocalizedDialogueTitle(title: LocalizedString | string, locale: string): string {
  if (typeof title === "string") return title;

  const titles: Record<string, string | undefined> = {
    ja: title.ja,
    "zh-Hans": title.zh,
    vi: title.vi,
    en: title.en,
  };

  return titles[locale] || title.en;
}

export function getLocalizedDialogueLine(line: DialogueLine, locale: string): string {
  const lines: Record<string, string | undefined> = {
    ja: line.ja,
    "zh-Hans": line.zh,
    vi: line.vi,
    en: line.en,
  };

  return lines[locale] || line.en;
}
