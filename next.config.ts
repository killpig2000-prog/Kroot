import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Turns on src/app/global-not-found.tsx. Still experimental in 16.2, but it
  // is the documented answer for an app whose root layout is a dynamic
  // segment ([locale]), which leaves nowhere to put a plain root not-found.
  experimental: {
    globalNotFound: true,
  },
  // Production was returning Strict-Transport-Security and nothing else, on a
  // site with password fields, magic-link callbacks and a microphone feature.
  // No CSP here on purpose: the app's inline theme-stamping script and
  // Tailwind's injected styles would need a nonce pipeline to survive one, so
  // this covers the headers that cost nothing to be right about.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Clickjacking: nothing in the app is meant to be framed.
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Pronunciation practice needs the mic; nothing needs the rest.
          {
            key: "Permissions-Policy",
            value: "microphone=(self), camera=(), geolocation=(), payment=(), usb=()",
          },
        ],
      },
    ];
  },
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
