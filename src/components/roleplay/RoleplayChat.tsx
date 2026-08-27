"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Character, { characterColor, characterVariant } from "@/components/listening/Character";
import Button, { buttonClassName } from "@/components/ui/Button";
import { useKoreanSpeaker, useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSaveResume } from "@/hooks/useSaveResume";
import { track } from "@/lib/analytics";
import { recordCompletion, type ProgressResult } from "@/lib/activity";
import { createClient } from "@/lib/supabase/client";
import {
  MAX_TURNS,
  ROLEPLAY_MINUTES,
  goalsFor,
  scenarioByKey,
  type RoleplayMessage,
  type RoleplayReply,
} from "@/lib/roleplay";
import type { CefrLevel } from "@/lib/tree";

type ChatMessage = RoleplayMessage & {
  id: number;
  correction?: RoleplayReply["correction"];
};

const CARD = "max-w-[640px] border border-line rounded-[14px] bg-white overflow-hidden";

export default function RoleplayChat({
  scenarioKey,
  level,
  userId,
}: {
  scenarioKey: string;
  level: CefrLevel;
  userId: string;
}) {
  const scenario = useMemo(() => scenarioByKey(scenarioKey)!, [scenarioKey]);
  const goals = useMemo(() => goalsFor(scenario, level), [scenario, level]);
  const supabase = useMemo(() => createClient(), []);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { id: 0, role: "ai", kr: scenario.opening.kr, en: scenario.opening.en },
  ]);
  const [goalsDone, setGoalsDone] = useState<number[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [praise, setPraise] = useState("");
  const [levelUp, setLevelUp] = useState<ProgressResult | null>(null);
  const [showEn, setShowEn] = useState<Record<number, boolean>>({});
  const [speakingId, setSpeakingId] = useState<number | null>(null);

  const logged = useRef(false);
  const nextId = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingText = useRef("");

  const { speak, isSpeaking } = useKoreanSpeaker();
  const mic = useSpeechRecognition("ko-KR", 8000);

  const userTurns = messages.filter((m) => m.role === "user").length;

  useSaveResume(userId, {
    skill: "speaking",
    href: `/roleplay?situation=${scenario.key}`,
    label: scenario.title,
    detail: `Roleplay · ${level}`,
    progress: Math.round((goalsDone.length / goals.length) * 100),
  });

  useEffect(() => {
    track("roleplay_started", { situation: scenario.key, level });
  }, [scenario.key, level]);

  // Keep the newest bubble in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  // Award XP exactly once when the roleplay wraps up.
  useEffect(() => {
    if (!finished || logged.current) return;
    logged.current = true;
    void (async () => {
      const result = await recordCompletion(supabase, "speaking", ROLEPLAY_MINUTES);
      if (result?.leveled_up) setLevelUp(result);
    })();
  }, [finished, supabase]);

  function say(id: number, text: string) {
    setSpeakingId(id);
    speak(text);
  }

  async function send(text: string) {
    const kr = text.trim();
    if (!kr || sending || finished) return;
    pendingText.current = kr;
    setError(null);
    setInput("");
    const userMsg: ChatMessage = { id: nextId.current++, role: "user", kr };
    const history = [...messages, userMsg];
    setMessages(history);
    setSending(true);

    try {
      const res = await fetch("/api/roleplay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          situationKey: scenario.key,
          level,
          messages: history.map(({ role, kr }) => ({ role, kr })),
          goalsDone,
        }),
      });
      const data = (await res.json()) as RoleplayReply & { error?: string; message?: string };
      if (!res.ok) {
        // Roll the learner's bubble back so they can retry without a duplicate.
        setMessages((m) => m.filter((x) => x.id !== userMsg.id));
        setInput(kr);
        setError(data.message ?? "The partner didn't answer. Try again.");
        return;
      }
      setMessages((m) => [
        ...m.map((x) => (x.id === userMsg.id && data.correction ? { ...x, correction: data.correction } : x)),
        { id: nextId.current++, role: "ai", kr: data.reply_kr, en: data.reply_en },
      ]);
      setGoalsDone(data.goals_done);
      if (data.finished) {
        setPraise(data.praise_en);
        setFinished(true);
      }
    } catch {
      setMessages((m) => m.filter((x) => x.id !== userMsg.id));
      setInput(kr);
      setError("Lost the connection. Try again.");
    } finally {
      setSending(false);
    }
  }

  function toggleMic() {
    if (mic.isListening) {
      mic.stop();
      return;
    }
    mic.listen((transcript) => {
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      inputRef.current?.focus();
    });
  }

  const activeSpeakingId = isSpeaking ? speakingId : null;
  const aiColor = characterColor(0);
  const aiVariant = characterVariant(0);

  if (finished) {
    return (
      <div className="max-w-[560px] border border-line rounded-[14px] p-[clamp(20px,3vw,28px)] text-center">
        <p className="text-4xl mb-2">{goalsDone.length === goals.length ? "🎉" : "🌱"}</p>
        <h2 className="font-bold text-[21px] tracking-[-0.02em] mb-1.5">
          {goalsDone.length === goals.length ? "Scenario cleared!" : "Nice conversation!"}
        </h2>
        <p className="text-sm text-muted mb-4">
          {goalsDone.length} of {goals.length} goals done · {userTurns} {userTurns === 1 ? "turn" : "turns"} ·{" "}
          {scenario.title}
        </p>
        {praise && (
          <div className="text-left border border-[#FED7AA] bg-[#FFF7ED] rounded-[10px] px-4 py-3 mb-5">
            <b className="block text-[12.5px] font-semibold text-[#9A3412] mb-1">From your partner</b>
            <p className="text-[13.5px] text-[#7C2D12] leading-[1.55]">{praise}</p>
          </div>
        )}
        {levelUp && (
          <p className="text-sm font-semibold text-success mb-5">
            🎉 Level up! You&apos;re now Lv. {levelUp.new_level}
          </p>
        )}

        <ul className="text-left space-y-1.5 mb-6">
          {goals.map((g, i) => {
            const done = goalsDone.includes(i);
            return (
              <li key={i} className={`text-[13.5px] flex gap-2 ${done ? "text-success-deep" : "text-faint"}`}>
                <span>{done ? "✓" : "○"}</span>
                <span>{g.en}</span>
              </li>
            );
          })}
        </ul>

        <div className="flex gap-2.5 justify-center flex-wrap">
          <Link href="/roleplay" className={buttonClassName("amber")}>
            Try another scenario
          </Link>
          <Link href="/dashboard" className={buttonClassName("line")}>
            Back to garden
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={CARD}>
      {/* goals + turn counter */}
      <div className="border-b border-line bg-warm px-4 py-3">
        <div className="flex items-center justify-between gap-3 mb-2">
          <b className="text-[12px] font-semibold tracking-[.06em] uppercase text-faint">Goals</b>
          <span className="text-[12px] font-semibold text-muted">
            Turn {Math.min(userTurns + 1, MAX_TURNS)}/{MAX_TURNS}
          </span>
        </div>
        <ul className="space-y-1">
          {goals.map((g, i) => {
            const done = goalsDone.includes(i);
            return (
              <li
                key={i}
                className={`text-[13px] flex gap-2 items-start transition-colors ${
                  done ? "text-success-deep line-through decoration-success/40" : "text-charcoal"
                }`}
              >
                <span
                  className={`flex-none w-[18px] h-[18px] rounded-full border text-[11px] flex items-center justify-center mt-[1px] ${
                    done ? "bg-success border-success text-white" : "border-dash text-transparent"
                  }`}
                >
                  ✓
                </span>
                <span className="min-w-0">{g.en}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* transcript */}
      <div ref={scrollRef} className="px-4 py-4 space-y-3.5 max-h-[52vh] min-h-[260px] overflow-y-auto">
        {messages.map((m) =>
          m.role === "ai" ? (
            <div key={m.id} className="flex items-end gap-2">
              <div className="flex-none w-9 -mb-1">
                <Character color={aiColor} variant={aiVariant} talking={activeSpeakingId === m.id} size={36} />
              </div>
              <div className="max-w-[80%]">
                <span className="block text-[11px] text-faint mb-0.5 kr">{scenario.aiName}</span>
                <div className="rounded-[14px] rounded-bl-[4px] bg-warm border border-line px-3.5 py-2.5">
                  <p className="kr text-[15px] leading-[1.55]">{m.kr}</p>
                  {showEn[m.id] && m.en && <p className="text-[12.5px] text-muted mt-1">{m.en}</p>}
                </div>
                <div className="flex gap-3 mt-1 ml-1">
                  <button
                    type="button"
                    onClick={() => say(m.id, m.kr)}
                    className="text-[12px] text-muted hover:text-charcoal"
                    aria-label="Play audio"
                  >
                    {activeSpeakingId === m.id ? "🔊 playing…" : "🔊 listen"}
                  </button>
                  {m.en && (
                    <button
                      type="button"
                      onClick={() => setShowEn((s) => ({ ...s, [m.id]: !s[m.id] }))}
                      className="text-[12px] text-muted hover:text-charcoal"
                    >
                      {showEn[m.id] ? "hide English" : "show English"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex flex-col items-end">
              <div className="max-w-[80%] rounded-[14px] rounded-br-[4px] bg-[#FFF7ED] border border-[#FED7AA] px-3.5 py-2.5">
                <p className="kr text-[15px] leading-[1.55]">{m.kr}</p>
              </div>
              {m.correction && (
                <div className="max-w-[80%] mt-1.5 border border-amber-line bg-[#FFFBEB] rounded-[10px] px-3 py-2">
                  <p className="text-[12.5px] text-[#92400E]">
                    💡 Better: <span className="kr font-semibold">{m.correction.corrected}</span>
                  </p>
                  {m.correction.note && <p className="text-[12px] text-[#B45309] mt-0.5">{m.correction.note}</p>}
                </div>
              )}
            </div>
          )
        )}
        {sending && (
          <div className="flex items-end gap-2">
            <div className="flex-none w-9 -mb-1">
              <Character color={aiColor} variant={aiVariant} talking={false} size={36} />
            </div>
            <div className="rounded-[14px] rounded-bl-[4px] bg-warm border border-line px-3.5 py-3 flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-faint animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-faint animate-bounce [animation-delay:120ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-faint animate-bounce [animation-delay:240ms]" />
            </div>
          </div>
        )}
      </div>

      {/* error */}
      {(error || mic.error) && (
        <div className="mx-4 mb-2 border border-[#FECACA] bg-danger-bg rounded-[10px] px-3 py-2 flex items-center justify-between gap-3">
          <span className="text-[12.5px] text-danger">{error ?? mic.error}</span>
          {error && (
            <button
              type="button"
              onClick={() => void send(input || pendingText.current)}
              className="text-[12.5px] font-semibold text-danger underline"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="sticky bottom-0 border-t border-line bg-white px-3 py-3"
      >
        <div className="flex items-center gap-2">
          {mic.isSupported && (
            <button
              type="button"
              onClick={toggleMic}
              disabled={sending}
              aria-label={mic.isListening ? "Stop listening" : "Speak your reply"}
              className={`flex-none w-10 h-10 rounded-full border text-lg transition-colors disabled:opacity-60 ${
                mic.isListening
                  ? "bg-danger-bg border-[#FECACA] animate-pulse"
                  : "bg-white border-line hover:bg-warm"
              }`}
            >
              🎤
            </button>
          )}
          <input
            ref={inputRef}
            value={mic.isListening && mic.interim ? mic.interim : input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
            placeholder={mic.isListening ? "Listening…" : "Reply in Korean…"}
            className="kr flex-1 min-w-0 rounded-[10px] border border-line px-3.5 py-2.5 text-[15px] outline-none focus:border-[#FDBA74] disabled:opacity-60"
            autoComplete="off"
            autoFocus
          />
          <Button tone="amber" type="submit" disabled={sending || !input.trim()} className="flex-none px-4">
            Send
          </Button>
        </div>
        {!mic.isSupported && (
          <p className="text-[11.5px] text-faint mt-2">Voice input needs Chrome or Edge — typing works everywhere.</p>
        )}
      </form>
    </div>
  );
}
