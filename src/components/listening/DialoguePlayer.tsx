"use client";

import { useMemo, useState } from "react";
import { buttonClassName } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { recordCompletion } from "@/lib/activity";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import Character, { characterColor, characterVariant } from "@/components/listening/Character";
import type { DialogueLine } from "@/lib/listening-dialogues";

const BTN_TEAL = buttonClassName("teal");
const BTN_INK = buttonClassName("ink");
const BTN_LINE =
  "rounded-[9px] px-4 py-2 text-[13px] font-semibold text-muted bg-white border border-line hover:border-faint transition-colors";

export default function DialoguePlayer({
  dialogueId,
  lines,
  completed,
  showTranslation,
  photoUrl,
}: {
  dialogueId: string;
  lines: DialogueLine[];
  completed: boolean;
  showTranslation: boolean;
  photoUrl: string | null;
}) {
  const supabase = useMemo(() => createClient(), []);
  const { currentIndex, isPlaying, isSupported, hasFinished, play, replayLine, stop } = useSpeechSynthesis(lines);
  const [showEn, setShowEn] = useState(showTranslation);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(completed);
  // Returning users who already heard this once skip straight to the script.
  const [revealed, setRevealed] = useState(completed);
  const [showCaption, setShowCaption] = useState(false);
  const speakers = useMemo(() => Array.from(new Set(lines.map((l) => l.speaker))), [lines]);
  const currentLine = currentIndex >= 0 ? lines[currentIndex] : null;

  // A completed first listen-through reveals the script, no effect needed.
  const scriptRevealed = revealed || hasFinished;

  async function markHeard() {
    if (done || saving) return;
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    await supabase.from("listening_progress").upsert(
      { user_id: user.id, dialogue_id: dialogueId, completed_at: new Date().toISOString() },
      { onConflict: "user_id,dialogue_id" }
    );

    await recordCompletion(supabase, "listening", 3);

    setDone(true);
    setSaving(false);
  }

  return (
    <div className="max-w-[680px]">
      {!isSupported && (
        <p className="border border-line bg-warm rounded-[10px] px-4 py-3 text-[13px] text-muted mb-3.5">
          Your browser doesn&apos;t support text-to-speech playback — you can still read the script below.
        </p>
      )}

      {!scriptRevealed ? (
        <div className="border border-line rounded-[14px] overflow-hidden text-center mb-3.5">
          {/* stage: situation photo backdrop with the two characters in front */}
          <div
            className="relative px-6 pt-24 pb-3 bg-warm"
            style={
              photoUrl
                ? {
                    background: `linear-gradient(180deg, rgba(255,255,255,.25) 0%, rgba(255,255,255,.7) 100%), url(${photoUrl}) center/cover`,
                  }
                : undefined
            }
          >
            <div className="flex items-end justify-center gap-[clamp(64px,18vw,140px)] min-h-[210px]">
              {speakers.map((sp, i) => {
                const active = isPlaying && currentLine?.speaker === sp;
                const bubbleOn = showCaption && active && currentLine;
                return (
                  <div key={sp} className="relative flex flex-col items-center">
                    {bubbleOn && (
                      <div className="absolute bottom-[calc(100%+2px)] left-1/2 -translate-x-1/2 z-10 w-max max-w-[280px]">
                        <div
                          className="bg-white border border-line rounded-[10px] px-4 py-2.5 text-left shadow-sm"
                          style={{ animation: "fadeUp .25s ease" }}
                        >
                          <p className="kr text-[17px] font-medium leading-snug">{currentLine.kr}</p>
                        </div>
                        <div className="mx-auto w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-white" />
                      </div>
                    )}
                    <Character color={characterColor(i)} variant={characterVariant(i)} talking={active} size={110} />
                    <span
                      className={`text-[11.5px] font-semibold mt-1.5 rounded-md px-2 py-0.5 border transition-colors ${
                        active
                          ? "bg-[#F0FDFA] text-teal border-[#99F6E4]"
                          : "bg-white/90 text-muted border-line"
                      }`}
                    >
                      {sp}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-6 pb-6 pt-4 border-t border-line">
            <p className="text-[13px] text-muted mb-3.5">
              Listen first — the script unlocks once you&apos;ve heard the whole thing.
            </p>

            <div className="flex justify-center gap-[7px] mb-5">
              {lines.map((_, i) => (
                <span
                  key={i}
                  className={`w-[26px] h-1.5 rounded-full transition-colors ${
                    i <= currentIndex ? "bg-teal" : "bg-line"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-center gap-2.5 flex-wrap">
              <button className={BTN_TEAL} onClick={isPlaying ? stop : play} disabled={!isSupported}>
                {isPlaying ? "⏸ Stop" : "▶ Play dialogue"}
              </button>
              <button
                className={`rounded-[9px] px-4 py-2 text-[13px] font-semibold border transition-colors ${
                  showCaption
                    ? "bg-[#F0FDFA] text-teal border-[#99F6E4]"
                    : "bg-white text-muted border-line hover:border-faint"
                }`}
                onClick={() => setShowCaption((v) => !v)}
              >
                {showCaption ? "Captions on" : "Captions off"}
              </button>
              <button className={BTN_LINE} onClick={() => setRevealed(true)}>
                Show script
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ animation: "fadeUp .35s ease" }}>
          <div className="flex items-center gap-2.5 mb-4 flex-wrap">
            <button className={BTN_TEAL} onClick={isPlaying ? stop : play} disabled={!isSupported}>
              {isPlaying ? "⏸ Stop" : "▶ Play again"}
            </button>
            <button className={BTN_LINE} onClick={() => setShowEn((v) => !v)}>
              {showEn ? "Hide translation" : "Show translation"}
            </button>
          </div>

          <div className="border border-line rounded-[14px] overflow-hidden mb-3.5">
            {lines.map((line, i) => (
              <div
                key={i}
                className={`px-[18px] py-3.5 border-b border-line last:border-b-0 transition-colors ${
                  i === currentIndex ? "bg-[#F0FDFA]" : "bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="flex-none -my-1">
                      <Character
                        color={characterColor(speakers.indexOf(line.speaker))}
                        variant={characterVariant(speakers.indexOf(line.speaker))}
                        talking={i === currentIndex}
                        size={36}
                      />
                    </div>
                    <div>
                      <b
                        className={`block text-[11px] font-bold mb-px ${
                          i === currentIndex ? "text-teal" : "text-faint"
                        }`}
                      >
                        {line.speaker}
                      </b>
                      <p className="kr text-base font-medium">{line.kr}</p>
                      {showEn && <p className="text-[13px] text-muted mt-0.5">{line.en}</p>}
                    </div>
                  </div>
                  <button
                    aria-label="Replay this line"
                    className="flex-none text-sm text-faint hover:text-teal transition-colors disabled:opacity-40 mt-1"
                    onClick={() => replayLine(i)}
                    disabled={!isSupported}
                  >
                    🔁
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button className={done ? BTN_LINE : BTN_INK} onClick={markHeard} disabled={done || saving}>
            {done ? "Heard ✓" : saving ? "Saving…" : "I understood this →"}
          </button>
        </div>
      )}
    </div>
  );
}
