import type { Metadata, Viewport } from "next";
import { Fredoka, Noto_Sans_KR, Nunito } from "next/font/google";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import "../globals.css";
import { routing } from "@/i18n/routing";
import { DARK_MODE_ENABLED, DEFAULT_MODE, MODE_COOKIE } from "@/lib/mode";
import { SEASON_COOKIE } from "@/lib/seasons";
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
//
// Weights track what the app actually uses. It loaded 400/500/700 for a long
// time while `font-semibold` (600) is by far the most common weight in the
// codebase (~319 uses against ~73 for `font-medium`), so the most common
// Korean text on the site was being rendered by the browser picking a
// neighbouring weight rather than a real cut. 600 replaces 500 rather than
// joining it: Noto Sans KR splits into 100+ unicode-range chunks per weight,
// and each extra weight is another ~100 files fetched at build time.
const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
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

// English only, on purpose. Crossed with the ~4,100 word pages and ~150 slang
// pages below this segment, returning all five locales would prerender north
// of 21,000 routes on every build — far too slow for the free Vercel tier.
// English is the indexed set (see seoAlternates); the other four locales are
// still fully available, just rendered on demand and then cached.
//
// The child routes that prerender many params (`words/[slug]`,
// `slang/[slug]`, `words/level/[level]`) therefore must NOT set
// `dynamicParams = false` — with only `en` generated here, a non-English
// request for one of them is a param combination that was never generated,
// and would 404 outright. Each of those pages calls notFound() for an
// unknown slug anyway, so nothing indexable is lost by generating on demand.
export function generateStaticParams() {
  return [{ locale: routing.defaultLocale }];
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate that the locale is supported. hasLocale narrows `locale` to the
  // union for us, which is what the `as any` was papering over.
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Both calls take the locale from the route params rather than letting
  // next-intl infer it. Left implicit, they resolve it by reading the header
  // the proxy sets — a headers() call, which opts the segment and everything
  // under it into dynamic rendering. That is the other half of what was
  // keeping the word and slang pages off the prerender: removing cookies()
  // from this file was necessary but not sufficient.
  //
  // setRequestLocale seeds the same value for descendants, so a page or
  // component calling getTranslations("ns") without a locale stays static too.
  setRequestLocale(locale);
  const messages = await getMessages({ locale });

  return (
    <html
      lang={locale}
      data-mode={DEFAULT_MODE}
      className={`${fredoka.variable} ${notoSansKr.variable} ${nunito.variable}`}
    >
      <body>
        {/* Applies the visitor's saved theme and seasonal-effects preference
            before anything paints.

            This used to be `await cookies()` in this component. cookies() is a
            request-time API, and reading it in the ROOT layout opted every
            single route in the app into dynamic rendering — including the
            ~4,100 word pages and ~150 slang pages that carry
            generateStaticParams specifically so they can be prerendered for
            search. They were being rendered by a function on every crawl.

            Two cookies, two `<html>` attributes, no data the server needs:
            reading them on the client costs nothing and lets the whole tree go
            static. It runs as the first child of <body>, so it executes before
            the browser paints any content and there is no flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var c=document.cookie,d=document.documentElement;` +
              `var m=/(?:^|;\\s*)${MODE_COOKIE}=(light|dark)/.exec(c);` +
              `d.dataset.mode=${DARK_MODE_ENABLED ? '(m?m[1]:"light")' : '"light"'};` +
              `if(/(?:^|;\\s*)${SEASON_COOKIE}=on/.test(c)){var n=new Date().getMonth()+1;` +
              `d.dataset.season=n>=3&&n<=5?"spring":n>=6&&n<=8?"summer":n>=9&&n<=11?"autumn":"winter";}` +
              `}catch(e){}})()`,
          }}
        />
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <SeasonalEffects />
          <PwaRegister />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
