import type { MetadataRoute } from "next";
import { LOGGED_IN_PREFIXES, NON_INDEXABLE_PREFIXES, withLocalePrefixes } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The old list named five prefixes and only in their bare English form,
      // so /ja/dashboard and every other prefixed URL — plus /vocabulary,
      // /grammar, /review and the rest of the signed-in app — were still
      // crawled just to be redirected to /auth/login.
      //
      // /api/ is the one exception that needs no locale variants: the proxy
      // never hands API routes to next-intl, so /ja/api/... doesn't exist.
      disallow: [
        "/api/",
        ...withLocalePrefixes(["/auth/", ...LOGGED_IN_PREFIXES, ...NON_INDEXABLE_PREFIXES]),
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
