"use client";

import { useReveal } from "@/hooks/useReveal";
import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import SpeechStrip from "@/components/landing/SpeechStrip";
import LevelTest from "@/components/landing/LevelTest";
import Categories from "@/components/landing/Categories";
import Growth from "@/components/landing/Growth";
import Final from "@/components/landing/Final";

export default function LandingPage() {
  useReveal();

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#221F1B]">
      <Nav />
      <Hero />
      <SpeechStrip />
      <LevelTest />
      <Categories />
      <Growth />
      <Final />
    </div>
  );
}
