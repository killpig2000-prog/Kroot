// Relative timestamps for the community chrome. lib/community.ts's timeAgo()
// is English-only and shared with non-localised callers, so the boards format
// their own through the `community.timeAgo` messages instead. Takes the
// translator rather than a hook so the server list and the client comment
// thread can both use it.
export function formatTimeAgo(
  iso: string,
  t: (key: string, values?: { n: number }) => string,
  locale: string
): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return t("justNow");
  if (mins < 60) return t("minutes", { n: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("hours", { n: hours });
  const days = Math.floor(hours / 24);
  if (days < 30) return t("days", { n: days });
  return new Date(iso).toLocaleDateString(locale);
}
