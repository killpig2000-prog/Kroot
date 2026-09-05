// Leitner-style spaced repetition. A word sits in box 1-5; each correct
// review moves it up one box (longer interval), a miss drops it back to
// box 1. The word is "due" (thirsty 💧) once next_review_at passes.

export const SRS_INTERVALS_DAYS = [1, 3, 7, 16, 35];
export const MAX_BOX = SRS_INTERVALS_DAYS.length;

export function nextBox(box: number, gotIt: boolean, attempted = true): number {
  const current = Math.min(Math.max(box, 1), MAX_BOX);
  if (!gotIt) return 1;
  // A word answered for the very first time has no box yet — the schema
  // defaults the column to 1, but that's a placeholder, not a 1-day interval
  // the learner has actually served. Promoting it to box 2 on that first
  // "Got it" skipped the 1-day check-in entirely and sent a word seen once,
  // seconds ago, away for three days. It now earns box 1 first: back
  // tomorrow, and only then does a second correct answer start stretching
  // the intervals.
  if (!attempted) return 1;
  return Math.min(current + 1, MAX_BOX);
}

export function nextReviewAt(box: number, from: Date = new Date()): string {
  const days = SRS_INTERVALS_DAYS[Math.min(Math.max(box, 1), MAX_BOX) - 1];
  return new Date(from.getTime() + days * 86_400_000).toISOString();
}

// The review session size, fixed site-wide — no picker, no exceptions.
export const REVIEW_SESSION_SIZE = 10;

// A learner can raise their own daily cap in 10-unit tiers, free — see
// migration 0058 / set_review_capacity(target_bonus). This helper folds
// that choice into the effective cap; every place that enforces the daily
// limit should read through it rather than using REVIEW_SESSION_SIZE
// directly.
export const REVIEW_CAPACITY_STEP = 10;
export const MAX_REVIEW_CAPACITY_BONUS = 30;

export function dailyReviewCap(capacityBonus: number): number {
  return REVIEW_SESSION_SIZE + Math.max(0, Math.min(capacityBonus, MAX_REVIEW_CAPACITY_BONUS));
}

/** Every bonus tier a learner can pick, in 10-unit steps up to the max. */
export function reviewCapacityTiers(): number[] {
  const tiers: number[] = [];
  for (let bonus = REVIEW_CAPACITY_STEP; bonus <= MAX_REVIEW_CAPACITY_BONUS; bonus += REVIEW_CAPACITY_STEP) {
    tiers.push(bonus);
  }
  return tiers;
}
