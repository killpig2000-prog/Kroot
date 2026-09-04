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
  /**
   * This utterance was superseded by a newer speak/stop before it finished.
   * Distinct from onend on purpose: a caller chaining lines must NOT advance
   * on a cancel (newer audio is already playing), but it does have to drop
   * its own "still playing" state, or the UI narrates a dialogue that died.
   */
  oncancel?: () => void;
};

// Bumped on every speak/stop so a slow fetch can't play over newer audio.
let generation = 0;
// The in-flight utterance's cancel handler, so the next speak/stop can tell
// it that it lost the floor. Cleared as soon as an utterance settles.
let cancelCurrent: (() => void) | null = null;

/** Retire the in-flight utterance, notifying whoever was waiting on it. */
function supersede() {
  const prev = cancelCurrent;
  cancelCurrent = null;
  prev?.();
}
// One reused <audio> element for the whole app, instead of a fresh `new
// Audio()` per line. Safari (notably iOS) only treats an element as
// "unlocked" for autoplay once it has played inside a user gesture; a new
// element created from an async onended callback loses that permission and
// silently fails to play, which is what stalled a dialogue after its first
// line. Reusing the same element keeps it unlocked for the rest of the chain.
let audioEl: HTMLAudioElement | null = null;
function getAudioEl(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.preload = "auto";
  }
  return audioEl;
}
const urlCache = new Map<string, string>();
const pending = new Map<string, Promise<string | null>>();

// Must mirror the constants in /api/tts — the client rebuilds the same cache
// filename so already-synthesized phrases play straight from storage without
// a function invocation.
const ENGINE = "edge-tts";

/**
 * A url means the phrase is already synthesized. `null` means storage
 * answered that it genuinely isn't there, so synthesizing is the right next
 * step. `undefined` means we couldn't tell — a 429 or a server error — and
 * treating that as "absent" is how a burst of warm-ups turns into a burst of
 * re-synthesis for audio that already exists.
 */
async function cachedPublicUrl(text: string, apiVoice: "f" | "m"): Promise<string | null | undefined> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base || !crypto?.subtle) return null;
  const bytes = new TextEncoder().encode(`${ENGINE}|${apiVoice}|${text}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const url = `${base}/storage/v1/object/public/tts/${hash}.mp3`;
  const res = await fetch(url, { method: "HEAD" }).catch(() => null);
  if (!res) return undefined; // network failure — unknown, not absent
  if (res.ok) return url;
  return res.status === 404 ? null : undefined;
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
      // Storage couldn't answer. Fall back to the browser voice for this tap
      // rather than paying to re-synthesize a phrase that is probably already
      // in the bucket; the next attempt re-checks.
      if (cached === undefined) return null;
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
// How many warm-ups may be in flight at once. Firing the whole list in
// parallel is what /hangul used to do with its 87 phrases, and Supabase
// storage answered a chunk of them with 429 — which fetchAudioUrl reads as
// "not cached yet" and answers by re-synthesizing audio that already exists.
// A queue keeps the warm-up a warm-up.
const PREFETCH_CONCURRENCY = 4;
const prefetchQueue: (() => Promise<unknown>)[] = [];
let prefetchActive = 0;

function drainPrefetchQueue() {
  while (prefetchActive < PREFETCH_CONCURRENCY && prefetchQueue.length) {
    const job = prefetchQueue.shift()!;
    prefetchActive++;
    void job().finally(() => {
      prefetchActive--;
      drainPrefetchQueue();
    });
  }
}

export function prefetchKorean(texts: string[], apiVoice: "f" | "m" = "f") {
  if (typeof window === "undefined") return;
  for (const t of texts) {
    const clean = sanitizeKorean(t);
    const spoken = JAMO_SOUND[clean] ?? clean;
    if (!/[가-힣]/.test(spoken)) continue;
    // Already cached or already being fetched — no need to queue it at all.
    if (urlCache.has(`${apiVoice}|${spoken}`) || pending.has(`${apiVoice}|${spoken}`)) continue;
    prefetchQueue.push(() => fetchAudioUrl(spoken, apiVoice));
  }
  drainPrefetchQueue();
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
  audioEl?.pause();
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  // After the generation moved, so the retired caller can't resurrect itself.
  supersede();

  // The pitch knob only ever distinguishes dialogue speakers — map the low
  // one to the male neural voice.
  const apiVoice = (opts.pitch ?? 1) < 0.9 ? "m" : "f";

  // A dialogue is a chain of lines, each waiting on the previous one's
  // onend — so a single line that never signals completion (a dropped
  // "ended" event, a stuck decode, speechSynthesis silently failing on some
  // mobile browsers) used to stall the whole conversation after one
  // sentence. This watchdog guarantees the chain always moves on.
  //
  // It runs in two phases so it can't misread "still fetching" as "done
  // playing": a generous fetch-phase timeout covers fetchAudioUrl (cold
  // /api/tts synthesis + a Supabase auth round trip can genuinely take a
  // few seconds, especially the first line or two of a chain, before the
  // prefetch queue has warmed anything up) without moving the dialogue on
  // mid-fetch; once playback actually starts, it's replaced with the
  // playback-duration watchdog that was here before.
  let settled = false;
  let watchdog: number;
  const finish = () => {
    if (settled || gen !== generation) return;
    settled = true;
    clearTimeout(watchdog);
    // Clear before onend: a chaining caller starts the next line synchronously
    // from inside it, and that speak must not read this one as still in flight.
    if (cancelCurrent === cancel) cancelCurrent = null;
    opts.onend?.();
  };
  const cancel = () => {
    if (settled) return;
    settled = true;
    clearTimeout(watchdog);
    opts.oncancel?.();
  };
  // Armed once audio is actually rolling. It's a safety net for a dropped
  // "ended" event, not a pacing device, so it has to be strictly longer than
  // the real clip: use the decoded duration when the element knows it,
  // scaled by the playback rate, plus slack. The old "chars × 180ms" guess
  // undershot natural Korean speech (and ignored the 0.7× slow mode), so it
  // fired mid-sentence and the next speaker cut the current one off.
  const rate = opts.rate ?? 1;
  const armPlaybackWatchdog = () => {
    if (settled) return;
    clearTimeout(watchdog);
    const known = audioEl && Number.isFinite(audioEl.duration) ? audioEl.duration / rate : null;
    const ms = known ? known * 1000 + 2500 : Math.max(6000, (spoken.length * 400) / rate);
    watchdog = window.setTimeout(finish, ms);
  };
  // The <audio> element's duration belongs to whatever it last loaded, so the
  // Web Speech fallback only gets the length-based estimate.
  const armBrowserWatchdog = () => {
    if (settled) return;
    clearTimeout(watchdog);
    watchdog = window.setTimeout(finish, Math.max(6000, (spoken.length * 400) / rate));
  };
  watchdog = window.setTimeout(finish, 8000);
  cancelCurrent = cancel;

  void (async () => {
    const url = await fetchAudioUrl(spoken, apiVoice);
    if (gen !== generation) return; // a newer speak/stop superseded this one
    if (!url) {
      armBrowserWatchdog();
      speakWithBrowser(spoken, { ...opts, onend: finish });
      return;
    }
    const audio = getAudioEl();
    audio.pause();
    audio.currentTime = 0;
    audio.src = url;
    // Neural audio is already natural-paced; only honor explicit slowdowns.
    audio.playbackRate = opts.rate ?? 1;
    audio.onended = finish;
    audio.onerror = () => {
      if (gen === generation) {
        armBrowserWatchdog();
        speakWithBrowser(spoken, { ...opts, onend: finish });
      }
    };
    audio
      .play()
      .then(() => armPlaybackWatchdog())
      .catch(() => {
        if (gen === generation) {
          armBrowserWatchdog();
          speakWithBrowser(spoken, { ...opts, onend: finish });
        }
      });
  })();

  return true;
}

export function stopSpeaking() {
  if (typeof window === "undefined") return;
  generation++;
  audioEl?.pause();
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  supersede();
}
