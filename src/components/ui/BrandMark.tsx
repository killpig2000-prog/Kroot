// Kroot's brand mark: a bold K putting down roots, on the app's cream paper.
// The same artwork as public/icon.svg, so the browser tab, the home-screen
// icon, and every in-app logo are one object. Plain SVG attributes only (no
// className) so this also renders inside next/og ImageResponse (Satori).
export default function BrandMark({ size = 30, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={style}>
      <rect width="64" height="64" rx="15" fill="#FFF9EC" />
      <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="14.25" fill="none" stroke="#E8E0CF" strokeWidth="1.5" />
      <rect x="8" y="42" width="48" height="3.5" rx="1.75" fill="#6BBF8A" />
      <path d="M20 13 V42" stroke="#3E7C59" strokeWidth="8.5" strokeLinecap="round" />
      <path d="M45 13 L24 31 L46 42" fill="none" stroke="#3E7C59" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 45 V52 M20 47 L12 55 M20 47 L28 55" fill="none" stroke="#3E7C59" strokeWidth="4" strokeLinecap="round" />
      <path d="M12 55 L9 59 M28 55 L31 59 M20 52 V58" fill="none" stroke="#3E7C59" strokeWidth="3" strokeLinecap="round" />
      <path d="M45 12 C52 1 62 8 55 16 C51 20 45 17 45 12Z" fill="#6BBF8A" />
    </svg>
  );
}
