"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useBrowserSupport } from "@/hooks/useBrowserSupport";
import type { DialogueLine } from "@/lib/listening-dialogues";

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
      if (typeof window !== "undefined") window.speechSynthesis.cancel();
    };
  }, []);

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
      window.speechSynthesis.cancel();

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

        const utterance = new SpeechSynthesisUtterance(lines[i].kr);
        utterance.lang = "ko-KR";
        utterance.rate = rateRef.current;
        utterance.pitch = speakerPitch(lines[i].speaker);
        utterance.onend = () => speakNext(i + 1);
        window.speechSynthesis.speak(utterance);
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

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    indexRef.current = -1;
    setCurrentIndex(-1);
    setIsPlaying(false);
  }, [isSupported]);

  return { currentIndex, isPlaying, isSupported, hasFinished, play, replayLine, stop };
}
