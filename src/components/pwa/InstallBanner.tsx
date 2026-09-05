"use client";

import { useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { isIOS, isStandalone } from "@/lib/push-client";
import BrandMark from "@/components/ui/BrandMark";

type Deferred = { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const DISMISS_KEY = "kroot-install-dismissed";
const CHANGE_EVENT = "kroot:installable";

type Mode = "hidden" | "prompt" | "ios";

function dismissed(): boolean {
  try {
    return Number(localStorage.getItem(DISMISS_KEY) ?? 0) > Date.now();
  } catch {
    return false;
  }
}

// External state (browser install-ability) read through useSyncExternalStore
// so there's no setState-in-effect and the server render stays "hidden".
function snapshot(): Mode {
  if (isStandalone() || dismissed()) return "hidden";
  if (isIOS()) return "ios";
  const w = window as unknown as { __krootInstallPrompt?: Deferred };
  return w.__krootInstallPrompt ? "prompt" : "hidden";
}
function subscribe(cb: () => void) {
  window.addEventListener(CHANGE_EVENT, cb);
  return () => window.removeEventListener(CHANGE_EVENT, cb);
}

// "Add Kroot to your home screen" — shows on the dashboard once the browser
// says the site is installable (or on iOS, where we must explain the Share →
// Add to Home Screen dance). Hidden inside an installed app and for 14 days
// after a dismissal.
export default function InstallBanner({ streakDays }: { streakDays: number }) {
  const t = useTranslations("ui.install");
  const detected = useSyncExternalStore(subscribe, snapshot, () => "hidden" as Mode);
  const [closed, setClosed] = useState(false);
  const mode: Mode = closed ? "hidden" : detected;

  if (mode === "hidden") return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + 14 * 86_400_000));
    } catch {
      // ignore
    }
    setClosed(true);
  }

  async function install() {
    const w = window as unknown as { __krootInstallPrompt?: Deferred };
    const deferred = w.__krootInstallPrompt;
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    w.__krootInstallPrompt = undefined;
    if (outcome === "accepted") setClosed(true);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  }

  return (
    <div className="flex items-center gap-3.5 border border-line bg-warm rounded-[14px] px-5 py-3.5 mb-[30px] flex-wrap">
      <span className="flex-none w-10 h-10 rounded-[10px] overflow-hidden border border-line">
        <BrandMark size={40} />
      </span>
      <span className="flex-1 min-w-[170px]">
        <b className="block font-semibold text-sm">{t("title")}</b>
        <span className="text-[13px] text-muted">
          {mode === "ios"
            ? t("ios")
            : streakDays > 0
              ? t("streak", { count: streakDays })
              : t("generic")}
        </span>
      </span>
      <span className="flex items-center gap-2">
        {mode === "prompt" && (
          <button
            type="button"
            onClick={install}
            className="rounded-[9px] bg-success px-3.5 py-2 text-[13px] font-bold text-white hover:bg-success-deep transition-colors"
          >
            {t("install")}
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          className="text-[13px] font-semibold text-faint hover:text-charcoal px-2 py-2"
          aria-label={t("dismissAria")}
        >
          {t("notNow")}
        </button>
      </span>
    </div>
  );
}
