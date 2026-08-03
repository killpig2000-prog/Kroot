import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Logged-in app surfaces — nothing indexable behind these.
      disallow: ["/api/", "/dashboard", "/profile", "/shop", "/auth/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
