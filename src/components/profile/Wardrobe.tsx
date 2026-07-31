"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import LevelCreature from "@/components/dashboard/LevelCreature";
import { COSTUMES, costumeById } from "@/lib/costumes";
import type { CefrLevel } from "@/lib/tree";

export default function Wardrobe({
  userId,
  level,
  ownedIds,
  equippedIds,
}: {
  userId: string;
  level: CefrLevel;
  ownedIds: string[];
  equippedIds: string[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [equipped, setEquipped] = useState<string[]>(equippedIds);
  const [busy, setBusy] = useState(false);

  const owned = COSTUMES.filter((c) => ownedIds.includes(c.id));

  async function toggle(costumeId: string) {
    if (busy) return;
    const costume = costumeById(costumeId);
    if (!costume) return;
    setBusy(true);

    const isOn = equipped.includes(costumeId);
    if (isOn) {
      await supabase
        .from("user_costumes")
        .update({ equipped: false })
        .eq("user_id", userId)
        .eq("costume_id", costumeId);
      setEquipped((prev) => prev.filter((id) => id !== costumeId));
    } else {
      // One item per slot: unequip anything else occupying it first.
      await supabase
        .from("user_costumes")
        .update({ equipped: false })
        .eq("user_id", userId)
        .eq("slot", costume.slot);
      await supabase
        .from("user_costumes")
        .update({ equipped: true })
        .eq("user_id", userId)
        .eq("costume_id", costumeId);
      setEquipped((prev) => [
        ...prev.filter((id) => costumeById(id)?.slot !== costume.slot),
        costumeId,
      ]);
    }

    setBusy(false);
  }

  return (
    <div className="border border-[#E7E5E4] rounded-[14px] px-[22px] py-5">
      <div className="flex justify-between items-baseline mb-2 gap-3">
        <b className="font-semibold text-[15px] tracking-[-0.01em]">My costume</b>
        <Link
          href="/shop"
          className="text-[12.5px] font-semibold text-[#71717A] hover:text-[#18181B] transition-colors"
        >
          Shop for more →
        </Link>
      </div>

      <div className="flex justify-center mb-4">
        <svg viewBox="0 0 220 230" className="w-[170px] h-auto" aria-hidden="true">
          <LevelCreature level={level} costumeIds={equipped} />
        </svg>
      </div>

      {owned.length === 0 ? (
        <p className="text-[13px] text-[#71717A] text-center">
          No costumes yet — visit the shop and treat your tree.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2 justify-center">
          {owned.map((c) => {
            const on = equipped.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggle(c.id)}
                disabled={busy}
                className={`flex items-center gap-1.5 rounded-[9px] px-3 py-1.5 text-[12.5px] font-semibold border transition-all disabled:opacity-60 ${
                  on
                    ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]"
                    : "bg-white border-[#E7E5E4] text-[#71717A] hover:border-[#A1A1AA]"
                }`}
              >
                <svg viewBox="-40 -30 80 60" className="w-[30px] h-[22px]">
                  {c.render()}
                </svg>
                {c.name}
                {on && " ✓"}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
