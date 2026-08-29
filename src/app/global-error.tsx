"use client"; // Error boundaries must be Client Components

// Replaces the root layout when it crashes — globals.css is gone here, so
// everything is inline-styled and self-contained.
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
          color: "#4A4237",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
          padding: "20px",
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <div
            style={{
              display: "inline-block",
              border: "1px solid #E3DDD0",
              borderRadius: 14,
              background: "#FAF7EF",
              padding: "26px 32px 14px",
              marginBottom: 20,
            }}
          >
            <svg width="92" height="92" viewBox="0 0 100 100" aria-hidden="true">
              <ellipse cx="50" cy="90" rx="30" ry="5" fill="#E3DDD0" />
              <g transform="rotate(4 50 80)">
                <path d="M50 80 C50 66 49 60 48 54" stroke="#8B7355" strokeWidth="6" strokeLinecap="round" />
                <circle cx="48" cy="40" r="24" fill="#22C55E" />
                <path d="M48 22 C46 12 38 8 28 10 C32 20 40 23 48 22Z" fill="#3E7C59" />
                <path d="M37 36 L44 40 L37 44" stroke="#14532D" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M59 36 L52 40 L59 44" stroke="#14532D" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M41 51 Q44.5 48 48 51 Q51.5 54 55 51" stroke="#14532D" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                <path d="M70 30 C70 26 73 22 73 22 C73 22 76 26 76 30 C76 32.2 74.7 34 73 34 C71.3 34 70 32.2 70 30Z" fill="#7DD3FC" />
              </g>
            </svg>
          </div>

          <h1 style={{ fontSize: 23, letterSpacing: "-0.02em", margin: "0 0 8px", fontWeight: 700 }}>
            The whole garden hiccuped
          </h1>
          <p style={{ fontSize: 14, color: "#6B6560", lineHeight: 1.65, margin: "0 0 28px" }}>
            앗! Something went really wrong — but your progress is safe.
            <br />
            One splash of water should bring everything back.
          </p>

          <button
            onClick={() => unstable_retry()}
            style={{
              border: "none",
              borderRadius: 9,
              padding: "11px 24px",
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              background: "#3E7C59",
              cursor: "pointer",
            }}
          >
            💧 Water it &amp; try again
          </button>

          {error.digest && (
            <p style={{ marginTop: 24, fontSize: 11.5, color: "#CFC8B8" }}>error id: {error.digest}</p>
          )}
        </div>
      </body>
    </html>
  );
}
