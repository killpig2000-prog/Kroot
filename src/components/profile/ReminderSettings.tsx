"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/analytics";
import {
  getExistingSubscription,
  isIOS,
  isStandalone,
  pushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push-client";

// Choices are LOCAL hours — the cron compares UTC, so we convert on save and
// back on display using this browser's offset. (A DST change can shift the
// real send time by an hour until the setting is touched again; acceptable
// for a "sometime in the evening" nudge and avoids a timezone column.)
const HOURS = [
  { local: 7, label: "Morning" },
  { local: 12, label: "Midday" },
  { local: 18, label: "Evening" },
  { local: 22, label: "Late" },
];
const offsetHours = () => Math.round(-new Date().getTimezoneOffset() / 60);
const localToUtc = (h: number) => (((h - offsetHours()) % 24) + 24) % 24;
const utcToLocal = (h: number) => (((h + offsetHours()) % 24) + 24) % 24;
const clock = (h: number) => `${((h + 11) % 12) + 1} ${h < 12 ? "am" : "pm"}`;
/** Nearest preset to a stored UTC hour, so the select never shows a blank. */
const nearestLocal = (utc: number) => {
  const local = utcToLocal(utc);
  return HOURS.reduce((best, h) =>
    Math.abs(h.local - local) < Math.abs(best.local - local) ? h : best
  ).local;
};

type Support = "unknown" | "ok" | "ios-install" | "none";
const subscribeNever = () => () => {};
function detectSupport(): Support {
  if (!pushSupported()) return isIOS() && !isStandalone() ? "ios-install" : "none";
  return "ok";
}

type Props = {
  userId: string;
  initialPush: boolean;
  initialEmail: boolean;
  initialHour: number;
  hasEmail: boolean;
};

// Reminders card on /profile: push toggle (Web Push), email toggle (Brevo),
// and the hour the daily nudge goes out.
export default function ReminderSettings({ userId, initialPush, initialEmail, initialHour, hasEmail }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [push, setPush] = useState(initialPush);
  const [email, setEmail] = useState(initialEmail);
  const [hour, setHour] = useState(initialHour);
  const [busy, setBusy] = useState<"push" | "email" | "hour" | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const support = useSyncExternalStore(subscribeNever, detectSupport, () => "unknown" as Support);
  const keyConfigured = !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    if (support !== "ok") return;
    // The profile flag can drift from the browser's actual subscription
    // (cleared site data, another device) — reflect this browser's truth.
    void getExistingSubscription().then((sub) => {
      if (sub) setPush(true);
    });
  }, [support]);

  async function togglePush() {
    setBusy("push");
    setNote(null);
    if (push) {
      await unsubscribeFromPush();
      await supabase.from("profiles").update({ reminder_push: false }).eq("id", userId);
      setPush(false);
    } else {
      const r = await subscribeToPush();
      if (r.ok) {
        setPush(true);
        track("reminder_optin", { channel: "push" });
      } else {
        setNote(
          r.reason === "denied"
            ? "Notifications are blocked for this site — allow them in your browser settings and try again."
            : r.reason === "no_key"
              ? "Push isn't set up on this deployment yet."
              : r.reason === "unsupported"
                ? "This browser doesn't support push notifications."
                : "Couldn't subscribe — please try again."
        );
      }
    }
    setBusy(null);
  }

  async function toggleEmail() {
    setBusy("email");
    setNote(null);
    const next = !email;
    const { error } = await supabase.from("profiles").update({ reminder_email: next }).eq("id", userId);
    if (error) setNote("Couldn't save — please try again.");
    else {
      setEmail(next);
      if (next) track("reminder_optin", { channel: "email" });
    }
    setBusy(null);
  }

  async function changeHour(localHour: number) {
    setBusy("hour");
    const utc = localToUtc(localHour);
    setHour(utc);
    await supabase.from("profiles").update({ reminder_hour: utc }).eq("id", userId);
    setBusy(null);
  }

  const pushDisabled = busy !== null || support === "none" || support === "ios-install" || !keyConfigured;

  return (
    <div id="reminders" className="border border-line rounded-[14px] px-[22px] py-5">
      <div className="flex items-baseline justify-between gap-3 mb-1 flex-wrap">
        <b className="font-semibold text-[15px]">⏰ Daily reminder</b>
        <small className="text-[12.5px] text-faint font-medium">Only when you haven&apos;t studied yet</small>
      </div>
      <p className="text-[13px] text-muted mb-4">
        A single nudge a day, and only on days your streak is at risk. Never more.
      </p>

      <div className="grid grid-cols-1 gap-3">
        <Row
          icon="📱"
          title="Push notification"
          desc={
            support === "ios-install"
              ? "On iPhone, add Kroot to your Home Screen first (Share → Add to Home Screen), then turn this on."
              : support === "none"
                ? "Not supported in this browser — try Chrome, Edge, or Firefox."
                : "Works on this device even when the tab is closed."
          }
          on={push}
          disabled={pushDisabled}
          busy={busy === "push"}
          onToggle={togglePush}
        />
        <Row
          icon="✉️"
          title="Email"
          desc={hasEmail ? "A short note to your sign-in email." : "Add an email to your account to use this."}
          on={email}
          disabled={busy !== null || !hasEmail}
          busy={busy === "email"}
          onToggle={toggleEmail}
        />

        <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
          <span className="text-[13.5px] font-semibold">Send it around</span>
          <select
            value={nearestLocal(hour)}
            disabled={busy !== null}
            onChange={(e) => changeHour(Number(e.target.value))}
            className="text-[13px] font-semibold border border-line rounded-[9px] px-3 py-2 bg-white"
          >
            {HOURS.map((h) => (
              <option key={h.local} value={h.local}>
                {h.label} · {clock(h.local)} your time
              </option>
            ))}
          </select>
        </div>
      </div>

      {note && <p className="mt-3 text-[12.5px] text-danger">{note}</p>}
    </div>
  );
}

function Row({
  icon,
  title,
  desc,
  on,
  disabled,
  busy,
  onToggle,
}: {
  icon: string;
  title: string;
  desc: string;
  on: boolean;
  disabled: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex-none w-9 h-9 rounded-[10px] bg-warm border border-line flex items-center justify-center text-base">
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <b className="block text-[13.5px] font-semibold">{title}</b>
        <span className="block text-[12.5px] text-muted leading-snug">{desc}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={title}
        disabled={disabled}
        onClick={onToggle}
        className={`relative flex-none w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
          on ? "bg-success" : "bg-line"
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
            on ? "left-[22px]" : "left-0.5"
          } ${busy ? "animate-pulse" : ""}`}
        />
      </button>
    </div>
  );
}
