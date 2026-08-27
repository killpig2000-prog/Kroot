// Mid-clip resume: how many lines of a dialogue have been heard, kept in
// localStorage so a refresh or detour resumes at the same line. Clip-level
// completion stays in the DB (listening_progress) separately.
function heardKey(dialogueId: string) {
  return `kroot-listen-heard:${dialogueId}`;
}

export function loadHeard(dialogueId: string, lineCount: number): number {
  if (typeof window === "undefined") return 0;
  const n = Number(window.localStorage.getItem(heardKey(dialogueId)) ?? 0);
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), lineCount) : 0;
}

export function saveHeard(dialogueId: string, heard: number) {
  try {
    window.localStorage.setItem(heardKey(dialogueId), String(heard));
  } catch {
    // storage full/blocked — resume just won't survive a reload
  }
}

export function clearHeard(dialogueId: string) {
  try {
    window.localStorage.removeItem(heardKey(dialogueId));
  } catch {
    // ignore
  }
}

// How much of this dialogue's XP has already been paid out as partial
// credit for leaving mid-clip, so resuming (or finishing later) doesn't
// double-pay the same progress.
function awardedKey(dialogueId: string) {
  return `kroot-listen-xp-awarded:${dialogueId}`;
}

export function loadAwardedRatio(dialogueId: string): number {
  if (typeof window === "undefined") return 0;
  const n = Number(window.localStorage.getItem(awardedKey(dialogueId)) ?? 0);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
}

export function saveAwardedRatio(dialogueId: string, ratio: number) {
  try {
    window.localStorage.setItem(awardedKey(dialogueId), String(ratio));
  } catch {
    // ignore
  }
}

export function clearAwardedRatio(dialogueId: string) {
  try {
    window.localStorage.removeItem(awardedKey(dialogueId));
  } catch {
    // ignore
  }
}

export function estMinutes(lineCount: number) {
  return Math.max(1, Math.round(lineCount / 4));
}
