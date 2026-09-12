"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import ModuleIcon from "@/components/dashboard/ModuleIcon";
import { LANGUAGES, rememberLocale } from "@/i18n/locale";
import { useBackToClose } from "@/hooks/useBackToClose";
import type { CefrLevel } from "@/lib/tree";

// The bar at the top of the six lesson index pages (Hangul, Vocabulary,
// Writing, Reading, Listening, Pronunciation) — 2026-09-10.
//
// Those pages used to open with a stack of chrome: a breadcrumb on two of
// them, a jamo badge + module name on all six, a row of six level chips of
// which five were locked, a line explaining why they were locked, and on
// Writing a second stats line under all that. Measured at 390×844, Writing
// spent 399px — 47% of the first screen — before the first thing you could
// tap. Meanwhile the 52px header every phone page already carries showed the
// logo, a streak count and an avatar, none of which is what you came here to
// do.
//
// So the header IS the bar now, and it holds exactly four things: the way
// out (← always to the Garden — browser back lands different people in
// different places), where you are (the same drawn icon the Garden door
// wears, plus the name), and the two controls that change what you see —
// the language meanings appear in, and the level. Locked levels and the
// promotion-test note live inside the level sheet, shown only to someone
// who has actually opened it. No totals ("2 of 52"): a big denominator makes
// real progress read as zero, and the chapter cards below already say where
// you are inside the thing you're doing.
//
// Under xl the bar is sticky and full-bleed, replacing Sidebar's mobile
// header (pages pass `lessonBar` to Sidebar so it stands down). At xl+ the
// sidebar is the nav; the bar renders once more as a plain row at the top of
// main, so the desktop page has a name and the same two controls.

export type LessonLevel = {
  current: CefrLevel;
  /** The learner's own grade — marked in the sheet. */
  mine: CefrLevel;
  levels: readonly CefrLevel[];
  /** Levels that can be opened; the rest show locked. */
  unlocked: readonly CefrLevel[];
  /** "/reading?level={lv}" — a template, since a function can't cross the
   *  server→client boundary. */
  hrefTemplate: string;
  /** data-tour id for the guided walkthrough (Writing's level step). */
  tourId?: string;
};

type SheetKind = "language" | "level" | null;

export default function LessonBar({
  href,
  title,
  sub,
  backHref = "/dashboard",
  locale,
  level,
}: {
  /** The module route — picks the door icon. */
  href: string;
  title: string;
  /** Where inside the module — "Chapter 1". Session pages (2026-09-10):
   *  the bar reads "Writing / Chapter 1" and ← goes to the module's list,
   *  so the body can open on the first question. */
  sub?: string;
  backHref?: string;
  locale: string;
  level?: LessonLevel;
}) {
  const t = useTranslations("ui.lessonBar");
  const [sheet, setSheet] = useState<SheetKind>(null);
  const closeSheet = useCallback(() => setSheet(null), []);
  const currentLang = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  return (
    <>
      <div
        className="sticky top-0 z-30 h-[52px] -mx-[clamp(18px,4vw,44px)] -mt-6 mb-4 px-3 flex items-center gap-2 bg-warm/90 backdrop-blur-[10px] border-b-[1.5px] border-dashed border-dash xl:static xl:h-auto xl:mx-0 xl:mt-0 xl:mb-5 xl:px-0 xl:bg-transparent xl:backdrop-blur-none xl:border-0"
        data-lesson-bar
      >
        <Link
          href={backHref}
          aria-label={sub ? t("backTo", { name: title }) : t("back")}
          className="flex-none w-9 h-9 rounded-[10px] border border-line bg-cream text-charcoal flex items-center justify-center text-[17px] font-bold leading-none hover:bg-warm-2 active:translate-y-[1px] transition-colors"
        >
          ←
        </Link>

        <h1 className="flex-1 min-w-0 flex items-center gap-1.5 text-[15px] xl:text-[22px] font-bold tracking-[-0.01em] text-charcoal">
          <span className="flex-none text-success-deep">
            <ModuleIcon href={href} size={20} />
          </span>
          {/* The name truncates, the chapter never does: at 360px "Writing /
              Chapter 1" is ~12px over the slot, and the door icon already
              says which module this is, so the name is the safe thing to
              cut (2026-09-11, seen in the 5-width sweep). */}
          <span className="min-w-0 truncate">{title}</span>
          {sub && <span className="flex-none ml-1 font-semibold text-faint">/ {sub}</span>}
        </h1>

        <div className="flex-none flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={() => setSheet("language")}
            aria-haspopup="dialog"
            aria-expanded={sheet === "language"}
            className="h-8 rounded-full border border-line bg-cream px-2 sm:px-2.5 text-[12.5px] font-bold text-muted hover:bg-warm-2 active:translate-y-[1px] transition-colors whitespace-nowrap"
          >
            🌐 {currentLang.code.toUpperCase().slice(0, 2)} ▾
          </button>
          {level && (
            <button
              type="button"
              onClick={() => setSheet("level")}
              aria-haspopup="dialog"
              aria-expanded={sheet === "level"}
              data-tour={level.tourId}
              data-tour-level={level.tourId ? level.mine : undefined}
              className="h-8 rounded-full border border-success bg-success px-2.5 sm:px-3 text-[12.5px] font-extrabold text-white hover:bg-success-deep active:translate-y-[1px] transition-colors whitespace-nowrap"
            >
              {level.current} ▾
            </button>
          )}
        </div>
      </div>

      <Sheet open={sheet === "language"} onClose={closeSheet} title={t("language")}>
        <LanguageList locale={locale} onDone={closeSheet} />
        <p className="mt-3 text-[12.5px] text-muted leading-snug">{t("languageNote")}</p>
      </Sheet>

      {level && (
        <Sheet open={sheet === "level"} onClose={closeSheet} title={t("level")}>
          <LevelList level={level} onDone={closeSheet} />
        </Sheet>
      )}
    </>
  );
}

/* ---------------------------------------------------------------------- */

function LanguageList({ locale, onDone }: { locale: string; onDone: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [pendingCode, setPendingCode] = useState<string | null>(null);

  // Same steps as the sidebar switcher: set the cookie first so the proxy
  // doesn't bounce the default-locale URL back, then let next-intl's router
  // add the prefix — `pathname` from @/i18n/navigation is already bare.
  function pick(code: string) {
    if (code === locale) {
      onDone();
      return;
    }
    rememberLocale(code);
    setPendingCode(code);
    startTransition(() => {
      router.replace(`${pathname}${window.location.search}${window.location.hash}`, { locale: code });
    });
  }

  return (
    <ul className="grid gap-1" role="listbox" aria-busy={isPending}>
      {LANGUAGES.map((lang) => {
        const on = lang.code === locale;
        const busy = pendingCode === lang.code;
        return (
          <li key={lang.code}>
            <button
              type="button"
              role="option"
              aria-selected={on}
              disabled={isPending}
              onClick={() => pick(lang.code)}
              className={`w-full flex items-center gap-3 rounded-[12px] px-3.5 py-2.5 text-left text-[14.5px] font-semibold transition-colors disabled:opacity-70 ${
                on ? "bg-success-bg text-success-deep" : "text-charcoal hover:bg-warm"
              }`}
            >
              <span className="flex-1">{lang.label}</span>
              {busy ? (
                <span
                  className="inline-block w-3.5 h-3.5 rounded-full border-2 border-line border-t-success-deep animate-spin"
                  aria-hidden="true"
                />
              ) : (
                on && <span aria-hidden="true">✓</span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function LevelList({ level, onDone }: { level: LessonLevel; onDone: () => void }) {
  const t = useTranslations("ui.levelTabs");
  const anyLocked = level.levels.some((lv) => !level.unlocked.includes(lv));
  return (
    <>
      <ul className="grid gap-1" role="listbox">
        {level.levels.map((lv) => {
          const on = lv === level.current;
          const you = lv === level.mine;
          const open = level.unlocked.includes(lv);
          if (!open) {
            return (
              <li
                key={lv}
                role="option"
                aria-selected={false}
                title={t("lockedTitle")}
                aria-disabled="true"
                className="flex items-center gap-3 rounded-[12px] px-3.5 py-2.5 text-[14.5px] font-semibold text-faint select-none"
              >
                <span aria-hidden="true" className="text-[12px]">🔒</span>
                {lv}
              </li>
            );
          }
          return (
            <li key={lv}>
              <Link
                href={level.hrefTemplate.replace("{lv}", lv)}
                role="option"
                aria-selected={on}
                onClick={onDone}
                className={`flex items-center gap-3 rounded-[12px] px-3.5 py-2.5 text-[14.5px] font-semibold transition-colors ${
                  on ? "bg-success-bg text-success-deep" : "text-charcoal hover:bg-warm"
                }`}
              >
                <span className="flex-1 flex items-center gap-2">
                  {lv}
                  {you && (
                    <span className={`text-[10px] font-bold uppercase tracking-[.06em] ${on ? "opacity-80" : "text-faint"}`}>
                      {t("you")}
                    </span>
                  )}
                </span>
                {on && <span aria-hidden="true">✓</span>}
              </Link>
            </li>
          );
        })}
      </ul>
      {anyLocked && <p className="mt-3 text-[12.5px] text-muted leading-snug">{t("lockedNote")}</p>}
    </>
  );
}

/* ---------------------------------------------------------------------- */

// A bottom sheet under xl, a small centred dialog at xl+. It stays in the
// DOM and `visibility` rides the transition: hidden→visible flips at once so
// the slide-in plays, visible→hidden waits for the slide-out to finish. No
// mount state, so nothing to set in an effect — the two effects below only
// touch things outside React (the key listener, body scroll, focus).
function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  // Scrim, Escape and Android Back go through history; a pick in the list
  // closes directly, so it never undoes the navigation it starts.
  const dismiss = useBackToClose(open, onClose);

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    },
    [dismiss],
  );
  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onKey]);

  return (
    <div className={`fixed inset-0 z-[60] ${open ? "" : "pointer-events-none"}`} role="presentation">
      <div
        onClick={dismiss}
        aria-hidden="true"
        className={`absolute inset-0 bg-[rgba(40,35,25,.38)] transition-[opacity,visibility] duration-200 ${
          open ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-hidden={!open}
        tabIndex={-1}
        className={`absolute left-0 right-0 bottom-0 xl:left-1/2 xl:right-auto xl:bottom-auto xl:top-1/2 xl:w-[360px] xl:-translate-x-1/2 bg-cream rounded-t-[20px] xl:rounded-[16px] px-4 pt-2.5 pb-[max(22px,env(safe-area-inset-bottom))] xl:p-5 shadow-[0_-12px_40px_rgba(0,0,0,.18)] xl:shadow-[0_20px_60px_rgba(0,0,0,.22)] outline-none transition-[transform,opacity,visibility] duration-[280ms] ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none ${
          open
            ? "translate-y-0 xl:-translate-y-1/2 opacity-100 visible"
            : "translate-y-[104%] xl:translate-y-[-40%] opacity-0 invisible"
        }`}
      >
        <div className="w-9 h-1 rounded-full bg-line mx-auto mb-3 xl:hidden" aria-hidden="true" />
        <b className="block text-[14px] font-extrabold mb-2.5">{title}</b>
        {children}
      </div>
    </div>
  );
}
