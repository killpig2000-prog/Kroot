import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Old Beginner Path lives on as the 16-day course.
      {
        source: "/path/:rest*",
        destination: "/course",
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
