// How much of this dialogue's XP has already been paid out as partial
// credit for leaving mid-clip, so finishing it later doesn't double-pay
// the lines already rewarded. (Line-position resume was removed: every
// clip always opens back at line 1 — see the 2026-08-30 listening fix.)
function awardedKey(dialogueId: string) {
  return `kroot-listen-xp-awarded:${dialogueId}`;
}

export function loadAwardedRatio(dialogueId: string): number {
  if (typeof window === "undefined") return 0;
  // The writers below are guarded; this reader wasn't, and it runs inside the
  // clip-completion handler — where a private-window throw would reject the
  // whole save rather than just losing a resume hint.
  try {
    const n = Number(window.localStorage.getItem(awardedKey(dialogueId)) ?? 0);
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
  } catch {
    return 0;
  }
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
