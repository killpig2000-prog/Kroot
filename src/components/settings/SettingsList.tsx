import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

// The Settings screens are one sheet of white, not a stack of cards
// (2026-09-10, user call). Rows sit directly on the sheet, parted by a
// hairline; on a phone the sheet runs edge to edge, and on a desktop it
// becomes a bordered panel in the 560px column. Nothing here carries an
// icon: what marks a row is what sits at its right end — a chevron if it
// goes somewhere, a value if it holds one, a switch if it toggles.
//
// The first screen shows only the big groups, each with a one-line summary
// of its current values, so most questions are answered without going in.

/** One white sheet of rows. Full-bleed on the phone, a panel on desktop. */
export function Sheet({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`bg-sheet border-y border-line -mx-[clamp(18px,3vw,36px)] xl:mx-0 xl:rounded-[14px] xl:border ${className}`}
    >
      {children}
    </div>
  );
}

/** The chevron that says "this row goes somewhere". */
export function Chevron({ danger = false }: { danger?: boolean }) {
  return (
    <span
      className={`flex-none text-[17px] leading-none font-bold transition-transform group-hover:translate-x-0.5 ${
        danger ? "text-danger" : "text-faint"
      }`}
      aria-hidden="true"
    >
      ›
    </span>
  );
}

const ROW = "flex items-center gap-3 min-h-[54px] px-[18px] py-3 border-t border-line/60 first:border-t-0";

/** The row's text: a title, and a one-line description only where the
 *  row's effect isn't obvious from its name. */
function RowText({ title, desc, danger = false }: { title: ReactNode; desc?: ReactNode; danger?: boolean }) {
  return (
    <span className="flex-1 min-w-0">
      <b className={`block text-[15px] font-bold leading-snug ${danger ? "text-danger" : "text-charcoal"}`}>{title}</b>
      {desc ? <span className="block text-[12.5px] text-muted leading-snug mt-0.5">{desc}</span> : null}
    </span>
  );
}

/** A row that shows something and hands its control in as `trailing`. */
export function Row({
  title,
  desc,
  trailing,
  danger = false,
}: {
  title: ReactNode;
  desc?: ReactNode;
  trailing?: ReactNode;
  danger?: boolean;
}) {
  return (
    <div className={ROW}>
      <RowText title={title} desc={desc} danger={danger} />
      {trailing}
    </div>
  );
}

/** A row that goes somewhere. `value` is what it currently holds, shown
 *  before the chevron. `external` skips the locale-prefixing Link. */
export function LinkRow({
  title,
  desc,
  value,
  href,
  external = false,
  danger = false,
  tall = false,
}: {
  title: ReactNode;
  desc?: ReactNode;
  value?: ReactNode;
  href: string;
  external?: boolean;
  danger?: boolean;
  /** The first screen's group rows breathe a little more than detail rows. */
  tall?: boolean;
}) {
  const cls = `group ${ROW} ${tall ? "min-h-[62px]" : ""} transition-colors hover:bg-warm-4 active:bg-warm-3`;
  const inner = (
    <>
      <RowText title={title} desc={desc} danger={danger} />
      {value !== undefined && value !== null ? (
        <span className="flex-none text-[13.5px] font-semibold text-charcoal max-w-[45%] truncate">{value}</span>
      ) : null}
      <Chevron danger={danger} />
    </>
  );
  if (external) {
    return (
      <a href={href} className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

/** A row that does something when tapped — sign out, open feedback, open
 *  the delete panel. The row is the button; no label-plus-button pairs. */
export function ButtonRow({
  title,
  desc,
  value,
  onClick,
  disabled = false,
  danger = false,
  chevron = true,
}: {
  title: ReactNode;
  desc?: ReactNode;
  value?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  chevron?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group w-full text-left ${ROW} transition-colors disabled:opacity-60 ${
        danger ? "hover:bg-danger-bg" : "hover:bg-warm-4 active:bg-warm-3"
      }`}
    >
      <RowText title={title} desc={desc} danger={danger} />
      {value !== undefined && value !== null ? (
        <span className="flex-none text-[13.5px] font-semibold text-charcoal max-w-[45%] truncate">{value}</span>
      ) : null}
      {chevron ? <Chevron danger={danger} /> : null}
    </button>
  );
}

/** The app's switch, in the one size every settings screen uses. */
export function Switch({
  on,
  onToggle,
  label,
  disabled = false,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={`relative flex-none w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
        on ? "bg-success" : "bg-line"
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
          on ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}
