// Tiny synthesized sound effects (Web Audio oscillators — no audio files) for
// feedback moments across the app. Fails silently wherever AudioContext isn't
// available, and stays silent when the learner has turned effects off.
//
// One timbre family on purpose: every sound is a sine/triangle chime built
// from the same pentatonic notes, so the app sounds like one thing rather
// than a pile of stock clips. Loud moments are longer, not louder.

const PREF_KEY = "kroot:sfx";

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

/** Learner preference — on unless they turned it off in settings. */
export function sfxEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(PREF_KEY) !== "off";
  } catch {
    return true;
  }
}

const listeners = new Set<() => void>();

/** Subscribe to preference changes (for useSyncExternalStore). */
export function subscribeSfx(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function setSfxEnabled(on: boolean) {
  try {
    if (on) window.localStorage.removeItem(PREF_KEY);
    else window.localStorage.setItem(PREF_KEY, "off");
  } catch {
    // private mode etc. — the toggle just won't persist
  }
  listeners.forEach((cb) => cb());
}

function tone(freq: number, startOffset: number, duration: number, type: OscillatorType = "sine", peak = 0.15) {
  if (!sfxEnabled()) return;
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

/** A short burst of filtered noise — the "splash" under the water drop. */
function hiss(startOffset: number, duration: number, peak: number, highpassHz: number) {
  if (!sfxEnabled()) return;
  const ac = getCtx();
  if (!ac) return;
  try {
    const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * duration), ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filter = ac.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = highpassHz;
    const gain = ac.createGain();
    const start = ac.currentTime + startOffset;
    gain.gain.setValueAtTime(peak, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    src.connect(filter).connect(gain).connect(ac.destination);
    src.start(start);
  } catch {
    // ignore
  }
}

// C major pentatonic, the whole family lives on these.
const C5 = 523.25, E5 = 659.25, G5 = 783.99, A5 = 880, C6 = 1046.5, E6 = 1318.51, G6 = 1567.98;

/**
 * A tile or chip tapped — a soft wooden "tok", quiet and short so it never
 * competes with speech. Only on tiles/options the learner picks from, never
 * on every button.
 */
export function playTap() {
  if (!sfxEnabled()) return;
  const ac = getCtx();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    const start = ac.currentTime;
    osc.frequency.setValueAtTime(620, start);
    osc.frequency.exponentialRampToValueAtTime(380, start + 0.045);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.07, start + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.06);
    osc.connect(gain).connect(ac.destination);
    osc.start(start);
    osc.stop(start + 0.08);
  } catch {
    // ignore
  }
}

/** A single answer right — Got it, quiz hit, Check passed. */
export function playCorrect() {
  tone(A5, 0, 0.12);
  tone(E6, 0.09, 0.18);
}

/** Missed it — short, low, not harsh. */
export function playWrong() {
  tone(220, 0, 0.2, "sine", 0.12);
  tone(185, 0.11, 0.24, "sine", 0.12);
}

/** Consecutive hits — a rising arpeggio, longer as the streak grows. */
export function playStreak(streak: number) {
  const notes = [C5, E5, G5, C6];
  const n = Math.min(notes.length, 2 + Math.floor(streak / 2));
  for (let i = 0; i < n; i++) tone(notes[i], i * 0.06, 0.14, "sine", 0.13);
}

/** Water on the tree — review done, a word tended. Drop + tiny splash. */
export function playWater() {
  tone(G6, 0, 0.08, "sine", 0.1);
  tone(C6, 0.06, 0.22, "sine", 0.12);
  tone(E6, 0.16, 0.3, "sine", 0.08);
  hiss(0.02, 0.12, 0.03, 5000);
}

/** Coins landing — used once when the result screen's coin count starts. */
export function playCoin() {
  tone(2093, 0, 0.09, "square", 0.05);
  tone(2637, 0.07, 0.22, "square", 0.05);
}

/** A vocabulary Day's ten words all marked. */
export function playDayComplete() {
  [E5, G5, C6].forEach((f, i) => tone(f, i * 0.11, 0.28, "triangle", 0.13));
  tone(E6, 0.36, 0.5, "triangle", 0.1);
}

/** Whole chapter cleared — the rainbow-ring moment. */
export function playChapterClear() {
  [C5, E5, G5, C6, E6].forEach((f, i) => tone(f, i * 0.09, 0.3, "triangle", 0.14));
}

/** The tree grows a level — the longest sound in the app, still soft. */
export function playLevelUp() {
  const notes = [392, C5, E5, G5, C6, E6, G6];
  notes.forEach((f, i) => {
    tone(f, i * 0.1, 0.45, "triangle", 0.12);
    tone(f / 2, i * 0.1, 0.6, "sine", 0.06);
  });
  tone(2093, 0.75, 1.2, "sine", 0.08);
  hiss(0.7, 0.5, 0.02, 6000);
}

/** Bought a costume — coin jingle, then a settled chord. */
export function playBuy() {
  tone(2093, 0, 0.07, "square", 0.05);
  tone(2637, 0.06, 0.07, "square", 0.05);
  tone(3136, 0.12, 0.2, "square", 0.04);
  tone(G5, 0.22, 0.25, "triangle", 0.12);
  tone(C6, 0.3, 0.35, "triangle", 0.12);
}

/** Promotion passed / weekly ranking reward — a small fanfare. */
export function playPromote() {
  [E5, E5, E5, A5].forEach((f, i) => tone(f, i * 0.13, i === 3 ? 0.6 : 0.12, "triangle", 0.13));
  tone(1108.7, 0.55, 0.7, "triangle", 0.1);
  tone(E6, 0.6, 0.9, "sine", 0.06);
}
