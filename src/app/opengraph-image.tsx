import { ImageResponse } from "next/og";

// Site-wide social share card (Open Graph / Twitter). Statically generated
// at build time; word pages inherit it unless they define their own.
export const alt = "Kroot — Grow your Korean, one little sprout at a time";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #FDFBF7 0%, #F0FDF4 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              background: "#16A34A",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 56,
              fontWeight: 700,
            }}
          >
            한
          </div>
          <div style={{ fontSize: 84, fontWeight: 800, color: "#18181B" }}>Kroot</div>
        </div>
        <div style={{ fontSize: 40, color: "#18181B", fontWeight: 700, marginBottom: 14 }}>
          Grow your Korean, one little sprout at a time 🌱
        </div>
        <div style={{ fontSize: 27, color: "#6B6560" }}>
          Tiny lessons · AI writing feedback · 4,000+ words · Free forever
        </div>
      </div>
    ),
    size
  );
}
