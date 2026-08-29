import BrandMark from "@/components/ui/BrandMark";

// Served by the service worker when a navigation fails offline. Styled inline
// on purpose: the hashed CSS bundle isn't precached, so this page must look
// right with nothing but its own HTML.
export const metadata = { title: "You're offline — Kroot" };

const wrap: React.CSSProperties = {
  minHeight: "100vh",
  background: "#FFF9EC",
  color: "#4A4237",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  fontFamily: "Nunito, 'Noto Sans KR', system-ui, sans-serif",
};
const card: React.CSSProperties = { maxWidth: 420, textAlign: "center" };
const h1: React.CSSProperties = { fontSize: 26, fontWeight: 700, margin: "12px 0 8px", letterSpacing: "-0.01em" };
const p: React.CSSProperties = { fontSize: 15, lineHeight: 1.6, color: "#6B6560", margin: "0 0 22px" };
const btn: React.CSSProperties = {
  display: "inline-block",
  background: "#6BBF8A",
  color: "#fff",
  fontWeight: 700,
  textDecoration: "none",
  padding: "13px 26px",
  borderRadius: 99,
  boxShadow: "0 5px 0 #4E9A6D",
  fontSize: 16,
};

export default function OfflinePage() {
  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <BrandMark size={64} />
        </div>
        <h1 style={h1}>The garden can&apos;t reach the sun</h1>
        <p style={p}>
          You&apos;re offline right now. Your streak is safe — reconnect and today&apos;s lesson
          will be right where you left it.
        </p>
        <a href="/dashboard" style={btn}>
          Try again
        </a>
      </div>
    </div>
  );
}
