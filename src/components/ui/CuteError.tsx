import { useTranslations } from "next-intl";

// A soft, on-brand error callout: a flustered little sprout delivering the bad
// news gently instead of a bare line of red text.
export default function CuteError({ children }: { children: React.ReactNode }) {
  const t = useTranslations("ui");
  return (
    <div
      role="alert"
      className="flex items-start gap-3 border-[1.5px] border-[var(--tint-rose-line)] bg-[var(--tint-rose)] rounded-[10px] px-3.5 py-3 mb-3.5"
      style={{ animation: "fadeUp .3s ease" }}
    >
      <svg className="w-[34px] h-[34px] flex-none" viewBox="0 0 100 100" aria-hidden="true">
        <ellipse cx="50" cy="92" rx="26" ry="4" fill="#FECDD3" />
        <g transform="rotate(3 50 80)">
          <path d="M50 82 C50 68 49 62 48 56" stroke="#8B7355" strokeWidth="7" strokeLinecap="round" />
          <circle cx="48" cy="40" r="26" fill="#22C55E" />
          <path d="M48 16 C46 6 38 2 28 4 C32 14 40 17 48 16Z" fill="#3E7C59" />
          {/* flustered ; ; eyes */}
          <path d="M36 36 Q40 40 36 44" stroke="#14532D" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M60 36 Q56 40 60 44" stroke="#14532D" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* small worried mouth */}
          <path d="M42 53 Q48 49 54 53" stroke="#14532D" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          {/* blush */}
          <circle cx="34" cy="48" r="3.6" fill="#FB7185" opacity=".5" />
          <circle cx="62" cy="48" r="3.6" fill="#FB7185" opacity=".5" />
          {/* sweat drop */}
          <path d="M72 26 C72 22 75 18 75 18 C75 18 78 22 78 26 C78 28.2 76.7 30 75 30 C73.3 30 72 28.2 72 26Z" fill="#7DD3FC" />
        </g>
      </svg>
      <div className="text-[12.5px] leading-[1.55] pt-0.5">
        <b className="block text-[#BE123C] font-bold mb-px">
          <span className="kr">앗!</span> {t("error.title")}
        </b>
        <span className="text-[#9F1239] font-medium">{children}</span>
      </div>
    </div>
  );
}
