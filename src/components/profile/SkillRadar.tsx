import { getTranslations } from "next-intl/server";
import type { SkillBar } from "@/components/profile/SkillBars";

// "Skill shape" — the Learn tab's radar (2026-09-07, user: "스파이더 차트가
// 있으면 있어 보일 것 같은데"). One polygon, one data colour, on a light
// web of three rings; the weakest vertex carries the same coral the bars
// use, so the two charts point at the same thing. Drawn only with three or
// more scored skills — a radar with two axes is a line.
const CORAL = "#D4705C";
// Wider than tall: the side labels need room, the chart itself doesn't.
const W = 400;
const H = 220;
const CX = W / 2;
const CY = H / 2 + 4;
const R = 74;

export default async function SkillRadar({ rows }: { rows: SkillBar[] }) {
  const t = await getTranslations("profile.learn");
  if (rows.length < 3) return null;
  const n = rows.length;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i: number, r: number) => [CX + r * Math.cos(angle(i)), CY + r * Math.sin(angle(i))] as const;
  const ring = (r: number) => rows.map((_, i) => pt(i, r).join(",")).join(" ");
  const shape = rows.map((s, i) => pt(i, (R * s.percent) / 100).join(",")).join(" ");

  return (
    <div className="border border-line rounded-[14px] bg-cream px-4 py-3.5">
      <div className="flex items-baseline justify-between mb-1">
        <b className="text-[14px] font-bold">{t("radarTitle")}</b>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t("radarAria")} className="block w-full h-auto max-w-[360px] mx-auto">
        {[1 / 3, 2 / 3, 1].map((k) => (
          <polygon key={k} points={ring(R * k)} fill="none" stroke="var(--c-line)" strokeWidth={1} />
        ))}
        {rows.map((_, i) => {
          const [x, y] = pt(i, R);
          return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="var(--c-line)" strokeWidth={1} />;
        })}
        <polygon points={shape} fill="var(--c-success)" fillOpacity={0.22} stroke="var(--c-success)" strokeWidth={2} strokeLinejoin="round" />
        {rows.map((s, i) => {
          const [x, y] = pt(i, (R * s.percent) / 100);
          return <circle key={s.key} cx={x} cy={y} r={3.5} fill={s.weakest ? CORAL : "var(--c-success-deep)"} />;
        })}
        {rows.map((s, i) => {
          const [x, y] = pt(i, R + 14);
          const anchor = Math.abs(x - CX) < 6 ? "middle" : x > CX ? "start" : "end";
          return (
            <text
              key={s.key}
              x={x}
              y={y + 4}
              fontSize={11}
              fontWeight={700}
              textAnchor={anchor}
              fill={s.weakest ? CORAL : "var(--c-muted)"}
              fontFamily="inherit"
            >
              {s.label} <tspan fontWeight={400}>{s.percent}</tspan>
            </text>
          );
        })}
      </svg>
    </div>
  );
}
