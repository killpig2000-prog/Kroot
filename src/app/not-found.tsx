import Link from "next/link";

// A page that doesn't exist = a seed that hasn't been planted yet.
export default function NotFound() {
  return (
    <main className="min-h-dvh flex items-center justify-center px-5 bg-white">
      <div className="text-center max-w-[420px]">
        <div className="inline-block border border-[#E3DDD0] rounded-[14px] bg-[#FAF7EF] px-8 pt-7 pb-4 mb-5 relative">
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white border border-[#E3DDD0] rounded-full px-3 py-1 text-[11.5px] font-semibold whitespace-nowrap">
            <span className="kr">어디지?</span> <span className="text-[#A19A8C]">where is it?</span>
          </span>
          {/* A little sprout peeking around with a magnifying glass */}
          <svg className="bob w-[92px] h-[92px]" viewBox="0 0 100 100" aria-hidden="true">
            <ellipse cx="50" cy="90" rx="30" ry="5" fill="#E3DDD0" />
            <g className="sway">
              <path d="M50 80 C50 66 50 60 50 54" stroke="#8B7355" strokeWidth="6" strokeLinecap="round" />
              <circle cx="50" cy="40" r="24" fill="#22C55E" />
              <path d="M50 22 C50 10 58 4 70 3 C68 15 61 21 50 22Z" fill="#16A34A" />
              {/* wide searching eyes */}
              <circle cx="41" cy="39" r="4.5" fill="white" />
              <circle cx="59" cy="39" r="4.5" fill="white" />
              <circle className="blink" cx="42.5" cy="39" r="2.4" fill="#14532D" />
              <circle className="blink d2" cx="60.5" cy="39" r="2.4" fill="#14532D" />
              {/* little "o" mouth */}
              <circle cx="50" cy="49" r="3" fill="none" stroke="#14532D" strokeWidth="2.2" />
              {/* magnifying glass */}
              <g transform="rotate(-20 76 62)">
                <circle cx="76" cy="58" r="9" fill="rgba(255,255,255,.55)" stroke="#8B7355" strokeWidth="3" />
                <path d="M82 66 L88 74" stroke="#8B7355" strokeWidth="4" strokeLinecap="round" />
              </g>
            </g>
          </svg>
        </div>

        <p className="text-[13px] font-bold tracking-[.08em] uppercase text-[#16A34A] mb-1.5">404</p>
        <h1 className="font-bold text-[clamp(20px,4vw,25px)] tracking-[-0.02em] mb-2">
          This page hasn&apos;t been planted yet
        </h1>
        <p className="text-[14px] text-[#6B6560] leading-[1.65] mb-7">
          We dug around the whole garden and found nothing but soil.
          <br />
          <span className="kr font-medium text-[#16A34A]">여기엔 아무것도 없어요!</span>{" "}
          <span className="text-[#A19A8C]">— nothing here!</span>
        </p>

        <div className="flex justify-center gap-2.5 flex-wrap">
          <Link
            href="/dashboard"
            className="rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] transition-colors"
          >
            Back to my garden 🌱
          </Link>
          <Link
            href="/"
            className="rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-[#18181B] bg-white border border-[#E3DDD0] hover:bg-[#FAF7EF] transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
