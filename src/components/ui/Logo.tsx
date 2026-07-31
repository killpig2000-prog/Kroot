export default function Logo({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="24" r="13" fill="#6BBF8A" />
      <path d="M20 22 C20 14 24 10 30 9 C29 16 26 20 20 22Z" fill="#3E7C59" />
      <path d="M20 22 C20 16 16 12 11 11 C12 17 15 20 20 22Z" fill="#4E9A6D" />
      <circle cx="15.5" cy="25" r="1.8" fill="#2E5B41" />
      <circle cx="24.5" cy="25" r="1.8" fill="#2E5B41" />
      <path
        d="M16.5 29 Q20 32 23.5 29"
        stroke="#2E5B41"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
