"use client";

// Single Korean TTS path for the whole app. Web Speech quality varies wildly
// by voice — the OS default is often a robotic non-native voice, so we rank
// the installed ko-KR voices and always speak with the best one available.

let voice: SpeechSynthesisVoice | null = null;
let voicesReady = false;

function rank(v: SpeechSynthesisVoice): number {
  const n = v.name.toLowerCase();
  if (n.includes("natural") || n.includes("neural") || n.includes("premium")) return 0;
  if (n.includes("google")) return 1;
  // Well-known native system voices (Apple Yuna, MS SunHi/Heami/InJoon).
  if (/yuna|sunhi|heami|injoon|jimin/.test(n)) return 2;
  if (!v.localService) return 3;
  return 4;
}

function refreshVoice() {
  const all = window.speechSynthesis.getVoices();
  const ko = all.filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith("ko"));
  voice = ko.sort((a, b) => rank(a) - rank(b))[0] ?? null;
  voicesReady = ko.length > 0;
}

function ensureVoice() {
  if (voicesReady) return;
  refreshVoice();
  window.speechSynthesis.onvoiceschanged = refreshVoice;
}

// Annotation symbols from lesson text (은/는 slashes stay — they read fine as
// alternatives) and Latin romanization hints, which Korean voices mangle.
export function sanitizeKorean(text: string): string {
  return text
    .replace(/\([A-Za-z .,'-]+\)/g, "")
    .replace(/[=+→←~ㆍ·▸▶️🔊]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Synthesizers can't read a bare jamo (ㅏ, ㄱ…), so single letters are spoken
// as their demonstration syllable: vowels behind a silent ㅇ, consonants + ㅡ.
const JAMO_SOUND: Record<string, string> = {
  "ㅏ": "아", "ㅑ": "야", "ㅓ": "어", "ㅕ": "여", "ㅗ": "오", "ㅛ": "요",
  "ㅜ": "우", "ㅠ": "유", "ㅡ": "으", "ㅣ": "이", "ㅐ": "애", "ㅒ": "얘",
  "ㅔ": "에", "ㅖ": "예", "ㅘ": "와", "ㅙ": "왜", "ㅚ": "외", "ㅝ": "워",
  "ㅞ": "웨", "ㅟ": "위", "ㅢ": "의",
  "ㄱ": "그", "ㄴ": "느", "ㄷ": "드", "ㄹ": "르", "ㅁ": "므", "ㅂ": "브",
  "ㅅ": "스", "ㅇ": "으", "ㅈ": "즈", "ㅊ": "츠", "ㅋ": "크", "ㅌ": "트",
  "ㅍ": "프", "ㅎ": "흐", "ㄲ": "끄", "ㄸ": "뜨", "ㅃ": "쁘", "ㅆ": "쓰",
  "ㅉ": "쯔",
};

export type SpeakOptions = {
  rate?: number;
  pitch?: number;
  onend?: () => void;
  onerror?: () => void;
};

export function speakKorean(text: string, opts: SpeakOptions = {}): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  ensureVoice();
  window.speechSynthesis.cancel();
  const clean = sanitizeKorean(text);
  const u = new SpeechSynthesisUtterance(JAMO_SOUND[clean] ?? clean);
  u.lang = "ko-KR";
  if (voice) u.voice = voice;
  u.rate = opts.rate ?? 0.85;
  u.pitch = opts.pitch ?? 1;
  if (opts.onend) u.onend = opts.onend;
  if (opts.onerror) u.onerror = opts.onerror;
  window.speechSynthesis.speak(u);
  return true;
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
