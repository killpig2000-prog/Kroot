"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useBrowserSupport } from "@/hooks/useBrowserSupport";
import type { DialogueLine } from "@/lib/listening-dialogues";
import { prefetchKorean, setPlaybackRate, speakKorean, stopSpeaking } from "@/lib/tts";

// Speaks dialogue lines in order — neural clips via <audio>, Web Speech only
// as the fallback. Distinct speakers get a different voice so two-person
// dialogues are easier to follow.
export function useSpeechSynthesis(lines: DialogueLine[], rate = 0.9) {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  // The primary path is an <audio> element, so a browser without Web Speech
  // can still play every line — gating on speechSynthesis alone disabled the
  // whole player where only the fallback was missing.
  const isSupported = useBrowserSupport(() => typeof Audio !== "undefined" || "speechSynthesis" in window);
  const [hasFinished, setHasFinished] = useState(false);
  const indexRef = useRef(-1);
  const rateRef = useRef(rate);
  // Identifies the running chain so a turn-gap timer from a stopped or
  // replaced chain can't start the next line over newer audio.
  const chainRef = useRef(0);

  // A real conversation has a beat between speakers. Playing the next line
  // the instant the previous one ends reads like a single voice rattling off
  // a script — this pause gives the turn-taking its rhythm.
  const TURN_GAP_MS = 350;

  useEffect(() => {
    rateRef.current = rate;
    setPlaybackRate(rate);
  }, [rate]);

  useEffect(() => {
    return () => {
      // Also retire the chain, or a turn-gap timer that was mid-pause when
      // the player unmounted would start the next line on the next page.
      chainRef.current++;
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
      const chain = ++chainRef.current;

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
          onend: () => {
            if (i + 1 >= lines.length) {
              speakNext(i + 1);
              return;
            }
            window.setTimeout(() => {
              if (chainRef.current === chain) speakNext(i + 1);
            }, TURN_GAP_MS);
          },
          // Something else took the audio floor (a tapped word's speaker
          // button, most often). The chain is over — say so, instead of
          // leaving the pause button and "playing line N" hint running over
          // silence until the learner reloads.
          oncancel: () => {
            indexRef.current = -1;
            setCurrentIndex(-1);
            setIsPlaying(false);
          },
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
      chainRef.current++;
      indexRef.current = i;
      setCurrentIndex(i);
      setIsPlaying(true);
      const clear = () => {
        indexRef.current = -1;
        setCurrentIndex(-1);
        setIsPlaying(false);
      };
      speakKorean(lines[i].kr, {
        rate: rateRef.current,
        pitch: speakerPitch(lines[i].speaker),
        onend: clear,
        oncancel: clear,
      });
    },
    [isSupported, lines, speakerPitch]
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    stopSpeaking();
    chainRef.current++;
    indexRef.current = -1;
    setCurrentIndex(-1);
    setIsPlaying(false);
  }, [isSupported]);

  return { currentIndex, isPlaying, isSupported, hasFinished, play, playFrom, replayLine, speakOne, stop };
}
