"use client";

// Single Korean TTS path for the whole app. Primary voice is neural audio
// from /api/tts (Gemini, cached in Supabase Storage); any failure — signed
// out, offline, rate-limited — falls back to the browser's Web Speech API.

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

// Bumped on every speak/stop so a slow fetch can't play over newer audio.
let generation = 0;
let currentAudio: HTMLAudioElement | null = null;
const urlCache = new Map<string, string>();
const pending = new Map<string, Promise<string | null>>();

// Must mirror the constants in /api/tts — the client rebuilds the same cache
// filename so already-synthesized phrases play straight from storage without
// a function invocation.
const GEMINI_MODEL = "gemini-3.1-flash-tts-preview";

async function cachedPublicUrl(text: string, apiVoice: "f" | "m"): Promise<string | null> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base || !crypto?.subtle) return null;
  const bytes = new TextEncoder().encode(`${GEMINI_MODEL}|${apiVoice}|${text}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const url = `${base}/storage/v1/object/public/tts/${hash}.wav`;
  const res = await fetch(url, { method: "HEAD" }).catch(() => null);
  return res?.ok ? url : null;
}

async function fetchAudioUrl(text: string, apiVoice: "f" | "m"): Promise<string | null> {
  const key = `${apiVoice}|${text}`;
  const hit = urlCache.get(key);
  if (hit) return hit;
  const inflight = pending.get(key);
  if (inflight) return inflight;

  const p = (async () => {
    try {
      const cached = await cachedPublicUrl(text, apiVoice);
      if (cached) {
        urlCache.set(key, cached);
        return cached;
      }
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: apiVoice }),
        signal: AbortSignal.timeout(12_000),
      });
      if (!res.ok) return null;
      const url = (res.headers.get("content-type") ?? "").includes("json")
        ? ((await res.json()).url as string | undefined)
        : URL.createObjectURL(await res.blob());
      if (!url) return null;
      urlCache.set(key, url);
      return url;
    } catch {
      return null;
    } finally {
      pending.delete(key);
    }
  })();
  pending.set(key, p);
  return p;
}

// Warm the audio cache for phrases the learner is about to hear (a vocab
// deck, a dialogue's lines) so the first tap plays instantly.
export function prefetchKorean(texts: string[], apiVoice: "f" | "m" = "f") {
  if (typeof window === "undefined") return;
  for (const t of texts) {
    const clean = sanitizeKorean(t);
    const spoken = JAMO_SOUND[clean] ?? clean;
    if (/[가-힣]/.test(spoken)) void fetchAudioUrl(spoken, apiVoice);
  }
}

function speakWithBrowser(text: string, opts: SpeakOptions) {
  if (!("speechSynthesis" in window)) {
    opts.onerror?.();
    return;
  }
  ensureVoice();
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ko-KR";
  if (voice) u.voice = voice;
  u.rate = opts.rate ?? 0.85;
  u.pitch = opts.pitch ?? 1;
  if (opts.onend) u.onend = opts.onend;
  if (opts.onerror) u.onerror = opts.onerror;
  window.speechSynthesis.speak(u);
}

export function speakKorean(text: string, opts: SpeakOptions = {}): boolean {
  if (typeof window === "undefined") return false;
  const clean = sanitizeKorean(text);
  const spoken = JAMO_SOUND[clean] ?? clean;

  const gen = ++generation;
  currentAudio?.pause();
  currentAudio = null;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();

  // The pitch knob only ever distinguishes dialogue speakers — map the low
  // one to the male neural voice.
  const apiVoice = (opts.pitch ?? 1) < 0.9 ? "m" : "f";

  void (async () => {
    const url = await fetchAudioUrl(spoken, apiVoice);
    if (gen !== generation) return; // a newer speak/stop superseded this one
    if (!url) {
      speakWithBrowser(spoken, opts);
      return;
    }
    const audio = new Audio(url);
    // Neural audio is already natural-paced; only honor explicit slowdowns.
    audio.playbackRate = opts.rate ?? 1;
    audio.onended = () => opts.onend?.();
    audio.onerror = () => {
      if (gen === generation) speakWithBrowser(spoken, opts);
    };
    currentAudio = audio;
    audio.play().catch(() => {
      if (gen === generation) speakWithBrowser(spoken, opts);
    });
  })();

  return true;
}

export function stopSpeaking() {
  if (typeof window === "undefined") return;
  generation++;
  currentAudio?.pause();
  currentAudio = null;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}
