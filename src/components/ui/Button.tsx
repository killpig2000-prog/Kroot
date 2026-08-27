// Shared button styles for feature-screen UI (reading/writing/listening/
// vocab/pronunciation/level-test/onboarding). Consolidates the BTN_LINE /
// BTN_TEAL / BTN_INK / ... constants that used to be redeclared per file and
// had drifted (e.g. some variants were missing disabled:opacity-60).
import type { ButtonHTMLAttributes } from "react";

export type ButtonTone = "line" | "ink" | "teal" | "sky" | "success" | "amber" | "violet";

// This is the "default" session-button size (px-[22px] py-2.5 text-sm) used
// across reading/vocab/listening/level-test/pronunciation. It was the most
// common shape among the per-file BTN_LINE/BTN_TEAL/... constants, and the
// one where the disabled state had actually drifted between files.
const BASE = "rounded-[9px] px-[22px] py-2.5 text-sm font-semibold transition-colors disabled:opacity-60";

const TONE_CLASSES: Record<ButtonTone, string> = {
  line: "text-charcoal bg-white border border-line hover:bg-warm",
  ink: "text-white bg-charcoal hover:bg-[#3F3F46]",
  teal: "text-white bg-teal hover:bg-[#0F766E]",
  sky: "text-white bg-sky-deep hover:bg-[#1D4ED8]",
  success: "text-white bg-success hover:bg-success-deep",
  amber: "text-white bg-amber hover:bg-[#B45309]",
  violet: "text-white bg-[#7C3AED] hover:bg-[#6D28D9]",
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
