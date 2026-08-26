// Tiny synthesized sound effects (Web Audio oscillators — no audio files) for
// pronunciation-challenge feedback moments. Fails silently wherever
// AudioContext isn't available.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) ctx = new Ctor();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, startOffset: number, duration: number, type: OscillatorType = "sine", peak = 0.15) {
  const ac = getCtx();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const start = ac.currentTime + startOffset;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(ac.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  } catch {
    // ignore — sound is a nice-to-have, never worth breaking the game over
  }
}

/** A single word answered correctly. */
export function playCorrect() {
  tone(880, 0, 0.12);
  tone(1318.51, 0.09, 0.18);
}

/** Missed the target — short, low, not harsh. */
export function playWrong() {
  tone(220, 0, 0.2, "sine", 0.12);
  tone(185, 0.11, 0.24, "sine", 0.12);
}

/** Consecutive nails — a short rising arpeggio, longer as the streak grows. */
export function playStreak(streak: number) {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  const n = Math.min(notes.length, 2 + Math.floor(streak / 2));
  for (let i = 0; i < n; i++) tone(notes[i], i * 0.06, 0.14, "sine", 0.13);
}

/** Whole chapter cleared — the rainbow-ring moment. */
export function playChapterClear() {
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
  notes.forEach((f, i) => tone(f, i * 0.09, 0.3, "triangle", 0.14));
}
