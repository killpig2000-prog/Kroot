// Which neural voice (f = SunHi, m = InJoon) reads each speaker of a
// listening dialogue. Shared by the player and scripts/pregen-tts.mts so the
// pre-generated cache and live playback always pick the same clip.

export type ApiVoice = "f" | "m";

// Speakers whose gender the name itself gives away. Everything else (손님,
// 직원, 기자…) is a role that either person could hold.
const FEMALE = new Set([
  "수진", "은영", "소라", "은서", "민지", "민주", "혜린", "혜리", "지영", "은비", "민서", "수현", "지수", "예린", "지우",
  "딸", "어머니", "엄마", "누나", "여동생", "할머니", "아내", "언니",
]);
const MALE = new Set([
  "지훈", "재훈", "재현", "민호", "정우", "현우", "현석", "태윤", "태석", "민준", "도현",
  "아버지", "아빠", "형", "남동생", "오빠", "할아버지", "남편",
]);

export function speakerGender(speaker: string): ApiVoice | null {
  if (FEMALE.has(speaker)) return "f";
  if (MALE.has(speaker)) return "m";
  return null;
}

/**
 * Voice per speaker for one dialogue. A gendered name gets its own voice; a
 * role speaker takes the opposite of a gendered partner so the two still
 * sound distinct, and when nobody's gender is known the voices simply
 * alternate in order of first appearance (first speaker female).
 */
export function dialogueVoices(lines: { speaker: string }[]): Map<string, ApiVoice> {
  const speakers = Array.from(new Set(lines.map((l) => l.speaker)));
  const out = new Map<string, ApiVoice>();
  for (const s of speakers) {
    const g = speakerGender(s);
    if (g) out.set(s, g);
  }
  const anchor = speakers.find((s) => out.has(s));
  speakers.forEach((s, i) => {
    if (out.has(s)) return;
    out.set(s, anchor ? (out.get(anchor) === "f" ? "m" : "f") : i % 2 === 0 ? "f" : "m");
  });
  return out;
}
