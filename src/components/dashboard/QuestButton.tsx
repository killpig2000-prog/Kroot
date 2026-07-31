"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { awardProgress, logActivity } from "@/lib/activity";

const MINUTES_PER_QUEST = 5;
const COINS_PER_QUEST = 10;

export default function QuestButton({
  questId,
  completed,
}: {
  questId: string;
  completed: boolean;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(completed);

  async function handleComplete() {
    if (done || loading) return;
    setLoading(true);

    await supabase.from("daily_quests").update({ completed_at: new Date().toISOString() }).eq("id", questId);

    await logActivity(supabase, MINUTES_PER_QUEST);
    await awardProgress(supabase, "quest");

    const { error: coinError } = await supabase.rpc("earn_coins", { p_amount: COINS_PER_QUEST });
    if (coinError) console.error("earn_coins failed:", coinError.message);

    setDone(true);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      className="rounded-[9px] px-[18px] py-[9px] text-[13.5px] font-semibold text-white bg-[#18181B] transition-colors hover:bg-[#3F3F46] disabled:opacity-60 disabled:cursor-default"
      onClick={handleComplete}
      disabled={done || loading}
    >
      {done ? "Done ✓" : loading ? "Watering…" : "Start ▸"}
    </button>
  );
}
