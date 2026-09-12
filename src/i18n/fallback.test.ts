import { describe, expect, it } from "vitest";
import { humanizeMessageKey } from "@/i18n/fallback";

describe("humanizeMessageKey", () => {
  it("turns the last camelCase segment into words", () => {
    expect(humanizeMessageKey("vocabulary.detail.backToUnit")).toBe("Back to unit");
    expect(humanizeMessageKey("nav.speaking")).toBe("Speaking");
    expect(humanizeMessageKey("title")).toBe("Title");
  });
});
