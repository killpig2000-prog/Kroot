// Shared class strings for the onboarding cards. Kept as constants (not a
// component) so the login / forgot-password pages can share the same look.
export const CARD = "border border-line rounded-[14px] bg-cream p-[clamp(22px,4vw,32px)]";
export const FIELD =
  "w-full px-3.5 py-[11px] text-[14px] border border-line rounded-[9px] bg-cream text-charcoal placeholder:text-faint focus:outline-none focus:border-success transition-colors";
export const LABEL = "block text-[12.5px] font-semibold mb-[6px] text-charcoal";
export const BTN_GREEN =
  "inline-flex items-center justify-center gap-2 rounded-[9px] bg-success px-[18px] py-[9px] text-[13.5px] font-semibold text-white hover:bg-success-deep transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
export const BTN_BIG =
  "inline-flex items-center justify-center gap-2 rounded-[11px] bg-success px-[22px] py-[13px] text-[15px] font-bold text-white shadow-[0_5px_0_var(--c-success-deep)] hover:translate-y-[2px] hover:shadow-[0_3px_0_var(--c-success-deep)] transition-all disabled:opacity-60";
export const BTN_OUTLINE =
  "inline-flex items-center justify-center gap-2 rounded-[9px] border border-line bg-cream px-[18px] py-[9px] text-[13.5px] font-semibold text-charcoal hover:bg-warm transition-colors";
export const BTN_GHOST = "text-[12.5px] font-medium text-faint hover:text-charcoal transition-colors";
export const TILE =
  "text-left border border-line rounded-[14px] bg-cream px-4 py-3.5 grid grid-cols-[38px_1fr] gap-3 items-center transition-colors hover:border-success hover:bg-success-bg";
export const TILE_ON = "border-success bg-success-bg";
export const TILE_ICON =
  "w-[38px] h-[38px] rounded-[9px] bg-warm border border-line flex items-center justify-center text-[18px]";
export const EYEBROW = "inline-block text-[11.5px] font-semibold uppercase tracking-[0.06em] text-faint";
export const H1 = "font-semibold text-[clamp(20px,3vw,25px)] tracking-[-0.02em] leading-[1.25] mb-1 text-center";
export const SUB = "text-center text-muted text-[13.5px] mb-6";
export const FADE = "animate-[fade_.45s_cubic-bezier(.2,.8,.2,1)]";
