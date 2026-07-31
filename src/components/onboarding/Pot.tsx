export default function Pot({ grown }: { grown: boolean }) {
  return (
    <div className="mx-auto mb-5 w-[190px] border border-[#E7E5E4] rounded-[12px] bg-[#FAFAF9] p-3">
      <svg viewBox="0 0 170 150" aria-hidden="true">
        <path d="M45 100 L125 100 L115 145 L55 145 Z" fill="#D6BFA8" />
        <rect x="40" y="94" width="90" height="14" rx="7" fill="#C4A98C" />
        <g className={`sprout-grow${grown ? " up" : ""}`}>
          <path d="M85 96 C85 78 85 70 85 62" stroke="#8B7355" strokeWidth="6" strokeLinecap="round" />
          <circle cx="85" cy="46" r="20" fill="#22C55E" />
          <path d="M85 30 C85 18 93 12 104 11 C102 22 95 28 85 30Z" fill="#16A34A" />
          <circle cx="78" cy="46" r="2.6" fill="#14532D" />
          <circle cx="92" cy="46" r="2.6" fill="#14532D" />
          <path d="M80 53 Q85 57 90 53" stroke="#14532D" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
