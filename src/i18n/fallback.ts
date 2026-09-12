/** "vocabulary.detail.backToUnit" → "Back to unit": what a missing message shows instead of its dotted path. */
export function humanizeMessageKey(path: string): string {
  const last = path.split(".").pop() || path;
  const words = last.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
