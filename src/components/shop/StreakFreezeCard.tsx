"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/analytics";

export const FREEZE_PRICE = 150;
export const FREEZE_MAX = 3;

// Consumable: one freeze covers one missed day so the streak survives.
// Spent automatically by touch_streak() (migration 0035); stacks with the
// Plus shield (Plus covers the first missed day, freezes cover the rest).
export default function StreakFreezeCard({
  held,
  coins,
  isAdmin,
  streakDays,
  hasPlus,
}: {
  held: number;
  coins: number;
  isAdmin: boolean;
  streakDays: number;
  hasPlus: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [count, setCount] = useState(held);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const full = count >= FREEZE_MAX;
  const affordable = isAdmin || coins >= FREEZE_PRICE;

  async function buy() {
    if (busy || full) return;
    setBusy(true);
    setMsg(null);
    const { data, error } = await supabase.rpc("buy_streak_freeze");
    if (error) {
      setMsg(
        error.message.includes("not enough coins")
          ? "Not enough coins — daily quests pay 10 each."
          : error.message.includes("max freezes")
            ? `You can hold at most ${FREEZE_MAX}.`
            : error.code === "PGRST202"
              ? "Freezes open soon (migration 0035 pending)."
              : "Couldn't buy that right now."
      );
    } else {
      setCount(typeof data === "number" ? data : count + 1);
      setMsg("Frozen and ready 🧊 — it'll be used automatically if you miss a day.");
      track("streak_freeze_bought", { held: count + 1 });
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <div className="max-w-[1040px] border border-[#BAE6FD] bg-[#F0F9FF] rounded-[14px] px-5 py-4 mb-5 flex items-center gap-4 flex-wrap">
      <span className="flex-none w-12 h-12 rounded-[12px] bg-white border border-[#BAE6FD] flex items-center justify-center text-[24px]">
        🧊
      </span>
      <div className="flex-1 min-w-[220px]">
        <b className="font-semibold text-[14.5px] text-[#0369A1] flex items-center gap-2 flex-wrap">
          Streak freeze
          <span className="text-[11px] font-bold text-[#0369A1] bg-white border border-[#BAE6FD] rounded-full px-2 py-px">
            {count}/{FREEZE_MAX} held
          </span>
        </b>
        <span className="text-[13px] text-[#0C4A6E]">
          Miss a day and a freeze is spent for you — your{streakDays > 0 ? ` ${streakDays}-day` : ""} streak stays alive.
          {hasPlus ? " Stacks with your Plus shield." : ""}
        </span>
        {msg && <span className="block text-[12.5px] mt-1 text-[#0369A1]">{msg}</span>}
      </div>
      <button
        type="button"
        onClick={buy}
        disabled={busy || full || !affordable}
        className="rounded-[10px] bg-[#0284C7] px-4 py-2.5 text-[13px] font-bold text-white hover:bg-[#0369A1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {full ? "Max held" : busy ? "Freezing…" : `Buy · 🌰 ${FREEZE_PRICE}`}
      </button>
    </div>
  );
}
