import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Old Beginner Path. Its content became the 16-day course, which was
      // itself folded into /guide when the course was removed — /course no
      // longer exists, so this pointed old links at a 404. The destination
      // stays unprefixed: next.config redirects run before the proxy, which
      // then applies the visitor's remembered locale to the bare path.
      {
        source: "/path/:rest*",
        destination: "/guide",
        permanent: true,
      },
      // koreanunboxed.com is now the canonical domain; send the old
      // Vercel-assigned URL there so there's one live address, not two.
      {
        source: "/:path*",
        has: [{ type: "host", value: "kroot-puce.vercel.app" }],
        destination: "https://www.koreanunboxed.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
