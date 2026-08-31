import Reveal from "@/components/landing/Reveal";
import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import SpeechStrip from "@/components/landing/SpeechStrip";
import LevelTest from "@/components/landing/LevelTest";
import Categories from "@/components/landing/Categories";
import Growth from "@/components/landing/Growth";
import PronunciationDemo from "@/components/landing/PronunciationDemo";
import WritingFeedbackDemo from "@/components/landing/WritingFeedbackDemo";
import Final from "@/components/landing/Final";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <Reveal />
      <Nav />
      <Hero />
      <SpeechStrip />
      <LevelTest />
      <Categories />
      <Growth />
      <PronunciationDemo />
      <WritingFeedbackDemo />
      <Final />
    </div>
  );
}
