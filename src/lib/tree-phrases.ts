// What the tree says, and the time-of-day greeting it opens with. Lived
// inside TreeCard until the Garden card (option 2a, 2026-09-09) needed the
// same four lines on the phone: importing them from TreeCard would have
// dragged the whole desktop hero — VeteranTree, costumes, the growth
// popup, the avatar uploader — into the phone bundle for four strings.
//
// English only (2026-09-13, user call: Korean appears only where it is
// being taught). The lines come from dashboard.tree.phrases.* and the
// greeting from ui.*, in the learner's UI language.

export const TREE_PHRASES = ["fighting", "goodToday", "thanksWater", "growTogether"] as const;

export type GreetingKey = "upLate" | "goodMorning" | "goodAfternoon" | "goodEvening" | "welcome";

/** `hour < 0` means "the server doesn't know the visitor's clock yet". */
export function greetingKey(hour: number): GreetingKey {
  if (hour < 0) return "welcome";
  if (hour < 5) return "upLate";
  if (hour < 12) return "goodMorning";
  if (hour < 18) return "goodAfternoon";
  return "goodEvening";
}
