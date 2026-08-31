"use client";

import { useMemo, useRef, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
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
import ShopGoal, { useStoredGoal, writeStoredGoal } from "@/components/shop/ShopGoal";

const DEFAULT_SKY = "linear-gradient(180deg,#DFF1FF 0%,#F0FBF1 62%,#E4F3DA 100%)";
const RARITY_STYLE: Record<Rarity, { stripe: string; chip: string }> = {
  common: { stripe: "#B7AE9C", chip: "bg-warm text-muted" },
  rare: { stripe: "#3363CC", chip: "bg-[var(--tint-sky)] text-sky-deep" },
  epic: { stripe: "#6B33CC", chip: "bg-[var(--tint-violet)] text-[#6B33CC]" },
  legendary: { stripe: "#B14F27", chip: "bg-[var(--tint-amber)] text-[#B14F27]" },
};
const TABS: CostumeSlot[] = [...WEARABLE_SLOTS, ...GARDEN_SLOTS];

function friendlyError(raw: string): string {
  if (raw.includes("not enough coins")) return "Not enough coins.";
  if (raw.includes("already owned")) return "You already own this.";
  if (raw.includes("level too low")) return "Your tree isn't tall enough yet.";
  // Kroot Plus is gone, but buy_costume() still raises this for any catalog row
  // left with plus_only = true. Until migration 0042 clears those rows the error
  // is still reachable, so it needs copy that doesn't sell a tier we removed.
  if (raw.includes("plus required")) return "This one isn't available right now.";
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
  isAdmin = false,
  playerLevel,
  species,
  stage,
  owned,
  equipped,
  today,
  questDone = false,
}: {
  userId: string;
  coins: number;
  isAdmin?: boolean;
  playerLevel: number;
  species: CefrLevel;
  stage: CefrLevel;
  owned: string[];
  equipped: string[];
  today: string;
  questDone?: boolean;
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

  // ── coin goal ──
  // A user-picked goal lives in localStorage only (null until hydrated, so
  // server and client agree). Without one, the goal defaults to the cheapest
  // unlocked, unowned item the balance doesn't yet cover.
  const goalOverride = useStoredGoal();
  const pickerRef = useRef<HTMLDetailsElement>(null);
  function setGoal(id: string | null) {
    writeStoredGoal(id);
    pickerRef.current?.removeAttribute("open");
  }

  const previewIds = Object.values(preview).filter((v): v is string => !!v);
  const visible = COSTUMES.filter((c) => c.slot === tab && (isAvailable(c, now) || ownedSet.has(c.id)));
  const featured = COSTUMES.find(
    (c) => c.availableUntil && isAvailable(c, now) && daysLeft(c.availableUntil, today) <= 14 && !ownedSet.has(c.id),
  );
  const selected = preview[tab] ? costumeById(preview[tab]!) : undefined;

  // Anything you could save coins for: on sale, unowned, has a price.
  const goalCandidates = COSTUMES.filter((c) => !ownedSet.has(c.id) && c.price > 0 && isAvailable(c, now)).sort(
    (a, b) => a.price - b.price,
  );
  const defaultGoal = goalCandidates.find((c) => !isLevelLocked(c, playerLevel) && c.price > balance);
  const overrideGoal = goalOverride ? goalCandidates.find((c) => c.id === goalOverride) : undefined;
  // A stored goal that was since bought (or left the catalog) is ignored and
  // the default takes over; buying the goal item clears the stored id below.
  const goal = overrideGoal ?? defaultGoal ?? null;

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
        if (goalOverride === selected.id) writeStoredGoal(null);
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
    else if (isAdmin) cta = { label: "Claim & wear · admin" };
    else if (isLevelLocked(selected, playerLevel)) cta = { label: `Unlocks at Lv.${selected.minPlayerLevel}`, disabled: true };
    else if (balance < selected.price) cta = { label: `Need ${selected.price - balance} more 🌰`, disabled: true };
    else cta = { label: selected.price === 0 ? "Claim & wear" : `Buy & wear · 🌰 ${selected.price}` };
  }

  return (
    <div className="border border-line rounded-[14px] bg-cream overflow-hidden max-w-[1040px]">
      <ShopGoal
        goal={goal}
        balance={balance}
        isAdmin={isAdmin}
        playerLevel={playerLevel}
        locked={goal ? isLevelLocked(goal, playerLevel) : false}
        questDone={questDone}
        preview={goal ? <Scene ids={[goal.id]} stage={stage} species={species} className="w-full h-full" /> : null}
        picker={
          goalCandidates.length > 0 ? (
            <details ref={pickerRef} className="relative inline-block">
              <summary className="list-none cursor-pointer select-none text-[12px] font-bold text-faint hover:text-charcoal [&::-webkit-details-marker]:hidden">
                Change ▾
              </summary>
              <div className="absolute left-0 top-full mt-1 z-20 w-[250px] max-h-[264px] overflow-y-auto bg-cream border border-line rounded-[10px] shadow-[0_10px_22px_-12px_rgba(60,50,30,.35)] p-1">
                {goalOverride && (
                  <button
                    type="button"
                    onClick={() => setGoal(null)}
                    className="w-full text-left rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-muted hover:bg-warm"
                  >
                    Cheapest next item (auto)
                  </button>
                )}
                {goalCandidates.map((c) => {
                  const isGoal = goal?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setGoal(c.id)}
                      className={`w-full text-left flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] hover:bg-warm ${isGoal ? "bg-success-bg" : ""}`}
                    >
                      <span aria-hidden="true">{c.icon ?? SLOT_LABELS[c.slot].icon}</span>
                      <span className="flex-1 min-w-0 truncate font-semibold">{c.name}</span>
                      <span className="text-muted tabular-nums whitespace-nowrap">
                        🌰 {c.price}
                        {isLevelLocked(c, playerLevel) ? ` · Lv.${c.minPlayerLevel}` : ""}
                      </span>
                      {isGoal && <span className="text-success font-extrabold">✓</span>}
                    </button>
                  );
                })}
              </div>
            </details>
          ) : null
        }
        onBuyNow={() => {
          if (!goal) return;
          setTab(goal.slot);
          setPreview((p) => ({ ...p, [goal.slot]: goal.id }));
          setMessage(null);
        }}
      />
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
              className="w-full text-left grid grid-cols-[auto_1fr_auto] gap-3.5 items-center border border-amber-line rounded-[10px] px-3.5 py-3 mb-3.5 transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(90deg,#FFF8E6,transparent)" }}
            >
              <span className="w-14 h-14 rounded-[10px] overflow-hidden flex-none">
                <Scene ids={[featured.id]} stage={stage} species={species} className="w-full h-full" />
              </span>
              <span className="min-w-0">
                <span className="block text-[10.5px] font-extrabold tracking-[.06em] uppercase text-[#B14F27]">
                  This week only
                </span>
                <b className="block text-[14px] truncate">
                  {featured.name} <span className="kr text-muted font-semibold">{featured.krName}</span>
                </b>
                <small className="block text-[12.5px] text-muted">
                  {RARITY_LABEL[featured.rarity]} {SLOT_LABELS[featured.slot].en.toLowerCase()} · 🌰 {featured.price}
                  {featured.minPlayerLevel ? ` · needs Lv.${featured.minPlayerLevel}` : ""} · gone after {featured.availableUntil}
                </small>
              </span>
              <span className="text-[11.5px] font-extrabold tracking-[.04em] uppercase text-[#B14F27] whitespace-nowrap">
                {daysLeft(featured.availableUntil, today)}d left
              </span>
            </button>
          )}

          {/* right-edge fade hints that the category row scrolls sideways */}
          <div className="relative mb-3 after:content-[''] after:pointer-events-none after:absolute after:top-0 after:bottom-1.5 after:right-0 after:w-12 after:bg-gradient-to-l after:from-white after:to-transparent">
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 -mx-1 px-1 pr-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Item categories">
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
                    on ? "bg-charcoal text-cream border-charcoal" : "bg-cream text-muted border-line hover:border-faint"
                  }`}
                >
                  <span aria-hidden="true">{SLOT_LABELS[slot].icon}</span>
                  {SLOT_LABELS[slot].en}
                  {isNew && (
                    <span className={`text-[9.5px] font-extrabold tracking-[.06em] rounded-full px-1.5 py-px ${on ? "bg-[#B7791F] text-white" : "bg-[#B14F27] text-white"}`}>
                      NEW
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
            {visible.map((c) => {
              const on = preview[c.slot] === c.id;
              const isOwned = ownedSet.has(c.id);
              const locked = isLevelLocked(c, playerLevel);
              const ids = Object.values({ ...preview, [c.slot]: c.id }).filter((v): v is string => !!v);
              const rs = RARITY_STYLE[c.rarity];
              let price: React.ReactNode;
              if (isOwned) price = <span className="text-[12.5px] font-extrabold text-success">{worn[c.slot] === c.id ? "Wearing ✓" : "Owned"}</span>;
              else if (locked) price = <span className="text-[12.5px] font-extrabold text-[#B7AE9C]">🔒 Lv.{c.minPlayerLevel}</span>;
              else price = <span className="text-[12.5px] font-extrabold tabular-nums">🌰 {c.price}</span>;
              // Only items you could save for get the goal control.
              const goalable = !isOwned && !isAdmin && c.price > 0;
              const isGoal = goalable && goal?.id === c.id;
              const toGo = Math.max(0, c.price - balance);
              return (
                <div
                  key={c.id}
                  className={`relative flex flex-col border rounded-[12px] overflow-hidden bg-cream transition-all hover:-translate-y-0.5 ${
                    on ? "border-success shadow-[0_0_0_2px_#BBF7D0]" : "border-line hover:border-faint"
                  }`}
                >
                  <span className="absolute left-0 top-0 bottom-0 w-[3px] z-10" style={{ background: rs.stripe }} aria-hidden="true" />
                  <button type="button" onClick={() => toggle(c)} aria-pressed={on} className="block w-full text-left">
                    <Scene ids={ids} stage={stage} species={species} className="h-[96px]" />
                    <span className="block px-2.5 pt-2 pb-2.5">
                      <b className="block text-[13px] leading-tight">{c.name}</b>
                      <small className="block kr text-[11.5px] text-muted">{c.krName}</small>
                      <span className="flex items-center justify-between gap-1.5 mt-1.5">
                        <span className={`text-[10px] font-extrabold tracking-[.06em] uppercase rounded px-1.5 py-px ${rs.chip}`}>{RARITY_LABEL[c.rarity]}</span>
                        {price}
                      </span>
                    </span>
                  </button>
                  {goalable && (
                    <span className="block px-2.5 pb-2 -mt-1 text-[11px] leading-tight">
                      {isGoal ? (
                        <span className="font-bold text-[#B7791F]">
                          · your goal · {toGo > 0 ? `${toGo} to go` : "ready to buy"}
                          {locked ? ` · Lv.${c.minPlayerLevel}` : ""}
                        </span>
                      ) : (
                        <button type="button" onClick={() => setGoal(c.id)} className="font-bold text-faint hover:text-charcoal transition-colors">
                          Set as goal
                        </button>
                      )}
                    </span>
                  )}
                </div>
              );
            })}
            {visible.length === 0 && (
              <p className="col-span-full text-[13px] text-muted py-6 text-center">Nothing on sale here right now — check back next season.</p>
            )}
          </div>
        </div>

        {/* ── try-on ── */}
        <aside className="order-first lg:order-none border-b lg:border-b-0 lg:border-l border-line bg-warm p-4 lg:sticky lg:top-4 self-start">
          <p className="text-[11.5px] font-extrabold tracking-[.08em] uppercase text-[#B7AE9C] mb-2">Try on · your tree</p>
          <figure className="relative m-0 mx-auto max-w-[230px] bg-cream border border-line p-1.5 pb-6 rotate-[1deg] shadow-[0_10px_22px_-12px_rgba(60,50,30,.35)] mb-3">
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
                  className={`text-left border rounded-lg px-2 py-1.5 ${it ? "border-success-line bg-success-bg" : "border-line bg-cream"} ${slot === tab ? "ring-2 ring-success-line" : ""}`}
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
                className="flex-1 rounded-[10px] px-3 py-2.5 text-[13px] font-extrabold text-white bg-success hover:bg-success-deep transition-colors disabled:opacity-50"
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
              className="rounded-[10px] px-3 py-2.5 text-[13px] font-extrabold border border-line bg-cream hover:border-faint transition-colors"
            >
              Reset
            </button>
          </div>
          <p className={`text-[11.5px] mt-2 text-center ${message?.includes("yours") ? "text-success font-semibold" : "text-muted"}`}>
            {message ?? (selected ? `${selected.name} · ${selected.krName}` : "Tap a card to try it on")}
          </p>
        </aside>
      </div>
    </div>
  );
}
