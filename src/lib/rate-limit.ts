// Per-instance sliding-window rate limiter; resets on cold start, which is
// acceptable as a cheap abuse brake. Was reimplemented separately in
// tts/route.ts, writing/grade/route.ts, and level-test/grade/route.ts — two
// of the three copies were missing the map-size eviction below and would
// leak memory under sustained traffic.
const buckets = new Map<string, Map<string, number[]>>();

export function isRateLimited(scope: string, key: string, limit: number, windowMs: number) {
  let recentRequests = buckets.get(scope);
  if (!recentRequests) {
    recentRequests = new Map();
    buckets.set(scope, recentRequests);
  }

  const now = Date.now();
  const hits = (recentRequests.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    recentRequests.set(key, hits);
    return true;
  }
  hits.push(now);
  recentRequests.set(key, hits);

  if (recentRequests.size > 5000) {
    for (const [k, times] of recentRequests) {
      if (times.every((t) => now - t >= windowMs)) recentRequests.delete(k);
    }
  }
  return false;
}
