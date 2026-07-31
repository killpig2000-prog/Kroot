export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export const LEVEL_ORDER: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const LEVEL_PATH: Record<CefrLevel, { icon: string; treeName: string; blurb: string }> = {
  A1: { icon: "🌰", treeName: "Tiny Seed", blurb: "Tucked in the soil, waiting to sprout. Every tree starts here!" },
  A2: { icon: "🌱", treeName: "Little Sprout", blurb: "First leaves are out! Keep the water coming." },
  B1: { icon: "🪴", treeName: "Young Tree", blurb: "Sturdy roots, growing branches. Fruit comes at C2!" },
  B2: { icon: "🌳", treeName: "Growing Tree", blurb: "Reaching higher every day — full and leafy now." },
  C1: { icon: "🌸", treeName: "Blossoming Tree", blurb: "Blossoms mean you're close — almost native-level Korean." },
  C2: { icon: "🍎", treeName: "Fruit Tree", blurb: "Full bloom, full fruit. Near-native mastery — amazing work!" },
};

export function nextLevel(level: CefrLevel): CefrLevel | null {
  const i = LEVEL_ORDER.indexOf(level);
  return i >= 0 && i < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[i + 1] : null;
}
