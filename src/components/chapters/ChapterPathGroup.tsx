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
 * joined by a dashed line) on wider screens, and as a plain vertical list on
 * phones — where the zigzag only fits one node per row and truncates titles.
 *
 * `dividerEvery` draws a thin rule with a "11–20" style label every N nodes so
 * a long group (a whole genre) still reads in sets of ten.
 */
export default function ChapterPathGroup({
  nodes,
  lineColorClassName = "border-line",
  hoverClassName = "hover:bg-warm",
  dividerEvery,
}: {
  nodes: ChapterPathNode[];
  lineColorClassName?: string;
  hoverClassName?: string;
  dividerEvery?: number;
}) {
  const dividerBefore = (i: number) => Boolean(dividerEvery && i > 0 && i % dividerEvery === 0);
  const dividerLabel = (i: number) => {
    const start = nodes[i].key + 1;
    const end = Math.min(nodes[i].key + (dividerEvery ?? 0), nodes[nodes.length - 1].key + 1);
    return `${start}–${end}`;
  };

  const divider = (i: number) => (
    <div className="flex items-center gap-2.5 py-1.5" aria-hidden="true">
      <span className="h-px flex-1 bg-line" />
      <span className="text-[10.5px] font-semibold text-faint tabular-nums">{dividerLabel(i)}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );

  const wrap = (node: ChapterPathNode, children: ReactNode, extra = "") =>
    node.href ? (
      <Link key={node.key} href={node.href} className={`group rounded-[12px] ${hoverClassName} ${extra}`}>
        {children}
      </Link>
    ) : (
      <div key={node.key} className={`group ${extra}`}>
        {children}
      </div>
    );

  return (
    <>
      {/* phones: a straight list, full titles */}
      <div className="sm:hidden flex flex-col">
        {nodes.map((node, i) => (
          <div key={node.key}>
            {dividerBefore(i) && divider(i)}
            {wrap(
              node,
              <div
                className={`flex items-center gap-3 rounded-[12px] px-2 py-2 transition-colors ${
                  node.dim ? "opacity-60" : ""
                }`}
              >
                <span
                  className={`relative z-10 w-9 h-9 rounded-full flex-none flex items-center justify-center text-[12px] font-bold border-[2.5px] bg-white ${node.circleClassName} ${node.ringClassName ?? ""}`}
                >
                  {node.circleContent}
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block font-semibold text-[13.5px] leading-tight">{node.title}</b>
                  {node.subtitle && (
                    <small className="block text-[12px] text-muted leading-snug line-clamp-2 mt-0.5">
                      {node.subtitle}
                    </small>
                  )}
                </span>
                <span
                  className={`flex-none inline-block text-[10.5px] font-semibold rounded-full border px-2 py-[2px] ${node.badgeClassName}`}
                >
                  {node.badgeLabel}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* sm and up: the winding path */}
      <div className="hidden sm:block relative py-1">
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
                <b className="block font-semibold text-[13.5px] max-w-full">{node.title}</b>
                {node.subtitle && (
                  <small className="block text-[12px] text-muted max-w-full line-clamp-2">{node.subtitle}</small>
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

            return (
              <div key={node.key}>
                {dividerBefore(i) && <div className="relative z-10 bg-white -mx-2 px-2">{divider(i)}</div>}
                {wrap(node, row)}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
