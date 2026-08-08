// Canonical site origin for absolute URLs (sitemap, canonical tags, OG).
// Set NEXT_PUBLIC_SITE_URL when a custom domain exists (e.g. https://kroot.app);
// otherwise fall back to Vercel's production domain so crawlers never see
// localhost URLs in the sitemap.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");
