// Shared button styles for feature-screen UI (reading/writing/listening/
// vocab/pronunciation/level-test/onboarding). Consolidates the BTN_LINE /
// BTN_TEAL / BTN_INK / ... constants that used to be redeclared per file and
// had drifted (e.g. some variants were missing disabled:opacity-60).
import type { ButtonHTMLAttributes } from "react";

export type ButtonTone = "line" | "ink" | "teal" | "sky" | "success" | "amber" | "violet";

// This is the "default" session-button size (px-[22px] py-2.5 text-sm) used
// across reading/vocab/listening/level-test/pronunciation.
//
// Every button carried a hover colour and nothing else until 2026-09-09,
// which meant that on a phone — where there is no hover — pressing one did
// nothing at all: 373 hover: rules against 5 active: rules across the app.
// A button that doesn't move under the thumb is most of what "cheap" means
// on a touch screen. So each tone now has a resting edge a shade darker
// than its face and a press that drops onto it, the storybook button the
// landing page already used (globals.css .btn-leaf) brought into the one
// place the app's own buttons come from.
//
// `touch-manipulation` drops the browser's 300ms double-tap wait, and
// `select-none` stops a firm press from selecting the label instead of
// pressing the button.
const BASE = [
  "inline-flex items-center justify-center select-none touch-manipulation",
  "rounded-[10px] px-[22px] py-2.5 text-sm font-semibold",
  "transition-[transform,box-shadow,background-color] duration-100 ease-out",
  "active:translate-y-[2px]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
  "disabled:opacity-60 disabled:shadow-none disabled:translate-y-0 disabled:pointer-events-none",
].join(" ");

// tone → [face, the 2px edge it sits on, the 0px edge it lands on]
const TONE_CLASSES: Record<ButtonTone, string> = {
  line: "text-charcoal bg-cream border border-line hover:bg-warm shadow-[0_2px_0_var(--c-line)] active:shadow-[0_0_0_var(--c-line)]",
  ink: "text-white bg-success hover:bg-success-deep shadow-[0_2px_0_var(--c-success-deep)] active:shadow-[0_0_0_var(--c-success-deep)]",
  teal: "text-white bg-teal hover:bg-[#256E63] shadow-[0_2px_0_#256E63] active:shadow-[0_0_0_#256E63]",
  sky: "text-white bg-sky-deep hover:bg-[#1D4ED8] shadow-[0_2px_0_#1D4ED8] active:shadow-[0_0_0_#1D4ED8]",
  success: "text-white bg-success hover:bg-success-deep shadow-[0_2px_0_var(--c-success-deep)] active:shadow-[0_0_0_var(--c-success-deep)]",
  amber: "text-white bg-amber hover:bg-[var(--c-amber-deep)] shadow-[0_2px_0_var(--c-amber-deep)] active:shadow-[0_0_0_var(--c-amber-deep)]",
  violet: "text-white bg-[var(--tint-violet-ink)] shadow-[0_2px_0_var(--tint-violet-line)] active:shadow-[0_0_0_var(--tint-violet-line)]",
};

export function buttonClassName(tone: ButtonTone = "line", className = "") {
  return `${BASE} ${TONE_CLASSES[tone]} ${className}`.trim();
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ButtonTone;
}

export default function Button({ tone = "line", className = "", ...rest }: ButtonProps) {
  return <button className={buttonClassName(tone, className)} {...rest} />;
}
