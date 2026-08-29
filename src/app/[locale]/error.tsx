"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { Link } from "@/i18n/navigation";

// Something threw at runtime = the tree wilted a little. Watering (retry)
// usually perks it right back up.
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-dvh flex items-center justify-center px-5 bg-white">
      <div className="text-center max-w-[440px]">
        <div className="inline-block border border-line rounded-[14px] bg-warm px-8 pt-7 pb-4 mb-5 relative">
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white border border-line rounded-full px-3 py-1 text-[11.5px] font-semibold whitespace-nowrap">
            <span className="kr">앗, 미안해요!</span> <span className="text-faint">oops, sorry!</span>
          </span>
          {/* A wilted little tree — droopy leaf, dizzy eyes, one sweat drop */}
          <svg className="w-[92px] h-[92px]" viewBox="0 0 100 100" aria-hidden="true">
            <ellipse cx="50" cy="90" rx="30" ry="5" fill="#E3DDD0" />
            <g transform="rotate(4 50 80)">
              <path d="M50 80 C50 66 49 60 48 54" stroke="#8B7355" strokeWidth="6" strokeLinecap="round" />
              <circle cx="48" cy="40" r="24" fill="#22C55E" />
              {/* the top leaf flops over */}
              <path d="M48 22 C46 12 38 8 28 10 C32 20 40 23 48 22Z" fill="#3E7C59" />
              {/* dizzy > < eyes */}
              <path d="M37 36 L44 40 L37 44" stroke="#14532D" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M59 36 L52 40 L59 44" stroke="#14532D" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              {/* wobbly mouth */}
              <path d="M41 51 Q44.5 48 48 51 Q51.5 54 55 51" stroke="#14532D" strokeWidth="2.2" fill="none" strokeLinecap="round" />
              {/* sweat drop */}
              <path className="bob" d="M70 30 C70 26 73 22 73 22 C73 22 76 26 76 30 C76 32.2 74.7 34 73 34 C71.3 34 70 32.2 70 30Z" fill="#7DD3FC" />
            </g>
          </svg>
        </div>

        <h1 className="font-bold text-[clamp(20px,4vw,25px)] tracking-[-0.02em] mb-2">
          Our tree wilted for a second
        </h1>
        <p className="text-[14px] text-muted leading-[1.65] mb-7">
          Something went wrong on our side — your progress is safe and rooted.
          <br />
          A splash of water usually fixes it.
        </p>

        <div className="flex justify-center gap-2.5 flex-wrap">
          <button
            onClick={() => unstable_retry()}
            className="rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-white bg-success hover:bg-success-deep transition-colors"
          >
            💧 Water it &amp; try again
          </button>
          <Link
            href="/dashboard"
            className="rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-charcoal bg-white border border-line hover:bg-warm transition-colors"
          >
            Back to my garden
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 text-[11.5px] text-[#CFC8B8] tabular-nums">error id: {error.digest}</p>
        )}
      </div>
    </main>
  );
}
