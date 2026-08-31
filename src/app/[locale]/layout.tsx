import type { Metadata, Viewport } from "next";
import { Fredoka, Noto_Sans_KR, Nunito } from "next/font/google";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import "../globals.css";
import { routing } from "@/i18n/routing";
import { MODE_COOKIE, resolveMode } from "@/lib/mode";
import { SEASON_COOKIE, seasonForDate } from "@/lib/seasons";
import { seoAlternates } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import SeasonalEffects from "@/components/ui/SeasonalEffects";
import PwaRegister from "@/components/pwa/PwaRegister";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Learning content must stay legible to absolute beginners, so all Korean
// renders in a textbook-shape sans (Noto Sans KR) rather than a display font.
const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

// The palette is light-only; dark is our own invert filter behind the in-app
// toggle. "only light" opts out of Chrome Android's forced Auto Dark Theme.
export const viewport: Viewport = {
  colorScheme: "only light",
  themeColor: "#6BBF8A",
};

// Generated rather than static so the homepage can declare a canonical that
// names the locale being served. (The landing page became a server component
// in 2026-08, so it could now own this itself — but see the warning below:
// `alternates` living here is load-bearing for other routes, so moving it is
// an SEO change, not a cleanup.)
//
// Careful — Next merges metadata shallowly from the root segment down, so a
// nested field the page doesn't set is INHERITED. `alternates` here therefore
// becomes the default for every route under [locale] that doesn't declare its
// own, pointing it at "/". Any new public, indexable page must set its own
// alternates (seoAlternates(locale, path)) or it will canonicalize itself away
// into the homepage. The pages that matter already do; the rest are blocked in
// robots.txt, and /onboarding inheriting the homepage canonical is the one
// live case, which is harmless for a thin funnel page.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    metadataBase: new URL(SITE_URL),
    title: "Kroot — Grow your Korean, one little sprout at a time",
    description:
      "Kroot is a cozy garden where your Korean grows every day — with a friendly AI tutor, tiny lessons, and friends from all over the world.",
    alternates: seoAlternates(locale, "/"),
    verification: {
      google: "9_zaAq2WS5tU8bwdzzy7MF64LuKXCwJThp-S2V5ObPM",
    },
    applicationName: "Kroot",
    appleWebApp: { capable: true, title: "Kroot", statusBarStyle: "default" },
    icons: {
      icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      apple: "/apple-touch-icon.png",
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate that the locale is supported
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  const cookieStore = await cookies();
  const mode = resolveMode(cookieStore.get(MODE_COOKIE)?.value);
  const seasonEnabled = cookieStore.get(SEASON_COOKIE)?.value === "on"; // default off
  const season = seasonForDate(new Date());

  return (
    <html
      lang={locale}
      data-mode={mode}
      {...(seasonEnabled ? { "data-season": season } : {})}
      className={`${fredoka.variable} ${notoSansKr.variable} ${nunito.variable}`}
    >
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
          <SeasonalEffects season={season} initialEnabled={seasonEnabled} />
          <PwaRegister />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
