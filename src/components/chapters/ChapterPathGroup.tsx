import { Link } from "@/i18n/navigation";
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
  /** data-tour id — the guided walkthrough spotlights this row. */
  tourId?: string;
};

/**
 * Renders a group of chapters as a tight vertical list — one row per
 * chapter, no gap, a dashed rule between rows — the same phone-app-list
 * density used everywhere else in the app (vocabulary, word bank). Used to
 * be a winding zigzag path on wider screens; that was dropped in favor of
 * one consistent list at every width.
 *
 * `dividerEvery` draws a thin rule with a "11–20" style label every N nodes so
 * a long group (a whole genre) still reads in sets of ten.
 */
export default function ChapterPathGroup({
  nodes,
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

  const wrap = (node: ChapterPathNode, children: ReactNode, isLast: boolean) => {
    const rowClass = `flex items-center gap-3 py-2 -mx-2 px-2 rounded-[6px] transition-colors ${
      isLast ? "" : "border-b border-dashed border-dash"
    } ${node.dim ? "opacity-60" : ""}`;
    return node.href ? (
      <Link key={node.key} href={node.href} data-tour={node.tourId} className={`group ${hoverClassName} ${rowClass}`}>
        {children}
      </Link>
    ) : (
      <div key={node.key} className={`group ${rowClass}`}>
        {children}
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      {nodes.map((node, i) => (
        <div key={node.key}>
          {dividerBefore(i) && divider(i)}
          {wrap(
            node,
            <>
              <span
                className={`relative z-10 w-9 h-9 rounded-full flex-none flex items-center justify-center text-[12px] font-bold border-[2.5px] bg-cream ${node.circleClassName} ${node.ringClassName ?? ""}`}
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
            </>,
            i === nodes.length - 1 || dividerBefore(i + 1)
          )}
        </div>
      ))}
    </div>
  );
}
