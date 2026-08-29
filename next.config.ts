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
    ];
  },
};

export default withNextIntl(nextConfig);
