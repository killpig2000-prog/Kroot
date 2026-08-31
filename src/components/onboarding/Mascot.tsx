import { useTranslations } from "next-intl";
import SpeechBubble from "@/components/ui/SpeechBubble";

export default function Mascot() {
  const t = useTranslations("onboarding.mascot");
  const phrases = [
    { kr: "환영해요!", en: t("welcome") },
    { kr: "같이 해봐요", en: t("together") },
  ];

  return (
    <div className="relative flex justify-center mb-4">
      <div className="border border-line rounded-[12px] bg-warm px-6 pt-7 pb-3 relative">
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
          <SpeechBubble phrases={phrases} />
        </div>
        <svg className="bob w-[76px] h-[76px]" viewBox="0 0 100 100" aria-hidden="true">
          <ellipse cx="50" cy="88" rx="28" ry="5" fill="#E3DDD0" />
          <g className="sway">
            <path d="M50 78 C50 62 50 56 50 50" stroke="#8B7355" strokeWidth="6" strokeLinecap="round" />
            <circle cx="50" cy="38" r="24" fill="#22C55E" />
            <path d="M50 20 C50 8 58 2 70 1 C68 13 61 19 50 20Z" fill="#3E7C59" />
            <circle className="blink" cx="42" cy="38" r="3" fill="#14532D" />
            <circle className="blink d2" cx="58" cy="38" r="3" fill="#14532D" />
            <circle cx="37" cy="45" r="3.4" fill="#FB7185" opacity=".45" />
            <circle cx="63" cy="45" r="3.4" fill="#FB7185" opacity=".45" />
            <path d="M44 47 Q50 52 56 47" stroke="#14532D" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          </g>
        </svg>
      </div>
    </div>
  );
}
