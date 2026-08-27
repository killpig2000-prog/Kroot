"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import LevelCreature from "@/components/dashboard/LevelCreature";
import {
  COSTUMES,
  GARDEN_SLOTS,
  RARITY_LABEL,
  SLOT_LABELS,
  SceneLayer,
  WEARABLE_SLOTS,
  costumeById,
  isAvailable,
  isLevelLocked,
  skyFor,
  type Costume,
  type CostumeSlot,
  type Rarity,
} from "@/lib/costumes";
import type { CefrLevel } from "@/lib/tree";
import { SPECIES } from "@/lib/tree";

const DEFAULT_SKY = "linear-gradient(180deg,#DFF1FF 0%,#F0FBF1 62%,#E4F3DA 100%)";
const RARITY_STYLE: Record<Rarity, { stripe: string; chip: string }> = {
  common: { stripe: "#B7AE9C", chip: "bg-[#FAF7EF] text-[#6B6560]" },
  rare: { stripe: "#2563EB", chip: "bg-[#EFF6FF] text-[#2563EB]" },
  epic: { stripe: "#7C3AED", chip: "bg-[#F5F3FF] text-[#7C3AED]" },
  legendary: { stripe: "#C2410C", chip: "bg-[#FFF7ED] text-[#C2410C]" },
};
const TABS: CostumeSlot[] = [...WEARABLE_SLOTS, ...GARDEN_SLOTS];

function friendlyError(raw: string): string {
  if (raw.includes("not enough coins")) return "Not enough coins.";
  if (raw.includes("already owned")) return "You already own this.";
  if (raw.includes("level too low")) return "Your tree isn't tall enough yet.";
  if (raw.includes("plus required")) return "This one is for Kroot Plus members.";
  if (raw.includes("not available")) return "This item isn't on sale right now.";
  return "Something went wrong — try again.";
}

/** The tree with a set of costumes, exactly as TreeCard draws it. */
function Scene({ ids, stage, species, className }: { ids: string[]; stage: CefrLevel; species: CefrLevel; className?: string }) {
  const sky = skyFor(ids);
  return (
    <div className={className} style={{ background: sky ?? DEFAULT_SKY }}>
      <svg viewBox="0 0 220 230" className="w-full h-full block" aria-hidden="true">
        <ellipse cx="110" cy="234" rx="150" ry="34" fill="#CDE8C2" />
        <SceneLayer costumeIds={ids} layer="behind" />
        {!sky && (
          <>
            <circle cx="182" cy="34" r="12" fill="#FFDE7A" />
            <g fill="#FFFFFF" opacity=".85">
              <ellipse cx="46" cy="36" rx="16" ry="6" />
              <ellipse cx="60" cy="32" rx="11" ry="5" />
            </g>
          </>
        )}
        <LevelCreature level={stage} costumeIds={ids} species={species} />
        <SceneLayer costumeIds={ids} layer="front" />
      </svg>
    </div>
  );
}

function daysLeft(until: string, today: string): number {
  return Math.max(0, Math.round((Date.parse(until) - Date.parse(today)) / 86_400_000));
}

export default function ShopClient({
  userId,
  coins,
  playerLevel,
  hasPlus,
  species,
  stage,
  owned,
  equipped,
  today,
}: {
  userId: string;
  coins: number;
  playerLevel: number;
  hasPlus: boolean;
  species: CefrLevel;
  stage: CefrLevel;
  owned: string[];
  equipped: string[];
  today: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const now = useMemo(() => new Date(today), [today]);

  const [tab, setTab] = useState<CostumeSlot>("aura");
  const [balance, setBalance] = useState(coins);
  const [ownedSet, setOwnedSet] = useState(() => new Set(owned));
  const toMap = (ids: string[]) => {
    const m: Partial<Record<CostumeSlot, string>> = {};
    for (const id of ids) {
      const c = costumeById(id);
      if (c) m[c.slot] = id;
    }
    return m;
  };
  const [worn, setWorn] = useState<Partial<Record<CostumeSlot, string>>>(() => toMap(equipped));
  const [preview, setPreview] = useState<Partial<Record<CostumeSlot, string>>>(() => toMap(equipped));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const previewIds = Object.values(preview).filter((v): v is string => !!v);
  const visible = COSTUMES.filter((c) => c.slot === tab && (isAvailable(c, now) || ownedSet.has(c.id)));
  const featured = COSTUMES.find(
    (c) => c.availableUntil && isAvailable(c, now) && daysLeft(c.availableUntil, today) <= 14 && !ownedSet.has(c.id),
  );
  const selected = preview[tab] ? costumeById(preview[tab]!) : undefined;

  function toggle(c: Costume) {
    setMessage(null);
    setPreview((p) => (p[c.slot] === c.id ? { ...p, [c.slot]: undefined } : { ...p, [c.slot]: c.id }));
  }

  async function equip(c: Costume) {
    await supabase.from("user_costumes").update({ equipped: false }).eq("user_id", userId).eq("slot", c.slot);
    await supabase.from("user_costumes").update({ equipped: true }).eq("user_id", userId).eq("costume_id", c.id);
    setWorn((w) => ({ ...w, [c.slot]: c.id }));
  }

  async function unequip(c: Costume) {
    await supabase.from("user_costumes").update({ equipped: false }).eq("user_id", userId).eq("costume_id", c.id);
    setWorn((w) => ({ ...w, [c.slot]: undefined }));
  }

  async function act() {
    if (!selected || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      if (ownedSet.has(selected.id)) {
        if (worn[selected.slot] === selected.id) await unequip(selected);
        else await equip(selected);
      } else {
        const { data, error } = await supabase.rpc("buy_costume", { p_costume_id: selected.id });
        if (error) {
          setMessage(friendlyError(error.message));
          return;
        }
        if (typeof data === "number") setBalance(data);
        setOwnedSet((s) => new Set(s).add(selected.id));
        await equip(selected);
        setMessage(`${selected.name} is yours — and on your tree.`);
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  // What the main button does for the item picked in this tab.
  let cta: { label: string; disabled?: boolean; href?: string } = { label: "Pick an item", disabled: true };
  if (selected) {
    const isOwned = ownedSet.has(selected.id);
    if (isOwned) cta = { label: worn[selected.slot] === selected.id ? "Take off" : "Wear it" };
    else if (selected.plusOnly && !hasPlus) cta = { label: "Kroot Plus only · See plans", href: "/pricing" };
    else if (isLevelLocked(selected, playerLevel)) cta = { label: `Unlocks at Lv.${selected.minPlayerLevel}`, disabled: true };
    else if (balance < selected.price) cta = { label: `Need ${selected.price - balance} more 🌰`, disabled: true };
    else cta = { label: selected.price === 0 ? "Claim & wear" : `Buy & wear · 🌰 ${selected.price}` };
  }

  return (
    <div className="border border-[#E3DDD0] rounded-[14px] bg-white overflow-hidden max-w-[1040px]">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* ── catalog ── */}
        <div className="p-4 sm:p-5 min-w-0">
          {featured && featured.availableUntil && (
            <button
              type="button"
              onClick={() => {
                setTab(featured.slot);
                setPreview((p) => ({ ...p, [featured.slot]: featured.id }));
              }}
              className="w-full text-left grid grid-cols-[auto_1fr_auto] gap-3.5 items-center border border-[#F3D98A] rounded-[10px] px-3.5 py-3 mb-3.5 transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(90deg,#FFF8E6,transparent)" }}
            >
              <span className="w-14 h-14 rounded-[10px] overflow-hidden flex-none">
                <Scene ids={[featured.id]} stage={stage} species={species} className="w-full h-full" />
              </span>
              <span className="min-w-0">
                <b className="block text-[14px] truncate">
                  This week only · {featured.name} <span className="kr text-[#6B6560] font-semibold">{featured.krName}</span>
                </b>
                <small className="block text-[12.5px] text-[#6B6560]">
                  {RARITY_LABEL[featured.rarity]} {SLOT_LABELS[featured.slot].en.toLowerCase()} · 🌰 {featured.price}
                  {featured.minPlayerLevel ? ` · needs Lv.${featured.minPlayerLevel}` : ""} · gone after {featured.availableUntil}
                </small>
              </span>
              <span className="text-[11.5px] font-extrabold tracking-[.04em] uppercase text-[#C2410C] whitespace-nowrap">
                {daysLeft(featured.availableUntil, today)}d left
              </span>
            </button>
          )}

          <div className="flex gap-1.5 overflow-x-auto pb-1.5 mb-3 -mx-1 px-1" role="tablist" aria-label="Item categories">
            {TABS.map((slot) => {
              const on = slot === tab;
              const isNew = GARDEN_SLOTS.includes(slot);
              return (
                <button
                  key={slot}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => {
                    setTab(slot);
                    setMessage(null);
                  }}
                  className={`flex-none flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold border transition-colors ${
                    on ? "bg-[#18181B] text-white border-[#18181B]" : "bg-white text-[#6B6560] border-[#E3DDD0] hover:border-[#A19A8C]"
                  }`}
                >
                  <span aria-hidden="true">{SLOT_LABELS[slot].icon}</span>
                  {SLOT_LABELS[slot].en}
                  {isNew && (
                    <span className={`text-[9.5px] font-extrabold tracking-[.06em] rounded-full px-1.5 py-px ${on ? "bg-[#B7791F] text-white" : "bg-[#C2410C] text-white"}`}>
                      NEW
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
            {visible.map((c) => {
              const on = preview[c.slot] === c.id;
              const isOwned = ownedSet.has(c.id);
              const locked = isLevelLocked(c, playerLevel);
              const ids = Object.values({ ...preview, [c.slot]: c.id }).filter((v): v is string => !!v);
              const rs = RARITY_STYLE[c.rarity];
              let price: React.ReactNode;
              if (isOwned) price = <span className="text-[12.5px] font-extrabold text-[#16A34A]">{worn[c.slot] === c.id ? "Wearing ✓" : "Owned"}</span>;
              else if (c.plusOnly) price = <span className="text-[12.5px] font-extrabold text-[#B7791F]">🌟 Plus</span>;
              else if (locked) price = <span className="text-[12.5px] font-extrabold text-[#B7AE9C]">🔒 Lv.{c.minPlayerLevel}</span>;
              else price = <span className="text-[12.5px] font-extrabold tabular-nums">🌰 {c.price}</span>;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggle(c)}
                  aria-pressed={on}
                  className={`relative text-left border rounded-[12px] overflow-hidden bg-white transition-all hover:-translate-y-0.5 ${
                    on ? "border-[#16A34A] shadow-[0_0_0_2px_#BBF7D0]" : "border-[#E3DDD0] hover:border-[#A19A8C]"
                  }`}
                >
                  <span className="absolute left-0 top-0 bottom-0 w-[3px] z-10" style={{ background: rs.stripe }} aria-hidden="true" />
                  <Scene ids={ids} stage={stage} species={species} className="h-[96px]" />
                  <span className="block px-2.5 pt-2 pb-2.5">
                    <b className="block text-[13px] leading-tight">{c.name}</b>
                    <small className="block kr text-[11.5px] text-[#6B6560]">{c.krName}</small>
                    <span className="flex items-center justify-between gap-1.5 mt-1.5">
                      <span className={`text-[10px] font-extrabold tracking-[.06em] uppercase rounded px-1.5 py-px ${rs.chip}`}>{RARITY_LABEL[c.rarity]}</span>
                      {price}
                    </span>
                  </span>
                </button>
              );
            })}
            {visible.length === 0 && (
              <p className="col-span-full text-[13px] text-[#6B6560] py-6 text-center">Nothing on sale here right now — check back next season.</p>
            )}
          </div>
        </div>

        {/* ── try-on ── */}
        <aside className="order-first lg:order-none border-b lg:border-b-0 lg:border-l border-[#E3DDD0] bg-[#FAF7EF] p-4 lg:sticky lg:top-4 self-start">
          <p className="text-[11.5px] font-extrabold tracking-[.08em] uppercase text-[#B7AE9C] mb-2">Try on · 내 나무</p>
          <figure className="relative m-0 mx-auto max-w-[230px] bg-white border border-[#E3DDD0] p-1.5 pb-6 rotate-[1deg] shadow-[0_10px_22px_-12px_rgba(60,50,30,.35)] mb-3">
            <Scene ids={previewIds} stage={stage} species={species} className="px-2.5 pt-2.5" />
            <figcaption className="absolute bottom-1 left-0 right-0 text-center text-[10px] font-bold text-[#8A8478]">
              <span className="kr">{SPECIES[species].krName}</span> · Lv. {playerLevel}
            </figcaption>
          </figure>

          <div className="grid grid-cols-2 gap-1.5 text-[12px]">
            {TABS.map((slot) => {
              const it = preview[slot] ? costumeById(preview[slot]!) : undefined;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTab(slot)}
                  className={`text-left border rounded-lg px-2 py-1.5 ${it ? "border-[#BBF7D0] bg-[#F0FDF4]" : "border-[#E3DDD0] bg-white"} ${slot === tab ? "ring-2 ring-[#BBF7D0]" : ""}`}
                >
                  <small className="block text-[10px] tracking-[.06em] uppercase text-[#B7AE9C] font-extrabold">{SLOT_LABELS[slot].en}</small>
                  <b className="block text-[12px] truncate">{it ? it.name : "—"}</b>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 mt-3">
            {cta.href ? (
              <Link href={cta.href} className="flex-1 text-center rounded-[10px] px-3 py-2.5 text-[13px] font-extrabold text-white bg-[#B7791F] hover:bg-[#92400E] transition-colors">
                {cta.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={act}
                disabled={busy || cta.disabled}
                className="flex-1 rounded-[10px] px-3 py-2.5 text-[13px] font-extrabold text-white bg-[#18181B] hover:bg-[#3F3F46] transition-colors disabled:opacity-50"
              >
                {busy ? "…" : cta.label}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setPreview(worn);
                setMessage(null);
              }}
              className="rounded-[10px] px-3 py-2.5 text-[13px] font-extrabold border border-[#E3DDD0] bg-white hover:border-[#A19A8C] transition-colors"
            >
              Reset
            </button>
          </div>
          <p className={`text-[11.5px] mt-2 text-center ${message?.includes("yours") ? "text-[#16A34A] font-semibold" : "text-[#6B6560]"}`}>
            {message ?? (selected ? `${selected.name} · ${selected.krName}` : "Tap a card to try it on")}
          </p>
          <p className="text-[11.5px] text-[#6B6560] mt-3 text-center">
            🌰 {balance} coins · earn 10 per daily quest, 50 at every 10th level
          </p>
        </aside>
      </div>
    </div>
  );
}
