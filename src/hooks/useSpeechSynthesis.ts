"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useBrowserSupport } from "@/hooks/useBrowserSupport";
import type { DialogueLine } from "@/lib/listening-dialogues";
import { prefetchKorean, speakKorean, stopSpeaking } from "@/lib/tts";

// Speaks dialogue lines in order using the browser's Web Speech API. Distinct
// speakers get a different pitch so two-person dialogues are easier to follow.
export function useSpeechSynthesis(lines: DialogueLine[], rate = 0.9) {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const isSupported = useBrowserSupport(() => "speechSynthesis" in window);
  const [hasFinished, setHasFinished] = useState(false);
  const indexRef = useRef(-1);
  const rateRef = useRef(rate);

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") stopSpeaking();
    };
  }, []);

  // Warm every line's audio (per-speaker voice) so playback has no gaps.
  useEffect(() => {
    const speakers = Array.from(new Set(lines.map((l) => l.speaker)));
    for (const line of lines) {
      prefetchKorean([line.kr], speakers.indexOf(line.speaker) % 2 === 0 ? "f" : "m");
    }
  }, [lines]);

  const speakerPitch = useCallback(
    (speaker: string) => {
      const speakers = Array.from(new Set(lines.map((l) => l.speaker)));
      const i = speakers.indexOf(speaker);
      return i % 2 === 0 ? 1 : 0.75;
    },
    [lines]
  );

  const speakFrom = useCallback(
    (start: number, { trackCompletion = false }: { trackCompletion?: boolean } = {}) => {
      if (!isSupported) return;
      stopSpeaking();

      const speakNext = (i: number) => {
        if (i >= lines.length) {
          indexRef.current = -1;
          setCurrentIndex(-1);
          setIsPlaying(false);
          if (trackCompletion) setHasFinished(true);
          return;
        }
        indexRef.current = i;
        setCurrentIndex(i);

        speakKorean(lines[i].kr, {
          rate: rateRef.current,
          pitch: speakerPitch(lines[i].speaker),
          onend: () => speakNext(i + 1),
        });
      };

      setIsPlaying(true);
      if (trackCompletion) setHasFinished(false);
      speakNext(start);
    },
    [isSupported, lines, speakerPitch]
  );

  // Only a full play-from-the-start run counts toward "finished" — replaying a
  // single line for confirmation shouldn't re-trigger the script reveal.
  const play = useCallback(() => speakFrom(0, { trackCompletion: true }), [speakFrom]);
  const replayLine = useCallback((i: number) => speakFrom(i), [speakFrom]);
  // Resume support: continue from a saved line, still counting completion.
  const playFrom = useCallback((i: number) => speakFrom(i, { trackCompletion: true }), [speakFrom]);

  // Speak exactly one line, without chaining into the rest of the dialogue.
  const speakOne = useCallback(
    (i: number) => {
      if (!isSupported || !lines[i]) return;
      stopSpeaking();
      indexRef.current = i;
      setCurrentIndex(i);
      setIsPlaying(true);
      speakKorean(lines[i].kr, {
        rate: rateRef.current,
        pitch: speakerPitch(lines[i].speaker),
        onend: () => {
          indexRef.current = -1;
          setCurrentIndex(-1);
          setIsPlaying(false);
        },
      });
    },
    [isSupported, lines, speakerPitch]
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    stopSpeaking();
    indexRef.current = -1;
    setCurrentIndex(-1);
    setIsPlaying(false);
  }, [isSupported]);

  return { currentIndex, isPlaying, isSupported, hasFinished, play, playFrom, replayLine, speakOne, stop };
}
