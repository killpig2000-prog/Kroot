import Link from "next/link";
import type { ReactNode } from "react";

export type ChapterPathNode = {
  key: number;
  href?: string;
  circleClassName: string;
  ringClassName?: string;
  circleContent: ReactNode;
  title: string;
  subtitle?: ReactNode;
  badgeClassName: string;
  badgeLabel: string;
  dim?: boolean;
};

/**
 * Renders a group of chapters as a winding path (alternating left/right nodes
 * joined by a dashed line) instead of a stacked list — so a set of chapters
 * reads as a journey with a visible next step, not a flat menu.
 */
export default function ChapterPathGroup({
  nodes,
  lineColorClassName = "border-[#E3DDD0]",
  hoverClassName = "hover:bg-[#FAF7EF]",
}: {
  nodes: ChapterPathNode[];
  lineColorClassName?: string;
  hoverClassName?: string;
}) {
  return (
    <div className="relative py-1">
      <div
        className={`absolute top-3 bottom-3 left-1/2 -translate-x-1/2 w-0 border-l-2 border-dashed pointer-events-none ${lineColorClassName}`}
        aria-hidden="true"
      />
      <div className="relative grid">
        {nodes.map((node, i) => {
          const left = i % 2 === 0;

          const circle = (
            <span
              className={`relative z-10 w-11 h-11 rounded-full flex-none flex items-center justify-center text-[13px] font-bold border-[3px] bg-white transition-transform group-hover:scale-105 ${node.circleClassName} ${node.ringClassName ?? ""}`}
            >
              {node.circleContent}
            </span>
          );

          const label = (
            <span className={`min-w-0 flex flex-col gap-1 ${left ? "items-end text-right" : "items-start text-left"}`}>
              <b className="block font-semibold text-[13.5px] truncate max-w-full">{node.title}</b>
              {node.subtitle && (
                <small className="block text-[12px] text-[#6B6560] truncate max-w-full">{node.subtitle}</small>
              )}
              <span className={`inline-block text-[10.5px] font-semibold rounded-full border px-2 py-[2px] ${node.badgeClassName}`}>
                {node.badgeLabel}
              </span>
            </span>
          );

          const row = (
            <div
              className={`grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-[12px] px-2 py-2.5 transition-colors ${
                node.dim ? "opacity-60" : ""
              }`}
            >
              {left ? label : <span />}
              {circle}
              {left ? <span /> : label}
            </div>
          );

          return node.href ? (
            <Link key={node.key} href={node.href} className={`group rounded-[12px] ${hoverClassName}`}>
              {row}
            </Link>
          ) : (
            <div key={node.key} className="group">
              {row}
            </div>
          );
        })}
      </div>
    </div>
  );
}
