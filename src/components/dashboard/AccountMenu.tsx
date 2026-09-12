"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

// The sidebar account button: opens a small menu with the two things you come
// to it for — Settings and logout.
//
// The dark-mode and seasonal-theme switches used to live here too, one row
// above a destructive action, and they were the *second* copy of controls that
// also folded open at the bottom of My room. Both sets now live on /settings,
// which this menu links to.
export default function AccountMenu({
  displayName: rawName,
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
  const displayName = rawName || email.split("@")[0];
  const t = useTranslations("dashboard.account");
  const ts = useTranslations("settings");
  const supabase = useMemo(() => createClient(), []);
  const [open, setOpen] = useState(false);
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
          } bg-cream border border-line rounded-[12px] shadow-[0_8px_24px_rgba(0,0,0,.10)] p-2 z-50`}
        >
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2 rounded-[12px] px-3 py-2 text-[12.5px] font-medium text-charcoal hover:bg-warm"
          >
            <span aria-hidden="true">⚙️</span>
            {ts("title")}
          </Link>

          <div className="border-t border-line mt-1.5 pt-1.5">
            <button
              onClick={logout}
              disabled={leaving}
              className="w-full text-left rounded-[12px] px-3 py-2 text-[12.5px] font-medium text-[#EF4444] hover:bg-danger-bg disabled:opacity-60"
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
            : `w-full flex items-center gap-2.5 rounded-[12px] px-3 py-[8px] text-left transition-colors ${
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
              <b className="block text-[14px] font-semibold leading-tight truncate">{displayName}</b>
              <small className="block text-[11px] text-muted truncate">{email}</small>
            </span>
            <span className="flex-none text-[11px] text-faint">⚙️</span>
          </>
        )}
      </button>
    </div>
  );
}
