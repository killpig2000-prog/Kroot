export type BoardKey = "question" | "free" | "exchange";

export type CommunityPost = {
  id: string;
  // Whether the signed-in viewer wrote this post. Computed server-side so raw
  // user ids never reach the client.
  mine?: boolean;
  author_name: string;
  author_emoji: string | null;
  /** Set by a DB trigger at insert time — golden name for Plus members. */
  author_plus?: boolean;
  country: string | null;
  board: BoardKey;
  content: string;
  created_at: string;
};

export type CommunityComment = {
  id: string;
  mine?: boolean;
  author_name: string;
  author_emoji: string | null;
  author_plus?: boolean;
  content: string;
  created_at: string;
};

// Postgres raises 42P01 for a missing table, but PostgREST answers from its
// schema cache first and reports the miss as PGRST205.
export function isTableMissing(error: { code?: string } | null): boolean {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

// A post has no title column — the first line doubles as the title and the
// rest is the body.
export function splitPost(content: string): { title: string; body: string } {
  const newline = content.indexOf("\n");
  if (newline === -1) return { title: content, body: "" };
  return { title: content.slice(0, newline), body: content.slice(newline + 1).trim() };
}

export const BOARDS: { key: BoardKey; label: string; emoji: string }[] = [
  { key: "question", label: "Question board", emoji: "❓" },
  { key: "free", label: "Free board", emoji: "💬" },
  { key: "exchange", label: "Language exchange", emoji: "🤝" },
];

export function isBoardKey(value: string | undefined): value is BoardKey {
  return !!value && BOARDS.some((b) => b.key === value);
}

export function boardLabel(key: string): string {
  return BOARDS.find((b) => b.key === key)?.label ?? "Free board";
}

// Official pinned notices, defined in code so they need no admin tooling or
// DB rows. They sit above every board, get their own detail page at
// /community/<id>, and never take comments or deletes.
export type CommunityNotice = {
  /** Also the /community/[id] slug — keep it prefixed so it can't collide with a UUID. */
  id: string;
  emoji: string;
  title: string;
  body: string;
};

export const NOTICES: CommunityNotice[] = [
  {
    id: "notice-welcome",
    emoji: "🌱",
    title: "Welcome to the Kroot garden — how this community works",
    body: `Hello, learner! This is the place to grow together. A quick tour:

❓ Question board — anything about Korean: grammar, vocabulary, nuance, culture. No question is too small; today's "silly" question is exactly what ten other learners were wondering.

💬 Free board — wins, streak milestones, K-drama talk, study setups, or just saying hi. Celebrating a passed promotion test counts double.

🤝 Language exchange — find practice partners. Say your level, your time zone, and what you can offer in return.

House rules (short version): be kind, be patient, and remember everyone here is brave enough to learn a new language. Answer in the language you're comfortable with — Korean, English, or both. Corrections are welcome when they're gentle.

See you in the garden! 🌳
— The Kroot team`,
  },
  {
    id: "notice-ranking",
    emoji: "🏆",
    title: "Levels, grades & your tree — how progress works",
    body: `Two systems grow side by side, and neither can be bought — only learned.

🌳 Level (Lv 1–120) — every lesson, quiz, and review earns XP. Your tree grows through six stages as you level: seed → sprout → young tree → growing tree → blossoming → fully grown. Every tenth level also drops 50 coins for the shop.

📚 Grade (A1–C2) — your proven skill level. Hold onto enough words of your current grade (they count once they survive their first two spaced reviews), finish some reading, then pass the four-skill promotion test (70+ average, every skill 60+). Pass it and your tree transforms into a new species: azalea → forsythia → cherry blossom → persimmon → ginkgo → pine. 진달래부터 소나무까지!

Failed a promotion test? Totally normal — practice your weakest skill and retake it after 24 hours.`,
  },
  {
    id: "notice-start",
    emoji: "🧭",
    title: "New to Korean? Start here",
    body: `The path that works, in order:

1. Hangul first (1–2 days) — the alphabet takes an afternoon, not a year. Do the Hangul module until you can sound out any word, even slowly.

2. The 16-Day Course — one short lesson a day: Hangul rules, core grammar, and your first real sentences. It auto-advances, so just show up.

3. Water your tree daily — the Review tab resurfaces words right before you'd forget them (spaced repetition). Five minutes a day beats two hours on Sunday.

4. Add one skill at a time — Listening and Reading first, then Writing and Speaking when you're comfortable. The AI teacher grades your writing and speaking with feedback.

5. Keep the streak — your tree notices. 화이팅! 🔥`,
  },
];

export function findNotice(id: string): CommunityNotice | undefined {
  return NOTICES.find((n) => n.id === id);
}

// Shown when the community_posts table hasn't been migrated yet, so the page
// still looks like the real thing instead of an empty error state.
export const SAMPLE_POSTS: CommunityPost[] = [
  {
    id: "sample-1",
    author_name: "Maria",
    author_emoji: "🦊",
    country: "Brazil",
    board: "question",
    content: "What's the difference between 은/는 and 이/가? I keep mixing them up 😅",
    created_at: new Date().toISOString(),
  },
  {
    id: "sample-2",
    author_name: "Kenta",
    author_emoji: "🐻",
    country: "Japan",
    board: "free",
    content: "Passed TOPIK Level 3 today!! Six months of daily streaks paid off 🎉",
    created_at: new Date().toISOString(),
  },
  {
    id: "sample-3",
    author_name: "Amara",
    author_emoji: "🐰",
    country: "Nigeria",
    board: "exchange",
    content:
      "Looking for a partner to practice speaking 30 min a week — I can help with English!",
    created_at: new Date().toISOString(),
  },
];

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
