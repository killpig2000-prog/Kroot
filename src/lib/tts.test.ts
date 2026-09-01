import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// tts.ts is a browser module: it reads window, crypto.subtle and <audio>. The
// tests below cover the one piece of logic that is pure policy rather than
// platform — who gets told when an utterance loses the audio floor — because
// getting that wrong strands the listening player in a "playing" state with no
// sound, which is invisible to typecheck and to every other test here.

const audioInstances: FakeAudio[] = [];

class FakeAudio {
  src = "";
  currentTime = 0;
  playbackRate = 1;
  preload = "";
  crossOrigin: string | null = null;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  play = vi.fn(() => Promise.resolve());
  pause = vi.fn();
  constructor() {
    audioInstances.push(this);
  }
  /** Let a test act as the browser finishing playback. */
  finish() {
    this.onended?.();
  }
}

beforeEach(() => {
  audioInstances.length = 0;
  vi.stubGlobal("Audio", FakeAudio);
  vi.stubGlobal("document", { createElement: () => new FakeAudio() });
  vi.stubGlobal("window", {
    setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
    clearTimeout: (id: number) => clearTimeout(id),
  });
  // No speechSynthesis: the browser-voice fallback path is not under test.
  // A HEAD that reports the phrase is already cached keeps fetchAudioUrl on
  // its fast path so no /api/tts call is attempted.
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init?: { method?: string }) =>
      init?.method === "HEAD" ? { ok: true, status: 200 } : { ok: false, status: 500 }
    )
  );
  vi.stubGlobal("crypto", {
    subtle: { digest: async () => new Uint8Array(32).buffer },
  });
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.test";
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

/** Let the queued microtasks inside speakKorean's async IIFE run. */
const flush = () => new Promise((r) => setTimeout(r, 0));

describe("speakKorean cancellation", () => {
  it("tells a superseded utterance it was cancelled, not that it ended", async () => {
    const { speakKorean } = await import("@/lib/tts");
    const first = { onend: vi.fn(), oncancel: vi.fn() };

    speakKorean("안녕하세요", first);
    await flush();

    speakKorean("고맙습니다", {});
    await flush();

    // onend would advance a dialogue chain onto a line that never plays,
    // because the newer utterance already owns the audio element.
    expect(first.onend).not.toHaveBeenCalled();
    expect(first.oncancel).toHaveBeenCalledTimes(1);
  });

  it("cancels the in-flight utterance when playback is stopped", async () => {
    const { speakKorean, stopSpeaking } = await import("@/lib/tts");
    const opts = { onend: vi.fn(), oncancel: vi.fn() };

    speakKorean("안녕하세요", opts);
    await flush();
    stopSpeaking();

    expect(opts.oncancel).toHaveBeenCalledTimes(1);
    expect(opts.onend).not.toHaveBeenCalled();
  });

  it("does not cancel an utterance that already finished", async () => {
    const { speakKorean } = await import("@/lib/tts");
    const first = { onend: vi.fn(), oncancel: vi.fn() };

    speakKorean("안녕하세요", first);
    await flush();
    audioInstances.at(-1)!.finish();
    expect(first.onend).toHaveBeenCalledTimes(1);

    // The chain's next line supersedes nothing: the previous one settled.
    speakKorean("고맙습니다", {});
    await flush();

    expect(first.oncancel).not.toHaveBeenCalled();
    expect(first.onend).toHaveBeenCalledTimes(1);
  });

  it("fires each callback at most once", async () => {
    const { speakKorean, stopSpeaking } = await import("@/lib/tts");
    const opts = { onend: vi.fn(), oncancel: vi.fn() };

    speakKorean("안녕하세요", opts);
    await flush();
    stopSpeaking();
    stopSpeaking();

    expect(opts.oncancel).toHaveBeenCalledTimes(1);
  });
});
