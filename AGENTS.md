<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Responsive rules (every UI change)

Phones vary a lot; a size that looks right at 390px is often too big at 360px and too small at 768px. Follow these five rules, no exceptions without a comment saying why.

1. **Five reference widths — a change passes only if it holds at all of them:** 360 (Galaxy A/S), 390 (iPhone), 430 (iPhone Pro Max), 768 (iPad), 1280 (desktop).
2. **Fixed px is for three things only:** hairlines/borders, icons, and tap targets (min 44px). Everything that is a *picture* or a *card* — trees, podium boxes, result rings, hero art — is sized with `clamp(min, Nvw, max)`: `min` is what fits a 360px phone, `max` is reached by 430px and never exceeded (tablets don't get billboards).
3. **Layout widths are relative** (%, grid, flex, `gap`), never px. Mobile pages are one column, `max-w-[560px]`; content that can be wide (tables, boards, long Korean) scrolls inside its own `overflow-x-auto` — the page body must never scroll sideways.
4. **Type:** headings `clamp()`ed; body stays 14–15px fixed. Korean is always Noto Sans KR.
5. **Breakpoints are Tailwind's defaults only** (`sm 640 / md 768 / lg 1024`), mobile-first. No custom breakpoints.

Verify with the sweep script (`scripts/responsive-sweep.mjs` — 8 key pages × the 5 widths, flags horizontal overflow) before calling a UI change done.
<!-- END:nextjs-agent-rules -->
