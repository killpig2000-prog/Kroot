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

// What KIND of tree you are — driven by the CEFR grade (skill), while the
// numeric player level drives the growth stage (effort). Passing a promotion
// test visibly transforms the garden: each grade is a different Korean tree,
// following the seasons from early-spring azalea to evergreen pine.
export type TreeSpecies = {
  /** UI name (English-first chrome; krName is learning content). */
  name: string;
  krName: string;
  emoji: string;
  /** Canopy fills: [main, side lobes, crown top]. */
  canopy: [string, string, string];
  /** Blossom/fruit accent colors. */
  petal: string;
  petal2: string;
  center: string;
  /** Face + detail ink that stays legible on this canopy. */
  ink: string;
  /** Which ornament the tree wears from the blossoming stage on. */
  deco: "blossom" | "persimmon" | "ginkgo" | "pine";
  /** Round broadleaf canopy or layered conifer silhouette. */
  shape: "round" | "conifer";
  blurb: string;
};

export const SPECIES: Record<CefrLevel, TreeSpecies> = {
  A1: {
    name: "Azalea", krName: "진달래", emoji: "🌺",
    canopy: ["#88C9A0", "#9AD3AE", "#79BD92"],
    petal: "#F472B6", petal2: "#F9A8D4", center: "#FDE047",
    ink: "#2E5B41", deco: "blossom", shape: "round",
    blurb: "The first pink of early spring — every garden starts here.",
  },
  A2: {
    name: "Forsythia", krName: "개나리", emoji: "🌼",
    canopy: ["#A9C86A", "#C0D687", "#97B957"],
    petal: "#FACC15", petal2: "#FDE047", center: "#FFF8C4",
    ink: "#3F4D1C", deco: "blossom", shape: "round",
    blurb: "Bright yellow along every wall — spring is picking up speed.",
  },
  B1: {
    name: "Cherry Blossom", krName: "벚나무", emoji: "🌸",
    canopy: ["#F4B8D0", "#FBCFE8", "#EFA6C4"],
    petal: "#FFFFFF", petal2: "#FFE4EF", center: "#FDE047",
    ink: "#9D2463", deco: "blossom", shape: "round",
    blurb: "The whole canopy turns to petals — peak spring.",
  },
  B2: {
    name: "Persimmon", krName: "감나무", emoji: "🍊",
    canopy: ["#5FA97C", "#74B78E", "#4F9970"],
    petal: "#FB923C", petal2: "#F97316", center: "#FFD66B",
    ink: "#1F4630", deco: "persimmon", shape: "round",
    blurb: "Autumn's reward — your skill is bearing fruit.",
  },
  C1: {
    name: "Ginkgo", krName: "은행나무", emoji: "🍂",
    canopy: ["#F5C824", "#FAD95A", "#EBB914"],
    petal: "#FFF3BF", petal2: "#E8940A", center: "#F59E0B",
    ink: "#713F12", deco: "ginkgo", shape: "round",
    blurb: "A golden avenue tree that lives a thousand years.",
  },
  C2: {
    name: "Pine", krName: "소나무", emoji: "🌲",
    canopy: ["#2F7D53", "#3D8F63", "#286B47"],
    petal: "#8A6B4A", petal2: "#A9865E", center: "#FFD66B",
    ink: "#12301F", deco: "pine", shape: "conifer",
    blurb: "Evergreen through every season — the highest grade.",
  },
};

export function nextLevel(level: CefrLevel): CefrLevel | null {
  const i = LEVEL_ORDER.indexOf(level);
  return i >= 0 && i < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[i + 1] : null;
}
