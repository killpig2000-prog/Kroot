// Thin wrapper around Unsplash's random-photo endpoint — used for decorative
// situation photos on the listening cards. Cached a week since these are just
// decoration, not content, and the free tier is rate-limited (50 req/hour).
export async function fetchUnsplashImage(
  query: string,
  orientation: "landscape" | "portrait" | "squarish" = "landscape"
): Promise<string | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;

  const params = new URLSearchParams({ query, orientation, content_filter: "high" });

  const res = await fetch(`https://api.unsplash.com/photos/random?${params.toString()}`, {
    headers: { Authorization: `Client-ID ${accessKey}` },
    next: { revalidate: 604800 },
  });
  if (!res.ok) return null;

  const json = await res.json();
  return json.urls?.regular ?? null;
}
