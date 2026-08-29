import { ImageResponse } from "next/og";
import { getSlangBySlug } from "@/lib/slang-slugs";

export const alt = "Korean slang, explained — Kroot";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function SlangOpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getSlangBySlug(slug);

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
          background: "linear-gradient(180deg, #FDF2F8 0%, #FCE7F3 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 30 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#DB2777",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            한
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, color: "#831843" }}>Kroot · Street Talk</div>
        </div>

        {entry ? (
          <>
            <div style={{ fontSize: 130, fontWeight: 800, color: "#18181B", lineHeight: 1 }}>
              {entry.kr}
            </div>
            <div style={{ fontSize: 34, color: "#DB2777", fontWeight: 600, marginTop: 18 }}>
              {entry.romanization}
            </div>
            <div style={{ fontSize: 40, color: "#18181B", fontWeight: 700, marginTop: 22, maxWidth: 900, textAlign: "center" }}>
              {entry.meaning}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 48, fontWeight: 700, color: "#18181B" }}>Real Korean slang, explained</div>
        )}
      </div>
    ),
    size
  );
}
