"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
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
import { Row, Sheet, Switch } from "@/components/settings/SettingsList";

// There used to be a "send it around" picker here with four local-hour presets
// (Morning/Midday/Evening/Late) written into profiles.reminder_hour. The cron
// can only run once a day on Vercel Hobby, so three of the four choices were a
// lie and the popular one ("Evening" → 22:00 UTC in the US) meant the reminder
// never arrived at all. The picker is gone rather than kept as decoration: we
// send one nudge a day at 18:00 UTC and now say so. reminder_hour is left in
// the database untouched in case a paid plan ever makes a real schedule
// possible — nothing reads it any more.
const CRON_UTC_HOUR = 18;
/** 18:00 UTC as an hour on this browser's clock — null on the server, where we can't know it. */
const localSendHour = () =>
  (((CRON_UTC_HOUR + Math.round(-new Date().getTimezoneOffset() / 60)) % 24) + 24) % 24;

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

// The Daily reminder screen in Settings: push toggle (Web Push) and email
// toggle (Brevo), on the shared white sheet. The screen draws the title; this
// draws the schedule line and the two rows.
export default function ReminderSettings({ userId, initialPush, initialEmail, hasEmail }: Props) {
  const t = useTranslations("profile.reminders");
  const locale = useLocale();
  const supabase = useMemo(() => createClient(), []);
  const [push, setPush] = useState(initialPush);
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState<"push" | "email" | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const support = useSyncExternalStore(subscribeNever, detectSupport, () => "unknown" as Support);
  const sendHour = useSyncExternalStore<number | null>(subscribeNever, localSendHour, () => null);
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
            ? t("errBlocked")
            : r.reason === "no_key"
              ? t("errNoKey")
              : r.reason === "unsupported"
                ? t("errUnsupported")
                : t("errSubscribe")
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
    if (error) setNote(t("errSave"));
    else {
      setEmail(next);
      if (next) track("reminder_optin", { channel: "email" });
    }
    setBusy(null);
  }

  const pushDisabled = busy !== null || support === "none" || support === "ios-install" || !keyConfigured;

  return (
    <div id="reminders" className="flex flex-col gap-2">
      <p className="text-[12.5px] text-muted -mt-1 mb-1">
        {sendHour === null
          ? t("scheduleUnknown")
          : t("scheduleKnown", {
              // client-only branch, so a locale-formatted hour can't desync hydration
              time: new Date(2000, 0, 1, sendHour).toLocaleTimeString(locale, { hour: "numeric" }),
            })}
      </p>

      <Sheet>
        <Row
          title={t("pushTitle")}
          desc={
            support === "ios-install"
              ? t("pushIos")
              : support === "none"
                ? t("pushUnsupported")
                : t("pushDesc")
          }
          trailing={
            <Switch on={push} onToggle={togglePush} label={t("pushTitle")} disabled={pushDisabled || busy === "push"} />
          }
        />
        <Row
          title={t("emailTitle")}
          desc={hasEmail ? undefined : t("emailNone")}
          trailing={
            <Switch on={email} onToggle={toggleEmail} label={t("emailTitle")} disabled={busy !== null || !hasEmail} />
          }
        />
      </Sheet>

      {note && <p className="text-[12.5px] text-danger px-1">{note}</p>}
    </div>
  );
}
