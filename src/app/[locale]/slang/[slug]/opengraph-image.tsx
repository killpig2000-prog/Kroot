import { ImageResponse } from "next/og";
import { getSlangBySlug } from "@/lib/slang-slugs";
import BrandMark from "@/components/ui/BrandMark";

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
          <BrandMark size={56} />
          <div style={{ fontSize: 34, fontWeight: 700, color: "#7C2A4B" }}>Kroot · Street Talk</div>
        </div>

        {entry ? (
          <>
            <div style={{ fontSize: 130, fontWeight: 800, color: "#4A4237", lineHeight: 1 }}>
              {entry.kr}
            </div>
            <div style={{ fontSize: 34, color: "#C13E78", fontWeight: 600, marginTop: 18 }}>
              {entry.romanization}
            </div>
            <div style={{ fontSize: 40, color: "#4A4237", fontWeight: 700, marginTop: 22, maxWidth: 900, textAlign: "center" }}>
              {entry.meaning}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 48, fontWeight: 700, color: "#4A4237" }}>Real Korean slang, explained</div>
        )}
      </div>
    ),
    size
  );
}
