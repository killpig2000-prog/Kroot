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

// There used to be a "send it around" picker here with four local-hour presets
// (Morning/Midday/Evening/Late) written into profiles.reminder_hour. The cron
// can only run once a day on Vercel Hobby, so three of the four choices were a
// lie and the popular one ("Evening" → 22:00 UTC in the US) meant the reminder
// never arrived at all. The picker is gone rather than kept as decoration: we
// send one nudge a day at 18:00 UTC and now say so. reminder_hour is left in
// the database untouched in case a paid plan ever makes a real schedule
// possible — nothing reads it any more.
const CRON_UTC_HOUR = 18;
const clock = (h: number) => `${((h + 11) % 12) + 1} ${h < 12 ? "am" : "pm"}`;
/** 18:00 UTC in this browser's clock — null on the server, where we can't know it. */
const localSendTime = () =>
  clock((((CRON_UTC_HOUR + Math.round(-new Date().getTimezoneOffset() / 60)) % 24) + 24) % 24);

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
  hasEmail: boolean;
};

// Reminders card on /profile: push toggle (Web Push) and email toggle (Brevo).
export default function ReminderSettings({ userId, initialPush, initialEmail, hasEmail }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [push, setPush] = useState(initialPush);
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState<"push" | "email" | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const support = useSyncExternalStore(subscribeNever, detectSupport, () => "unknown" as Support);
  const sendTime = useSyncExternalStore<string | null>(subscribeNever, localSendTime, () => null);
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

  const pushDisabled = busy !== null || support === "none" || support === "ios-install" || !keyConfigured;

  return (
    <div id="reminders" className="border border-line rounded-[14px] px-[22px] py-5">
      <div className="flex items-baseline justify-between gap-3 mb-4 flex-wrap">
        <b className="font-semibold text-[15px]">⏰ Daily reminder</b>
        <small className="text-[12.5px] text-faint font-medium">
          {sendTime ? `Once a day, around ${sendTime}` : "Once a day"} — only if you haven&apos;t studied yet
        </small>
      </div>

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
