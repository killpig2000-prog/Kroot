import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

// The shapes every Settings group is built from. Deliberately the same card
// and row metrics ReminderSettings and SoundSettings already use, since those
// two render themselves and sit in the same stack — a second set of paddings
// would show as a step between neighbouring cards.
//
// 2026-09-10, user call: no icons here at all. A column of fourteen identical
// bordered boxes was a second, louder column beside the labels — every row
// carrying a picture means none of them points anywhere. The words carry the
// rows now, and the only marks left are the chevron on a row that goes
// somewhere and the switch on a row that toggles.

export function SettingsCard({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="border border-line rounded-[12px] px-[24px] py-5">
      <b className="font-semibold text-[15px] block mb-4">{title}</b>
      <div className="grid grid-cols-1 gap-3">{children}</div>
    </section>
  );
}

/** A row that shows something and hands its control (a switch, a select, a
 *  value) in as `trailing`. */
export function SettingsRow({
  title,
  desc,
  trailing,
  danger = false,
  wrap = false,
}: {
  title: string;
  desc?: string;
  trailing?: ReactNode;
  danger?: boolean;
  /** Let the control fall to its own line rather than squeezing the label
   *  into a two-word-per-line column — 360px phones and the longer
   *  translations both hit that. */
  wrap?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 ${wrap ? "flex-wrap" : ""}`}>
      <span className={`flex-1 ${wrap ? "min-w-[180px]" : "min-w-0"}`}>
        <b className={`block text-[14px] font-semibold ${danger ? "text-danger" : ""}`}>{title}</b>
        {desc && <span className="block text-[12.5px] text-muted leading-snug">{desc}</span>}
      </span>
      {trailing}
    </div>
  );
}

/** The same row, as a link. `external` skips the locale-prefixing Link for
 *  routes that live outside the [locale] tree. */
export function SettingsLinkRow({
  title,
  desc,
  href,
  external = false,
}: {
  title: string;
  desc?: string;
  href: string;
  external?: boolean;
}) {
  const inner = (
    <>
      <span className="flex-1 min-w-0">
        <b className="block text-[14px] font-semibold">{title}</b>
        {desc && <span className="block text-[12.5px] text-muted leading-snug">{desc}</span>}
      </span>
      <span className="flex-none text-[13px] font-bold text-success transition-transform group-hover:translate-x-0.5" aria-hidden="true">
        ›
      </span>
    </>
  );
  const cls =
    "group flex items-center gap-3 -mx-2 px-2 py-1 rounded-[12px] transition-colors hover:bg-warm";

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

/** The same row, as a button. Sign out and Delete account are the row, not a
 *  label with a button beside it repeating the label back. */
export function SettingsButtonRow({
  title,
  desc,
  onClick,
  disabled = false,
  danger = false,
}: {
  title: string;
  desc?: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group flex w-full items-center gap-3 -mx-2 px-2 py-1 rounded-[12px] text-left transition-colors disabled:opacity-60 ${
        danger ? "hover:bg-danger-bg" : "hover:bg-warm"
      }`}
    >
      <span className="flex-1 min-w-0">
        <b className={`block text-[14px] font-semibold ${danger ? "text-danger" : ""}`}>{title}</b>
        {desc && <span className="block text-[12.5px] text-muted leading-snug">{desc}</span>}
      </span>
      <span
        className={`flex-none text-[13px] font-bold transition-transform group-hover:translate-x-0.5 ${
          danger ? "text-danger" : "text-success"
        }`}
        aria-hidden="true"
      >
        ›
      </span>
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
