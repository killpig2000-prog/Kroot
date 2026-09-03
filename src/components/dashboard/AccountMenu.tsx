"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { SEASONS, applySeasonToDocument, seasonForDate } from "@/lib/seasons";
import { applyModeToDocument, type ModeKey } from "@/lib/mode";

// The sidebar account button: opens a small settings menu with profile,
// the dark-mode and seasonal theme switches, and logout.
export default function AccountMenu({
  displayName,
  email,
  avatarUrl,
  compact = false,
}: {
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  /** Avatar-only trigger, menu opens downward — for the mobile top header,
   * which (unlike the sidebar column this was built for) has no room above it. */
  compact?: boolean;
}) {
  const t = useTranslations("dashboard.account");
  const supabase = useMemo(() => createClient(), []);
  const [open, setOpen] = useState(false);
  // Initial values come off the <html> attributes the layout rendered.
  const [seasonOn, setSeasonOn] = useState<boolean>(
    () => typeof document !== "undefined" && document.documentElement.hasAttribute("data-season"),
  );
  const [mode, setMode] = useState<ModeKey>(
    () => (typeof document !== "undefined" && document.documentElement.getAttribute("data-mode") === "dark"
      ? "dark"
      : "light"),
  );
  const [leaving, setLeaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  function toggleMode() {
    const next: ModeKey = mode === "dark" ? "light" : "dark";
    setMode(next);
    applyModeToDocument(next);
  }

  function toggleSeason() {
    const next = !seasonOn;
    setSeasonOn(next);
    applySeasonToDocument(next);
    // The always-mounted SeasonalEffects layer fades in/out on this event.
    window.dispatchEvent(new CustomEvent("kroot-season", { detail: { enabled: next } }));
  }

  async function logout() {
    setLeaving(true);
    // Clear local storage state, then let the server expire the auth cookies —
    // the browser client can't reliably delete cookies set with server options.
    await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    await fetch("/auth/signout", { method: "POST" }).catch(() => {});
    window.location.assign("/");
  }

  return (
    <div className="relative" ref={ref}>
      {open && (
        <div
          className={`absolute ${
            compact ? "top-full right-0 mt-2 w-[240px]" : "bottom-full left-0 right-0 mb-2"
          } bg-cream border border-line rounded-[14px] shadow-[0_8px_24px_rgba(0,0,0,.10)] p-2 z-50`}
        >
          <button
            onClick={toggleMode}
            className="w-full flex items-center justify-between rounded-[9px] px-3 py-2 text-[13px] font-medium text-charcoal hover:bg-warm"
          >
            <span>{mode === "dark" ? "🌙" : "☀️"} {t("darkMode")}</span>
            <span
              className={`w-9 h-5 rounded-full relative transition-colors ${
                mode === "dark" ? "bg-success" : "bg-line"
              }`}
              aria-hidden="true"
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                  mode === "dark" ? "left-[18px]" : "left-0.5"
                }`}
              />
            </span>
          </button>

          <button
            onClick={toggleSeason}
            className="w-full flex items-center justify-between rounded-[9px] px-3 py-2 text-[13px] font-medium text-charcoal hover:bg-warm"
          >
            <span>
              {SEASONS[seasonForDate(new Date())].emoji} {t("seasonalTheme")}
            </span>
            <span
              className={`w-9 h-5 rounded-full relative transition-colors ${
                seasonOn ? "bg-success" : "bg-line"
              }`}
              aria-hidden="true"
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                  seasonOn ? "left-[18px]" : "left-0.5"
                }`}
              />
            </span>
          </button>

          <div className="border-t border-line mt-1.5 pt-1.5">
            <button
              onClick={logout}
              disabled={leaving}
              className="w-full text-left rounded-[9px] px-3 py-2 text-[13px] font-medium text-[#EF4444] hover:bg-danger-bg disabled:opacity-60"
            >
              {leaving ? t("leaving") : `🚪 ${t("logout")}`}
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={compact ? `${displayName} — account` : undefined}
        className={
          compact
            ? "w-9 h-9 rounded-full bg-warm border border-line flex items-center justify-center text-base overflow-hidden flex-none"
            : `w-full flex items-center gap-2.5 rounded-[9px] px-3 py-[9px] text-left transition-colors ${
                open ? "bg-warm" : "hover:bg-warm"
              }`
        }
      >
        {compact ? (
          avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            "🦊"
          )
        ) : (
          <>
            <span className="w-[30px] h-[30px] rounded-lg bg-warm border border-line flex items-center justify-center text-sm overflow-hidden flex-none">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                "🦊"
              )}
            </span>
            <span className="min-w-0 flex-1">
              <b className="block text-[13.5px] font-semibold leading-tight truncate">{displayName}</b>
              <small className="block text-[11.5px] text-muted truncate">{email}</small>
            </span>
            <span className="flex-none text-[11px] text-faint">⚙️</span>
          </>
        )}
      </button>
    </div>
  );
}
