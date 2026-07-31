"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function friendlyError(raw: string) {
  if (raw.includes("already owned")) return "You already own this.";
  if (raw.includes("level too low")) return "Reach a higher level first.";
  if (raw.includes("not enough coins")) return "Not enough coins.";
  if (raw.includes("unknown costume")) return "This item is unavailable.";
  return "Purchase failed. Try again.";
}

export default function BuyButton({
  costumeId,
  price,
  coins,
  owned,
  locked,
}: {
  costumeId: string;
  price: number;
  coins: number;
  owned: boolean;
  locked: boolean;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(false);
  const [isOwned, setIsOwned] = useState(owned);
  const [balance, setBalance] = useState(coins);
  const [message, setMessage] = useState<string | null>(null);

  const affordable = balance >= price;

  async function handleBuy() {
    if (isOwned || loading || locked) return;
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase.rpc("buy_costume", { p_costume_id: costumeId });

    if (error) {
      setMessage(friendlyError(error.message));
      setLoading(false);
      router.refresh();
      return;
    }

    if (typeof data === "number") setBalance(data);
    setIsOwned(true);
    setLoading(false);
    router.refresh();
  }

  if (isOwned) {
    return (
      <span className="text-[11.5px] font-semibold text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0] rounded-md px-2.5 py-1">
        Owned ✓
      </span>
    );
  }
  if (locked) {
    return (
      <span className="text-[11.5px] font-semibold text-[#A1A1AA] bg-[#FAFAF9] border border-[#E7E5E4] rounded-md px-2.5 py-1">
        🔒 Level locked
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        className="rounded-[9px] px-4 py-2 text-[13px] font-semibold text-white bg-[#18181B] hover:bg-[#3F3F46] transition-colors disabled:opacity-50"
        onClick={handleBuy}
        disabled={loading || !affordable}
      >
        {loading ? "Buying…" : `🌰 ${price}`}
      </button>
      {message && <span className="text-[11.5px] font-medium text-[#DC2626]">{message}</span>}
    </div>
  );
}
