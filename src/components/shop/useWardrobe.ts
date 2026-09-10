"use client";

import { useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { playBuy } from "@/lib/sfx";
import {
  costumeById,
  isAvailable,
  isLevelLocked,
  isUpcoming,
  type Costume,
  type CostumeSlot,
  type Rarity,
} from "@/lib/costumes";

// The try-on / buy / wear state machine behind the shop, lifted out of
// ShopClient (2026-09-10) so My room can run the same thing against the big
// garden tree instead of a second polaroid. ShopClient still carries its own
// copy — the two are meant to converge when /shop folds into My room.
//
// `worn` is what the database says is equipped; `preview` is what the tree
// is showing right now (worn + whatever was tapped). Buying wears the item.

export const RARITY_ORDER: Record<Rarity, number> = { common: 0, rare: 1, epic: 2, legendary: 3 };

/** Maps a buy_costume() error onto a key under shop.errors. */
export function errorKey(raw: string): string {
  if (raw.includes("not enough coins")) return "notEnoughCoins";
  if (raw.includes("already owned")) return "alreadyOwned";
  if (raw.includes("level too low")) return "levelTooLow";
  if (raw.includes("plus required")) return "unavailable";
  if (raw.includes("not available")) return "notOnSale";
  return "generic";
}

type Slots = Partial<Record<CostumeSlot, string>>;

function toMap(ids: string[]): Slots {
  const m: Slots = {};
  for (const id of ids) {
    const c = costumeById(id);
    if (c) m[c.slot] = id;
  }
  return m;
}

export type CtaKind =
  | { kind: "pick" }
  | { kind: "wear" }
  | { kind: "claimAdmin" }
  | { kind: "locked"; level: number }
  | { kind: "upcoming"; date: string }
  | { kind: "needMore"; n: number }
  | { kind: "claim" }
  | { kind: "buy"; price: number };

export function useWardrobe({
  userId,
  coins,
  isAdmin,
  playerLevel,
  owned,
  equipped,
  today,
}: {
  userId: string;
  coins: number;
  isAdmin: boolean;
  playerLevel: number;
  owned: string[];
  equipped: string[];
  today: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const now = useMemo(() => new Date(today), [today]);
  const [balance, setBalance] = useState(coins);
  const [ownedSet, setOwnedSet] = useState(() => new Set(owned));
  const [worn, setWorn] = useState<Slots>(() => toMap(equipped));
  const [preview, setPreview] = useState<Slots>(() => toMap(equipped));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ key: string; params?: Record<string, string | number>; good: boolean } | null>(null);

  const previewIds = Object.values(preview).filter((v): v is string => !!v);
  // The one item the CTA acts on: the tried-on item that isn't worn yet, or
  // (nothing tried on) nothing — a wearing item is handled by its own card.
  const changed = (Object.keys(preview) as CostumeSlot[]).find((s) => preview[s] && preview[s] !== worn[s]);
  const selected = changed ? costumeById(preview[changed]!) : undefined;
  const dirty = !!changed;

  function listFor(slot: CostumeSlot, all: readonly Costume[]): Costume[] {
    return all
      .filter((c) => c.slot === slot && (isAvailable(c, now) || ownedSet.has(c.id) || isUpcoming(c, now)))
      .sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity] || a.price - b.price);
  }

  function toggle(c: Costume) {
    setMessage(null);
    setPreview((p) => {
      if (p[c.slot] === c.id) {
        if (worn[c.slot] === c.id) return p;
        return { ...p, [c.slot]: undefined };
      }
      return { ...p, [c.slot]: c.id };
    });
  }

  function reset() {
    setPreview(worn);
    setMessage(null);
  }

  async function equip(c: Costume) {
    const previous = worn[c.slot];
    const cleared = await supabase.from("user_costumes").update({ equipped: false }).eq("user_id", userId).eq("slot", c.slot);
    if (cleared.error) return false;
    const { error } = await supabase.from("user_costumes").update({ equipped: true }).eq("user_id", userId).eq("costume_id", c.id);
    if (error) {
      if (previous) {
        await supabase.from("user_costumes").update({ equipped: true }).eq("user_id", userId).eq("costume_id", previous);
      }
      return false;
    }
    setWorn((w) => ({ ...w, [c.slot]: c.id }));
    return true;
  }

  async function unequip(c: Costume) {
    const { error } = await supabase.from("user_costumes").update({ equipped: false }).eq("user_id", userId).eq("costume_id", c.id);
    if (error) return false;
    setWorn((w) => ({ ...w, [c.slot]: undefined }));
    return true;
  }

  /** Wear / take off an item you own, straight from its card. */
  async function wearOrTakeOff(c: Costume) {
    if (busy || !ownedSet.has(c.id)) return;
    setBusy(true);
    setMessage(null);
    try {
      const wearing = worn[c.slot] === c.id;
      const ok = wearing ? await unequip(c) : await equip(c);
      if (!ok) {
        setMessage({ key: "errors.generic", good: false });
        return;
      }
      setPreview((p) => ({ ...p, [c.slot]: wearing ? undefined : c.id }));
      router.refresh();
    } catch (err) {
      console.error("wardrobe action failed:", err instanceof Error ? err.message : err);
      setMessage({ key: "errors.generic", good: false });
    } finally {
      setBusy(false);
    }
  }

  async function act() {
    if (!selected || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      if (ownedSet.has(selected.id)) {
        const ok = await equip(selected);
        if (!ok) {
          setMessage({ key: "errors.generic", good: false });
          return;
        }
      } else {
        const { data, error } = await supabase.rpc("buy_costume", { p_costume_id: selected.id });
        if (error) {
          setMessage({ key: `errors.${errorKey(error.message)}`, good: false });
          return;
        }
        if (typeof data === "number") setBalance(data);
        playBuy();
        setOwnedSet((s) => new Set(s).add(selected.id));
        const wearing = await equip(selected);
        setMessage({ key: wearing ? "bought" : "boughtNotWorn", params: { name: selected.name }, good: wearing });
      }
      router.refresh();
    } catch (err) {
      console.error("shop action failed:", err instanceof Error ? err.message : err);
      setMessage({ key: "errors.generic", good: false });
    } finally {
      setBusy(false);
    }
  }

  let cta: CtaKind = { kind: "pick" };
  if (selected) {
    if (ownedSet.has(selected.id)) cta = { kind: "wear" };
    else if (isAdmin) cta = { kind: "claimAdmin" };
    else if (isLevelLocked(selected, playerLevel)) cta = { kind: "locked", level: selected.minPlayerLevel ?? 0 };
    else if (isUpcoming(selected, now) && selected.availableFrom) cta = { kind: "upcoming", date: selected.availableFrom };
    else if (balance < selected.price) cta = { kind: "needMore", n: selected.price - balance };
    else cta = selected.price === 0 ? { kind: "claim" } : { kind: "buy", price: selected.price };
  }

  return {
    now,
    balance,
    ownedSet,
    worn,
    preview,
    previewIds,
    selected,
    dirty,
    busy,
    message,
    cta,
    listFor,
    toggle,
    reset,
    act,
    wearOrTakeOff,
  };
}
