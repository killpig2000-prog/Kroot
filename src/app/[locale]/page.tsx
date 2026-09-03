import Reveal from "@/components/landing/Reveal";
import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import LevelTest from "@/components/landing/LevelTest";
import TodayQuest from "@/components/landing/TodayQuest";
import Categories from "@/components/landing/Categories";
import Growth from "@/components/landing/Growth";
import Final from "@/components/landing/Final";
import { setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

// Without setRequestLocale, next-intl resolves the locale by reading the
// proxy's header — a headers() call — which opted this page into dynamic
// rendering. Every other public page got this in 4f0e1d2 and now serves
// X-Vercel-Cache: HIT; the landing page was missed because it took no params
// and so had no locale to hand over. It was the last public route still
// React-rendered by a function on every visit, which is a poor trade for the
// one page the whole site funnels new visitors to.
export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div data-landing className="min-h-screen bg-warm text-charcoal">
      <Reveal />
      <Nav />
      <Hero />
      <LevelTest />
      <TodayQuest />
      <Categories />
      <Growth />
      <Final />
    </div>
  );
}
