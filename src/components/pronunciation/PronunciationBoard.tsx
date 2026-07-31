"use client";

import { useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/activity";
import { useKoreanSpeaker, useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { normalizeKr, similarity } from "@/lib/speech-match";
import { SOUND_GROUPS, type PronWord, type SoundGroup } from "@/lib/pronunciation";

const TEAL = "#0D9488";

function WordRow({
  word,
  nailed,
  onNailed,
  onAttempt,
}: {
  word: PronWord;
  nailed: boolean;
  onNailed: () => void;
  onAttempt: () => void;
}) {
  const [heard, setHeard] = useState<string | null>(null);
  const { speak, isSupported: ttsOk } = useKoreanSpeaker();
  const { isSupported: micOk, isListening, interim, error, listen } = useSpeechRecognition("ko-KR");

  const ok = heard !== null && (normalizeKr(heard) === normalizeKr(word.kr) || similarity(heard, word.kr) >= 0.8);

  function check(transcript: string) {
    setHeard(transcript);
    onAttempt();
    if (normalizeKr(transcript) === normalizeKr(word.kr) || similarity(transcript, word.kr) >= 0.8) {
      onNailed();
    }
  }

  return (
    <div
      className={`rounded-[10px] border px-4 py-3 transition-colors ${
        nailed ? "border-[#BBF7D0] bg-[#F0FDF4]" : "border-[#E7E5E4] bg-white hover:border-[#99F6E4]"
      }`}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <button
          aria-label={`Hear ${word.kr}`}
          className="w-10 h-10 rounded-full flex-none bg-[#F0FDFA] text-[#0D9488] border border-[#99F6E4] text-[15px] flex items-center justify-center transition-transform hover:scale-110 disabled:opacity-40"
          onClick={() => speak(word.kr)}
          disabled={!ttsOk}
        >
          🔊
        </button>

        <div className="min-w-0 flex-1">
          <p className="kr text-[19px] font-medium leading-tight">{word.kr}</p>
          <p className="text-[12.5px] text-[#71717A]">
            <span className="italic">{word.romanization}</span> · {word.en}
          </p>
        </div>

        <button
          aria-label={`Say ${word.kr}`}
          onClick={() => micOk && listen(check)}
          disabled={!micOk || isListening}
          className={`w-10 h-10 rounded-full flex-none text-[15px] flex items-center justify-center border transition-all ${
            isListening
              ? "bg-[#0D9488] border-[#0D9488] text-white scale-110 wave-on"
              : "bg-white border-[#E7E5E4] text-[#71717A] hover:border-[#0D9488] hover:text-[#0D9488] hover:scale-110"
          } disabled:opacity-40 disabled:hover:scale-100`}
        >
          🎤
        </button>

        {nailed && <span className="text-[13px] font-semibold text-[#16A34A]">✓</span>}
      </div>

      {(isListening || heard !== null || error) && (
        <div className="mt-2.5 pl-[52px]" style={{ animation: "fadeUp .3s ease" }}>
          {isListening ? (
            <p className="text-[13px] text-[#71717A]">
              Listening… <span className="kr text-[#18181B]">{interim}</span>
            </p>
          ) : heard !== null ? (
            ok ? (
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg px-2.5 py-1">
                🌱 Perfect!
              </span>
            ) : (
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#B45309] bg-[#FFFBEB] border border-[#FDE68A] rounded-lg px-2.5 py-1">
                  Heard: <span className="kr text-[14px]">{heard}</span>
                </span>
                <button
                  className="text-[12.5px] font-semibold text-[#0D9488] hover:underline"
                  onClick={() => {
                    setHeard(null);
                    listen(check);
                  }}
                >
                  Try again
                </button>
              </div>
            )
          ) : (
            <p className="text-[12.5px] text-[#E11D48]">{error}</p>
          )}
        </div>
      )}

      {!micOk && heard === null && (
        <p className="mt-2 pl-[52px] text-[12px] text-[#A1A1AA]">
          Recording needs Chrome or Edge — you can still listen and repeat.
        </p>
      )}
    </div>
  );
}

function GroupCard({
  group,
  open,
  onToggle,
  onAttempt,
}: {
  group: SoundGroup;
  open: boolean;
  onToggle: () => void;
  onAttempt: () => void;
}) {
  const [nailed, setNailed] = useState<string[]>([]);

  return (
    <section
      id={group.key}
      className={`border rounded-[14px] bg-white overflow-hidden transition-colors scroll-mt-6 ${
        open ? "border-[#0D9488]" : "border-[#E7E5E4] hover:border-[#99F6E4]"
      }`}
    >
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="w-full text-left px-[clamp(16px,3vw,22px)] py-4 flex items-center gap-3.5 group"
      >
        <span
          className={`w-10 h-10 rounded-[11px] flex-none flex items-center justify-center kr text-[17px] border transition-all group-hover:scale-105 ${
            nailed.length === group.items.length
              ? "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]"
              : "bg-[#F0FDFA] text-[#0D9488] border-[#99F6E4]"
          }`}
        >
          {nailed.length === group.items.length ? "✓" : "발"}
        </span>
        <div className="min-w-0 flex-1">
          <b className="block font-semibold text-[15.5px] kr">{group.title}</b>
          <small className="block text-[12.5px] text-[#71717A]">
            {group.items.length} words · {nailed.length} of {group.items.length} nailed
          </small>
        </div>
        <span
          className={`flex-none text-[#A1A1AA] text-[13px] transition-transform ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          className="px-[clamp(16px,3vw,22px)] pb-[22px]"
          style={{ animation: "fadeUp .35s ease" }}
        >
          <div className="bg-[#F0FDFA] border border-[#99F6E4] rounded-[10px] px-4 py-3 mb-3.5">
            <b className="block text-[11px] font-bold tracking-[.06em] text-[#0D9488] mb-1">HOW TO MAKE IT</b>
            <p className="text-[13.5px] leading-[1.6] text-[#18181B]">{group.tip}</p>
          </div>

          {/* progress bar */}
          <div className="h-1.5 rounded-full bg-[#E7E5E4] mb-3.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(nailed.length / group.items.length) * 100}%`,
                background: TEAL,
              }}
            />
          </div>

          <div className="grid gap-2.5">
            {group.items.map((w) => (
              <WordRow
                key={w.kr}
                word={w}
                nailed={nailed.includes(w.kr)}
                onNailed={() => setNailed((n) => (n.includes(w.kr) ? n : [...n, w.kr]))}
                onAttempt={onAttempt}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default function PronunciationBoard() {
  const [openKey, setOpenKey] = useState<string | null>(SOUND_GROUPS[0].key);
  const supabase = useMemo(() => createClient(), []);
  // One minute per drilling session, however many words get attempted.
  const logged = useRef(false);

  async function onAttempt() {
    if (logged.current) return;
    logged.current = true;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) await logActivity(supabase, 1);
  }

  function jumpTo(key: string) {
    setOpenKey(key);
    requestAnimationFrame(() =>
      document.getElementById(key)?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  }

  return (
    <div className="grid gap-3 max-w-[760px]">
      <div className="flex gap-2 mb-3 flex-wrap">
        {SOUND_GROUPS.map((g) => (
          <button
            key={g.key}
            onClick={() => jumpTo(g.key)}
            className={`kr rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold border transition-all ${
              openKey === g.key
                ? "bg-[#0D9488] border-[#0D9488] text-white"
                : "bg-white border-[#E7E5E4] text-[#71717A] hover:border-[#0D9488] hover:text-[#0D9488] hover:bg-[#F0FDFA]"
            }`}
          >
            {g.title.split(" — ")[0]}
          </button>
        ))}
      </div>

      {SOUND_GROUPS.map((g) => (
        <GroupCard
          key={g.key}
          group={g}
          open={openKey === g.key}
          onToggle={() => setOpenKey((k) => (k === g.key ? null : g.key))}
          onAttempt={onAttempt}
        />
      ))}
    </div>
  );
}
