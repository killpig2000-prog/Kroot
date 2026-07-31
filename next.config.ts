import type { NextConfig } from "next";

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

export default nextConfig;
