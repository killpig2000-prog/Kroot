export type BoardKey = "question" | "free" | "exchange";

export type CommunityPost = {
  id: string;
  // Whether the signed-in viewer wrote this post. Computed server-side so raw
  // user ids never reach the client.
  mine?: boolean;
  author_name: string;
  author_emoji: string | null;
  country: string | null;
  board: BoardKey;
  content: string;
  created_at: string;
};

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
