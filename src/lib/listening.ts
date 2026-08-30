export type Situation = {
  key: string;
  label: string;
  krLabel: string;
  icon: string;
  /** One-line blurb under the situation name. */
  sub: string;
  /** Flat pastel card fill — the situation's colour everywhere it appears. */
  tint: string;
};

export const SITUATIONS: Situation[] = [
  { key: "cafe", label: "Cafe", krLabel: "카페", icon: "☕", sub: "Ordering, menus, and small talk over coffee", tint: "#F6DFA4" },
  { key: "restaurant", label: "Restaurant", krLabel: "식당", icon: "🍽️", sub: "Reserving tables and ordering real meals", tint: "#F7C6B3" },
  { key: "airport", label: "Airport", krLabel: "공항", icon: "✈️", sub: "Check-in, boarding, and customs phrases", tint: "#C9E3EC" },
  { key: "shopping", label: "Shopping", krLabel: "쇼핑", icon: "🛍️", sub: "Sizes, prices, and asking for a discount", tint: "#F5C9D7" },
  { key: "directions", label: "Directions", krLabel: "길찾기", icon: "🗺️", sub: "Finding your way around any city", tint: "#D9D0F0" },
  { key: "hospital", label: "Hospital", krLabel: "병원", icon: "🏥", sub: "Symptoms, appointments, and the pharmacy", tint: "#C9D9EE" },
  { key: "hotel", label: "Hotel", krLabel: "호텔", icon: "🏨", sub: "Check-in, room requests, and amenities", tint: "#C6E6D2" },
  { key: "phone", label: "Phone Call", krLabel: "전화", icon: "📞", sub: "Calls you'll actually have to make", tint: "#F8D3C8" },
];

export function situationByKey(key: string) {
  return SITUATIONS.find((s) => s.key === key);
}

/**
 * Deterministic "waveform" bar heights (0.3–0.95) for a clip, so the same
 * clip always draws the same shape without any audio analysis.
 */
export function waveHeights(seed: string, count: number): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    out.push(0.3 + ((h >>> 0) % 66) / 100);
  }
  return out;
}
