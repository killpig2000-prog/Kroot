import { LEVEL_ORDER, isCefrLevel, type CefrLevel } from "@/lib/tree";

// The starting level is self-reported: three "which sounds like you?"
// questions, each answered with a level. The learner can still pick any level
// on the result card, and change it later in Settings.
export type SurveyKey = "reading" | "listening" | "speaking";
export const SURVEY_KEYS: SurveyKey[] = ["reading", "listening", "speaking"];

/** The middle answer (lower-middle for an even count), so one outlier can't move the suggestion. */
export function suggestLevel(answers: CefrLevel[]): CefrLevel {
  if (answers.length === 0) return "A1";
  const sorted = [...answers].sort((a, b) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b));
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

// ---------------------------------------------------------------------------
// Placement: what the whole onboarding produces. Survives the sign-up round
// trip (OAuth redirect, magic link opened in another tab) as a compact string
// in the callback URL, with sessionStorage as a same-tab backup.
// ---------------------------------------------------------------------------

export type Goal = "drama" | "kpop" | "travel" | "work" | "family" | "curious";
export type LeadSkill = "listening" | "words" | "grammar";

export const GOALS: { key: Goal; icon: string; label: string; lead: LeadSkill; hint: string }[] = [
  { key: "drama", icon: "📺", label: "K-drama & variety", lead: "listening", hint: "Listening first" },
  { key: "kpop", icon: "🎧", label: "K-pop lyrics", lead: "words", hint: "Words first" },
  { key: "travel", icon: "✈️", label: "Travel to Korea", lead: "listening", hint: "Survival phrases" },
  { key: "work", icon: "💼", label: "Work or study", lead: "grammar", hint: "Grammar first" },
  { key: "family", icon: "💛", label: "Family or partner", lead: "listening", hint: "Everyday talk" },
  { key: "curious", icon: "🌱", label: "Just curious", lead: "grammar", hint: "A balanced mix" },
];

export function isGoal(v: unknown): v is Goal {
  return typeof v === "string" && GOALS.some((g) => g.key === v);
}

export type Route = "hangul" | CefrLevel;

export type Placement = {
  level: CefrLevel;
  route: Route;
  canRead: boolean;
  goal: Goal | null;
  /** True when the survey wasn't answered (can't read Hangul, or skipped). */
  skipped: boolean;
  /** The level the survey suggested; null when it wasn't answered. */
  suggested: CefrLevel | null;
};

export function surveyPlacement(level: CefrLevel, suggested: CefrLevel | null, goal: Goal | null): Placement {
  return { level, route: level, canRead: true, goal, skipped: suggested === null, suggested };
}

export function skippedPlacement(canRead: boolean, goal: Goal | null): Placement {
  return { level: "A1", route: canRead ? "A1" : "hangul", canRead, goal, skipped: true, suggested: null };
}

function toBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodePlacement(p: Placement): string {
  return toBase64Url(JSON.stringify(p));
}

// Tolerant on purpose: a ?p= minted by the old placement quiz (with score,
// skills and stoppedAt) can still be in a confirmation email.
export function decodePlacement(raw: string | null | undefined): Placement | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(fromBase64Url(raw)) as Partial<Placement>;
    if (!isCefrLevel(p.level)) return null;
    const route: Route = p.route === "hangul" ? "hangul" : isCefrLevel(p.route) ? p.route : p.level;
    return {
      level: p.level,
      route,
      canRead: p.canRead !== false,
      goal: isGoal(p.goal) ? p.goal : null,
      skipped: !!p.skipped,
      suggested: isCefrLevel(p.suggested ?? undefined) ? (p.suggested as CefrLevel) : null,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// First lessons: the three units a placed learner sees on the result card.
// The map is built server-side (first-lessons.ts) from the real content
// tables; the goal only reorders it so the learner's reason leads.
// ---------------------------------------------------------------------------

export type FirstLesson = {
  href: string;
  label: string;
  skill: "hangul" | LeadSkill;
  minutes: number;
};

export type FirstLessonsMap = Record<Route, FirstLesson[]>;

export function orderForGoal(lessons: FirstLesson[], goal: Goal | null): FirstLesson[] {
  if (!goal) return lessons;
  const lead = GOALS.find((g) => g.key === goal)?.lead;
  if (!lead) return lessons;
  // Hangul always stays first — nothing else is readable before it.
  const hangul = lessons.filter((l) => l.skill === "hangul");
  const rest = lessons.filter((l) => l.skill !== "hangul");
  return [...hangul, ...rest.filter((l) => l.skill === lead), ...rest.filter((l) => l.skill !== lead)];
}
