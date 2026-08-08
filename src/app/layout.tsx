import type { Metadata } from "next";
import { Fredoka, Jua, Nunito } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { DEFAULT_MODE, MODE_COOKIE, isModeKey } from "@/lib/mode";
import { SEASON_COOKIE, seasonForDate } from "@/lib/seasons";
import { SITE_URL } from "@/lib/site";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { isPlus } from "@/lib/plus";
import SeasonalEffects from "@/components/ui/SeasonalEffects";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jua = Jua({
  variable: "--font-jua",
  subsets: ["latin"],
  weight: "400",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Kroot — Grow your Korean, one little sprout at a time",
  description:
    "Kroot is a cozy garden where your Korean grows every day — with a friendly AI tutor, tiny lessons, and friends from all over the world.",
  verification: {
    google: "9_zaAq2WS5tU8bwdzzy7MF64LuKXCwJThp-S2V5ObPM",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const modeCookie = cookieStore.get(MODE_COOKIE)?.value;
  const mode = isModeKey(modeCookie) ? modeCookie : DEFAULT_MODE;
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
      lang="en"
      data-mode={mode}
      {...(seasonEnabled ? { "data-season": season } : {})}
      className={`${fredoka.variable} ${jua.variable} ${nunito.variable}`}
    >
      <body>
        {children}
        <SeasonalEffects season={season} initialEnabled={seasonEnabled} plus={plusActive} />
      </body>
    </html>
  );
}
