// What the tree says, and the time-of-day greeting it opens with. Lived
// inside TreeCard until the Garden card (option 2a, 2026-09-09) needed the
// same four lines on the phone: importing them from TreeCard would have
// dragged the whole desktop hero — VeteranTree, costumes, the growth
// popup, the avatar uploader — into the phone bundle for four strings.
//
// Korean stays as-is in every UI language; the gloss comes from
// dashboard.tree.phrases.* (and ui.* for the greeting).

export const TREE_PHRASES = [
  { kr: "화이팅!", key: "fighting" },
  { kr: "오늘도 좋아요!", key: "goodToday" },
  { kr: "물 줘서 고마워요", key: "thanksWater" },
  { kr: "같이 자라요", key: "growTogether" },
];

export type GreetingKey = "upLate" | "goodMorning" | "goodAfternoon" | "goodEvening" | "welcome";

export const GREETING_KR: Record<GreetingKey, string> = {
  upLate: "아직 안 자요?",
  goodMorning: "좋은 아침이에요",
  goodAfternoon: "좋은 오후예요",
  goodEvening: "좋은 저녁이에요",
  welcome: "어서 오세요",
};

/** `hour < 0` means "the server doesn't know the visitor's clock yet". */
export function greetingKey(hour: number): GreetingKey {
  if (hour < 0) return "welcome";
  if (hour < 5) return "upLate";
  if (hour < 12) return "goodMorning";
  if (hour < 18) return "goodAfternoon";
  return "goodEvening";
}

/** The tree's glosses are lower-case asides ("looking good today!"). */
export function lowerGloss(gloss: string): string {
  return /^[A-Z]/.test(gloss) ? gloss.charAt(0).toLowerCase() + gloss.slice(1) : gloss;
}
