"use client";

import { useMemo, useRef, useState } from "react";
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
// is showing right now. Tapping a card only changes the preview — owned or
// not, worn or not (2026-09-10, user call: "착용 누르기 전까지 착용하면 안
// 됨"). Nothing reaches the database until act(): it applies every slot
// where preview differs from worn — takes off what was removed, wears what
// was added, buying first where needed. "Take everything off" is just a
// preview of nothing, so it goes through the same button.

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
  | { kind: "takeOff"; n: number }
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
  // busy is a render behind a fast double tap; the second act() would buy again
  // and overwrite the "bought" message with an error.
  const acting = useRef(false);
  const [message, setMessage] = useState<{ key: string; params?: Record<string, string | number>; good: boolean } | null>(null);

  const previewIds = Object.values(preview).filter((v): v is string => !!v);
  const wornIds = Object.values(worn).filter((v): v is string => !!v);
  // Every slot the preview changes: added (an item the tree isn't wearing)
  // or removed (worn, but taken off in the preview).
  const slots = new Set<CostumeSlot>([...Object.keys(preview), ...Object.keys(worn)] as CostumeSlot[]);
  const added: Costume[] = [];
  const removed: Costume[] = [];
  for (const s of slots) {
    if (preview[s] === worn[s]) continue;
    if (preview[s]) {
      const c = costumeById(preview[s]!);
      if (c) added.push(c);
    } else if (worn[s]) {
      const c = costumeById(worn[s]!);
      if (c) removed.push(c);
    }
  }
  const dirty = added.length + removed.length > 0;
  /** The item the head line names — the first thing being tried on. */
  const selected = added[0];
  const toBuy = added.filter((c) => !ownedSet.has(c.id));
  const buyTotal = toBuy.reduce((sum, c) => sum + c.price, 0);

  function listFor(slot: CostumeSlot, all: readonly Costume[]): Costume[] {
    return all
      .filter((c) => c.slot === slot && (isAvailable(c, now) || ownedSet.has(c.id) || isUpcoming(c, now)))
      .sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity] || a.price - b.price);
  }

  /** Tap a card: on the tree if it isn't, off if it is. Preview only. */
  function toggle(c: Costume) {
    setMessage(null);
    setPreview((p) => (p[c.slot] === c.id ? { ...p, [c.slot]: undefined } : { ...p, [c.slot]: c.id }));
  }

  /** Back to what the database says is worn. */
  function reset() {
    setPreview(worn);
    setMessage(null);
  }

  /** Preview the bare tree; act() then takes everything off for real. */
  function takeAllOff() {
    setPreview({});
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

  /** Make the database match the preview. */
  async function act() {
    if (!dirty || acting.current) return;
    acting.current = true;
    setBusy(true);
    setMessage(null);
    try {
      for (const c of removed) {
        if (!(await unequip(c))) {
          setMessage({ key: "errors.generic", good: false });
          return;
        }
      }
      let boughtName: string | null = null;
      let boughtWorn = true;
      for (const c of added) {
        if (!ownedSet.has(c.id)) {
          const { data, error } = await supabase.rpc("buy_costume", { p_costume_id: c.id });
          if (error) {
            setMessage({ key: `errors.${errorKey(error.message)}`, good: false });
            return;
          }
          if (typeof data === "number") setBalance(data);
          playBuy();
          setOwnedSet((s) => new Set(s).add(c.id));
          boughtName = c.name;
          // The purchase stands whatever happens next; only the "worn" claim
          // depends on the equip write landing.
          if (!(await equip(c))) boughtWorn = false;
        } else if (!(await equip(c))) {
          setMessage({ key: "errors.generic", good: false });
          return;
        }
      }
      if (boughtName) setMessage({ key: boughtWorn ? "bought" : "boughtNotWorn", params: { name: boughtName }, good: boughtWorn });
      router.refresh();
    } catch (err) {
      console.error("wardrobe action failed:", err instanceof Error ? err.message : err);
      setMessage({ key: "errors.generic", good: false });
    } finally {
      acting.current = false;
      setBusy(false);
    }
  }

  // What the one button does for the whole preview.
  let cta: CtaKind = { kind: "pick" };
  if (dirty) {
    const locked = toBuy.find((c) => isLevelLocked(c, playerLevel));
    const upcoming = toBuy.find((c) => isUpcoming(c, now) && c.availableFrom);
    if (toBuy.length === 0) cta = added.length ? { kind: "wear" } : { kind: "takeOff", n: removed.length };
    else if (isAdmin) cta = { kind: "claimAdmin" };
    else if (locked) cta = { kind: "locked", level: locked.minPlayerLevel ?? 0 };
    else if (upcoming) cta = { kind: "upcoming", date: upcoming.availableFrom! };
    else if (balance < buyTotal) cta = { kind: "needMore", n: buyTotal - balance };
    else cta = buyTotal === 0 ? { kind: "claim" } : { kind: "buy", price: buyTotal };
  }

  return {
    now,
    balance,
    ownedSet,
    worn,
    wornIds,
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
    takeAllOff,
    act,
  };
}
