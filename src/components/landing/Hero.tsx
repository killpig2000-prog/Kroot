import Link from "next/link";

const PATH = [
  { icon: "🌰", lv: "A1", state: "done" },
  { icon: "🌱", lv: "A2", state: "done" },
  { icon: "🪴", lv: "B1", state: "now" },
  { icon: "🌳", lv: "B2", state: "" },
  { icon: "🌸", lv: "C1", state: "" },
  { icon: "🍎", lv: "C2", state: "" },
];

export default function Hero() {
  return (
    <header className="max-w-[1080px] mx-auto px-[clamp(18px,4vw,28px)] grid grid-cols-1 md:grid-cols-[1.05fr_.95fr] gap-[clamp(28px,5vw,64px)] items-center pt-[clamp(52px,8vw,96px)] pb-[clamp(48px,7vw,80px)] text-center md:text-left">
      <div>
        <span className="inline-flex items-center gap-[7px] rounded-full border border-[#BBF7D0] bg-[#F0FDF4] px-3.5 py-1.5 text-[12.5px] font-semibold text-[#16A34A] mb-[22px]">
          🌱 100% free · AI-powered Korean, A1 to C2
        </span>
        <h1 className="font-extrabold text-[clamp(34px,4.8vw,54px)] leading-[1.12] tracking-[-0.03em] text-[#18181B] mb-[18px]">
          Grow your Korean
          <br />
          from the <span className="text-[#16A34A]">root</span>.
        </h1>
        <p className="text-[clamp(15px,1.5vw,17px)] text-[#71717A] max-w-[460px] mb-[30px] mx-auto md:mx-0">
          Kroot turns daily practice into real growth — an AI tutor that listens, corrects, and
          levels you up, from your first 안녕 to fluent conversation.
        </p>
        <div className="flex gap-2.5 flex-wrap justify-center md:justify-start">
          <Link
            href="/onboarding"
            className="inline-flex items-center rounded-[10px] bg-[#16A34A] px-[26px] py-[13px] text-[14.5px] font-semibold text-white hover:bg-[#15803D] transition-colors"
          >
            Take the 3-min level test
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex items-center rounded-[10px] border border-[#E7E5E4] bg-white px-[26px] py-[13px] text-[14.5px] font-semibold text-[#18181B] hover:bg-[#FAFAF9] transition-colors"
          >
            New? Start with the alphabet
          </Link>
        </div>
        <p className="text-[12.5px] text-[#A1A1AA] mt-3.5 font-medium">
          Free forever · No credit card, no paywall — from Hangul to fluency
        </p>
      </div>

      {/* growth card */}
      <div
        className="border border-[#E7E5E4] rounded-2xl p-6 text-left shadow-[0_1px_2px_rgba(0,0,0,.03),0_18px_44px_rgba(24,24,27,.06)]"
        aria-hidden="true"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-semibold tracking-[.07em] uppercase text-[#A1A1AA]">
            Your tree
          </span>
          <span className="text-xs font-semibold text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0] rounded-md px-[9px] py-0.5">
            Level B1
          </span>
        </div>
        <div className="bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl flex justify-center p-[18px] mb-4">
          <svg viewBox="0 0 150 160" className="w-32 h-auto">
            <ellipse cx="75" cy="150" rx="46" ry="7" fill="#E7E5E4" />
            <path d="M75 146 C75 122 74 112 74 98" stroke="#8B7355" strokeWidth="8" strokeLinecap="round" />
            <g className="sway">
              <circle cx="75" cy="72" r="36" fill="#22C55E" />
              <circle cx="49" cy="88" r="18" fill="#4ADE80" />
              <circle cx="101" cy="88" r="18" fill="#4ADE80" />
              <circle className="blink" cx="64" cy="72" r="3.6" fill="#14532D" />
              <circle className="blink d2" cx="86" cy="72" r="3.6" fill="#14532D" />
              <path d="M68 82 Q75 88 82 82" stroke="#14532D" strokeWidth="3" fill="none" strokeLinecap="round" />
              <circle cx="50" cy="58" r="5.5" fill="#FACC15" />
              <circle cx="102" cy="56" r="5.5" fill="#FB7185" />
            </g>
          </svg>
        </div>
        <div className="flex items-center gap-2.5 mb-3.5">
          <div className="flex-1 h-1.5 bg-[#E7E5E4] rounded-full overflow-hidden">
            <i className="not-italic block h-full w-[68%] bg-[#16A34A] rounded-full" />
          </div>
          <span className="text-xs text-[#71717A] font-semibold whitespace-nowrap">68% to B2</span>
        </div>
        <div className="flex gap-1.5">
          {PATH.map((s) => (
            <div
              key={s.lv}
              className={`flex-1 border rounded-lg py-1.5 px-0.5 text-center text-[13px] ${
                s.state === "now"
                  ? "bg-[#F0FDF4] border-[#BBF7D0]"
                  : s.state === "done"
                  ? "border-[#E7E5E4]"
                  : "border-[#E7E5E4] grayscale opacity-45"
              }`}
            >
              {s.icon}
              <small
                className={`block text-[9.5px] font-semibold ${
                  s.state === "now" ? "text-[#16A34A]" : "text-[#A1A1AA]"
                }`}
              >
                {s.lv}
              </small>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
