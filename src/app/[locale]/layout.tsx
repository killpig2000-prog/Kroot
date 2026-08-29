import type { Metadata, Viewport } from "next";
import { Fredoka, Noto_Sans_KR, Nunito } from "next/font/google";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { NextIntlClientProvider } from "next-intl";
import getRequestConfig from "@/i18n/request";
import "./globals.css";
import { routing } from "@/i18n/routing";
import { MODE_COOKIE, resolveMode } from "@/lib/mode";
import { SEASON_COOKIE, seasonForDate } from "@/lib/seasons";
import { SITE_URL } from "@/lib/site";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { isPlus } from "@/lib/plus";
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Kroot — Grow your Korean, one little sprout at a time",
  description:
    "Kroot is a cozy garden where your Korean grows every day — with a friendly AI tutor, tiny lessons, and friends from all over the world.",
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

  const messages = await getRequestConfig({ locale });

  const cookieStore = await cookies();
  // resolveMode ignores a stale dark cookie while dark mode is switched off,
  // so a phone already stuck in dark comes back to light on its next load.
  const mode = resolveMode(cookieStore.get(MODE_COOKIE)?.value);
  const seasonEnabled = cookieStore.get(SEASON_COOKIE)?.value === "on"; // default off
  const season = seasonForDate(new Date());

  // Plus members get a denser seasonal drift with golden sparkles.
  let plusActive = false;
  if (seasonEnabled) {
    const supabase = await createClient();
    const user = await getClaimsUser(supabase);
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("plus_until")
        .eq("id", user.id)
        .single();
      plusActive = isPlus(data?.plus_until);
    }
  }

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
          <SeasonalEffects season={season} initialEnabled={seasonEnabled} plus={plusActive} />
          <PwaRegister />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
