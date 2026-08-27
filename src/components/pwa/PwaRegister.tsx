"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";
import { registerServiceWorker } from "@/lib/push-client";

// Mounted once in the root layout: registers the service worker and records
// PWA installs. The install *prompt* itself lives in InstallBanner (dashboard)
// so it only appears where a returning learner would want it.
declare global {
  interface WindowEventMap {
    beforeinstallprompt: Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
  }
}

export default function PwaRegister() {
  useEffect(() => {
    void registerServiceWorker();

    const onInstalled = () => track("pwa_installed");
    window.addEventListener("appinstalled", onInstalled);

    // Stash the deferred prompt so InstallBanner can trigger it later.
    const onBip = (e: WindowEventMap["beforeinstallprompt"]) => {
      e.preventDefault();
      (window as unknown as { __krootInstallPrompt?: unknown }).__krootInstallPrompt = e;
      window.dispatchEvent(new CustomEvent("kroot:installable"));
    };
    window.addEventListener("beforeinstallprompt", onBip);

    // First open from the installed app counts as an install on iOS, which
    // never fires appinstalled.
    try {
      if (new URLSearchParams(location.search).get("source") === "pwa" && !sessionStorage.getItem("kroot-pwa-open")) {
        sessionStorage.setItem("kroot-pwa-open", "1");
        track("session_started", { source: "pwa" });
      }
    } catch {
      // storage blocked
    }

    return () => {
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("beforeinstallprompt", onBip);
    };
  }, []);

  return null;
}
