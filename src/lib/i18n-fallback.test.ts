import { describe, expect, it } from "vitest";
import { isTranslated } from "@/lib/i18n-fallback";
import { getLocalizedMeaning } from "@/lib/vocabulary-i18n";
import { getLocalizedDialogueLine } from "@/lib/listening-i18n";

describe("isTranslated — real translations survive", () => {
  it("keeps Japanese", () => {
    expect(isTranslated("水", "water", "ja")).toBe(true);
    expect(isTranslated("水を飲みます。", "I drink water.", "ja")).toBe(true);
  });

  it("keeps Chinese", () => {
    expect(isTranslated("我喝水。", "I drink water.", "zh-Hans")).toBe(true);
  });

  it("keeps Vietnamese, which is Latin script like its English source", () => {
    expect(isTranslated("nước", "water", "vi")).toBe(true);
    expect(isTranslated("Tôi uống nước.", "I drink water.", "vi")).toBe(true);
    // A proper noun shared with the English must not condemn the sentence.
    expect(isTranslated("Tên tôi là Maria.", "My name is Maria.", "vi")).toBe(true);
  });
});

describe("isTranslated — placeholders are rejected", () => {
  it("rejects the bracketed English left by the vocabulary import", () => {
    expect(isTranslated("【weather】", "weather", "ja")).toBe(false);
    expect(isTranslated("[weather]", "weather", "zh-Hans")).toBe(false);
    expect(isTranslated("[The weather is nice today.]", "The weather is nice today.", "vi")).toBe(
      false
    );
  });

  it("rejects the English sentence with one word swapped, as in the listening data", () => {
    expect(
      isTranslated(
        "this maze-like alley itself するべき である seen as a living map bearing witness to modern commercial 歴史",
        "This maze-like alley itself should be seen as a living map bearing witness to modern commercial history.",
        "ja"
      )
    ).toBe(false);
    expect(
      isTranslated(
        "this maze-like alley itself nên là seen as a living map bearing witness to modern commercial lịch sử",
        "This maze-like alley itself should be seen as a living map bearing witness to modern commercial history.",
        "vi"
      )
    ).toBe(false);
  });

  it("rejects untouched English and empty values", () => {
    expect(isTranslated("water", "water", "ja")).toBe(false);
    expect(isTranslated("", "water", "ja")).toBe(false);
    expect(isTranslated(undefined, "water", "ja")).toBe(false);
    // Japanese with no CJK at all never got translated.
    expect(isTranslated("mizu", "water", "ja")).toBe(false);
  });
});

describe("callers fall back to English rather than showing a placeholder", () => {
  it("vocabulary meaning", () => {
    const word = { meaning_en: "weather", meaning_ja: "【weather】", meaning_vi: "thời tiết" };
    expect(getLocalizedMeaning(word, "ja")).toBe("weather");
    expect(getLocalizedMeaning(word, "vi")).toBe("thời tiết");
    expect(getLocalizedMeaning(word, "en")).toBe("weather");
  });

  it("listening line", () => {
    const line = {
      speaker: "손님",
      kr: "빨대 있어요?",
      en: "Do you have a straw?",
      ja: "Do you have a straw?",
      zh: "你有吸管吗？",
    };
    expect(getLocalizedDialogueLine(line, "ja")).toBe("Do you have a straw?");
    expect(getLocalizedDialogueLine(line, "zh-Hans")).toBe("你有吸管吗？");
  });
});
