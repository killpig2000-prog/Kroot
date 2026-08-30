// Leitner-style spaced repetition. A word sits in box 1-5; each correct
// review moves it up one box (longer interval), a miss drops it back to
// box 1. The word is "due" (thirsty 💧) once next_review_at passes.

export const SRS_INTERVALS_DAYS = [1, 3, 7, 16, 35];
export const MAX_BOX = SRS_INTERVALS_DAYS.length;

export function nextBox(box: number, gotIt: boolean): number {
  const current = Math.min(Math.max(box, 1), MAX_BOX);
  return gotIt ? Math.min(current + 1, MAX_BOX) : 1;
}

export function nextReviewAt(box: number, from: Date = new Date()): string {
  const days = SRS_INTERVALS_DAYS[Math.min(Math.max(box, 1), MAX_BOX) - 1];
  return new Date(from.getTime() + days * 86_400_000).toISOString();
}

// How many due words make a satisfying single review session — past this
// it starts to feel like a slog rather than a quick review.
export const REVIEW_SESSION_SIZE = 10;
