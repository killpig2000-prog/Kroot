"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useBrowserSupport } from "@/hooks/useBrowserSupport";

// SpeechRecognition isn't in lib.dom, so the bits we use are declared here.
type SpeechRecognitionResultLike = { 0: { transcript: string }; isFinal: boolean };
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: { length: number } & Record<number, SpeechRecognitionResultLike>;
};
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition(lang = "ko-KR") {
  const isSupported = useBrowserSupport(() => getCtor() !== null);
  const [isListening, setIsListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef<((t: string) => void) | null>(null);

  useEffect(() => {
    return () => recRef.current?.abort();
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setIsListening(false);
  }, []);

  const listen = useCallback(
    (onFinal: (transcript: string) => void) => {
      const Ctor = getCtor();
      if (!Ctor) return; // isSupported already reflects this

      recRef.current?.abort();
      onFinalRef.current = onFinal;
      setInterim("");
      setError(null);

      const rec = new Ctor();
      rec.lang = lang;
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      let finalText = "";
      rec.onresult = (e) => {
        let live = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalText += r[0].transcript;
          else live += r[0].transcript;
        }
        setInterim(live || finalText);
      };
      rec.onerror = (e) => {
        setError(
          e.error === "not-allowed"
            ? "Microphone access was blocked — allow it in your browser, or type instead."
            : "Didn't catch that. Try again, or type your answer."
        );
      };
      rec.onend = () => {
        setIsListening(false);
        const heard = finalText.trim();
        if (heard) onFinalRef.current?.(heard);
        else setError((prev) => prev ?? "Nothing heard — try speaking a little louder.");
      };

      recRef.current = rec;
      setIsListening(true);
      try {
        rec.start();
      } catch {
        setIsListening(false);
        setError("Couldn't start the microphone. Try again.");
      }
    },
    [lang]
  );

  return { isSupported, isListening, interim, error, listen, stop, setError };
}

/** Speaks a single Korean string with the Web Speech API. */
export function useKoreanSpeaker() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSupported = useBrowserSupport(() => "speechSynthesis" in window);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback(
    (text: string, rate = 0.9) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ko-KR";
      u.rate = rate;
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(u);
    },
    []
  );

  return { speak, isSpeaking, isSupported };
}
