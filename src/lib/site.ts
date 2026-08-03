// Canonical site origin for absolute URLs (sitemap, canonical tags, OG).
// Set NEXT_PUBLIC_SITE_URL in production (e.g. https://kroot.app).
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
