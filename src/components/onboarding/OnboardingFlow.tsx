"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { stripLocale } from "@/i18n/locale";
import LanguageLinks from "@/components/ui/LanguageLinks";
import BrandMark from "@/components/ui/BrandMark";
import { track } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";
import { verifyEmailCode } from "@/lib/verify-email-code";
import { authErrorKey, MAX_CODE_TRIES, MIN_PASSWORD, normalizeEmail } from "@/lib/auth-errors";
import {
  SURVEY_KEYS,
  decodePlacement,
  encodePlacement,
  orderForGoal,
  skippedPlacement,
  suggestLevel,
  surveyPlacement,
  type FirstLessonsMap,
  type Goal,
  type Placement,
} from "@/lib/level-test";
import type { CefrLevel } from "@/lib/tree";
import { GoalCard } from "./PlacementIntro";
import SeedIntro from "./SeedIntro";
import SurveyStep from "./SurveyStep";
import PlacementResult from "./PlacementResult";
import { ConfirmCard, SignupCard } from "./SignupCard";
import { BTN_GREEN, BTN_OUTLINE, CARD, FADE } from "./styles";

// Onboarding, level first and account last:
//   gate (can you read Hangul?) → goal → survey → result → sign-up → inbox
// The level is self-reported (three "which sounds like you?" questions) and
// can be changed on the result card, and later in Settings.
// Nothing is saved until there is a user. The placement survives the sign-up
// round trip in the callback URL (?p=) with sessionStorage as a same-tab
// backup, and is written the moment a signed-in learner lands back here.

type Step = "gate" | "goal" | "survey" | "result" | "signup" | "confirm" | "saving";

const PLACEMENT_KEY = "kroot-placement";
const STEPS: { id: Step; label: "hangul" | "goal" | "test" | "level" | "account" }[] = [
  { id: "gate", label: "hangul" },
  { id: "goal", label: "goal" },
  { id: "survey", label: "test" },
  { id: "result", label: "level" },
  { id: "signup", label: "account" },
];
const STEP_INDEX: Record<Step, number> = { gate: 0, goal: 1, survey: 2, result: 3, signup: 4, confirm: 4, saving: 4 };

// Same-site paths only. "//host" is protocol-relative and "/\host" parses
// the same way in browsers (a backslash is a slash to the URL parser), so
// both would carry a freshly signed-in visitor off the site.
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !/^\/[/\\]/.test(raw)) return stripLocale(raw);
  return "/dashboard";
}

function readStored(): Placement | null {
  try {
    return decodePlacement(sessionStorage.getItem(PLACEMENT_KEY));
  } catch {
    return null;
  }
}
function writeStored(p: Placement | null) {
  try {
    if (p) sessionStorage.setItem(PLACEMENT_KEY, encodePlacement(p));
    else sessionStorage.removeItem(PLACEMENT_KEY);
  } catch {
    // private mode — the URL copy still carries it
  }
}

export default function OnboardingFlow({
  lessons,
  hasPlacement = false,
}: {
  lessons: FirstLessonsMap;
  /**
   * Known server-side from ?p= (see page.tsx): true means this render is a
   * visitor returning from the auth redirect with a placement already in
   * hand, about to be saved by the mount effect below almost immediately.
   * Deciding this client-only (via window.location) instead rendered "gate"
   * on the server and "saving" on the client's first paint — a hydration
   * mismatch that also flashed the Hangul-gate card on screen either way.
   */
  hasPlacement?: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("onboarding");
  const supabase = useMemo(() => createClient(), []);

  // Query params are read once, client-side only (the page is static).
  const [params] = useState(() => {
    if (typeof window === "undefined") return { next: "/dashboard", p: null as string | null, error: null as string | null };
    const sp = new URLSearchParams(window.location.search);
    return { next: safeNext(sp.get("next")), p: sp.get("p"), error: sp.get("error") };
  });
  const customNext = params.next !== "/dashboard";

  const [step, setStep] = useState<Step>(hasPlacement ? "saving" : "gate");
  const stepRef = useRef<Step>(step);
  const [userId, setUserId] = useState<string | null>(null);
  const [canRead, setCanRead] = useState<boolean | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [answers, setAnswers] = useState<(CefrLevel | null)[]>(() => SURVEY_KEYS.map(() => null));
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [email, setEmail] = useState("");
  const [resent, setResent] = useState(false);
  const [sending, setSending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verifying, setVerifying] = useState(false);
  // Wrong codes in a row on the confirm card; past MAX_CODE_TRIES the advice
  // switches from "check it" to "get a new one".
  const [codeTries, setCodeTries] = useState(0);
  // ?error= is attacker-controllable (any link can set it), so only a known
  // value renders — never the parameter's own text. decodeURIComponent on a
  // malformed value also throws, which took the whole page down.
  const [error, setError] = useState<string | null>(() => (params.error ? t("errors.authFailed") : null));
  const saving = useRef(false);
  // The save step failed and the learner is holding a placement we couldn't
  // apply — show a way forward instead of an endless 🌱.
  const [saveFailed, setSaveFailed] = useState(false);

  // A tick-down after every magic-link send — stops accidental double-taps
  // from burning into the mailer's hourly rate limit (see errors.rateLimit).
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  // Every forward move gets its own history entry, so the browser Back button
  // walks back through the wizard. Without this the whole flow lived in one
  // entry and Back ejected the learner to the landing page, losing the level
  // survey they had just answered. The entry carries the answers too, so Back
  // works question-by-question inside the survey.
  useEffect(() => {
    window.history.replaceState({ ...window.history.state, kroot: { step: stepRef.current } }, "");
    function onPop(e: PopStateEvent) {
      // Once we are off /onboarding the browser has left the flow; let it.
      if (!window.location.pathname.endsWith("/onboarding")) return;
      const snap = (e.state as { kroot?: { step: Step; answers?: (CefrLevel | null)[] } } | null)?.kroot;
      stepRef.current = snap?.step ?? "gate";
      setStep(stepRef.current);
      if (snap?.answers) setAnswers(snap.answers);
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Advance a step and record it, so Back can come back to where we were.
  // The pushState must stay outside the setState updater: React re-invokes
  // updaters in development, which would push the entry twice and make Back
  // need two presses per step.
  const goToStep = useCallback((next: Step, snapshot?: (CefrLevel | null)[]) => {
    if (stepRef.current === next && !snapshot) return;
    stepRef.current = next;
    window.history.pushState({ ...window.history.state, kroot: { step: next, answers: snapshot } }, "");
    setStep(next);
  }, []);

  const orderedLessons = useCallback(
    (p: Placement) => orderForGoal(lessons[p.route] ?? lessons[p.level], p.goal),
    [lessons]
  );

  const save = useCallback(
    async (p: Placement, uid: string) => {
      if (saving.current) return;
      saving.current = true;
      setSaveFailed(false);
      stepRef.current = "saving";
      setStep("saving");
      try {
      // The chosen level is recorded in this row: without it apply_level_test
      // has nothing recent to trust and silently places them at A1. It is also
      // the "onboarded" marker the dashboard and the mount effect below read.
      // A failure here has to stop the flow, not fall through to a wrong level.
      const { error: insertErr } = await supabase.from("level_test_results").insert({
        user_id: uid,
        result_level: p.level,
        score: 0,
        total_questions: 0,
        skipped: p.skipped,
      });
      if (insertErr) throw new Error(`level_test_results insert failed: ${insertErr.message}`);
      // Must run after the insert — the RPC requires a recent test row for
      // anything above A1.
      const { error: applyErr } = await supabase.rpc("apply_level_test", { p_level: p.level });
      if (applyErr) throw new Error(`apply_level_test failed: ${applyErr.message}`);
      if (p.goal) {
        // Only reached when the learner was already signed in (Google OAuth,
        // or a repeat run) — a magic-link sign-up carries the goal in its
        // metadata and handle_new_user() stores it. This UPDATE needs the
        // column-level grant from migration 0048; without it Postgres answers
        // "permission denied for table profiles" and the answer is lost.
        const { error: goalErr } = await supabase.from("profiles").update({ goal: p.goal }).eq("id", uid);
        if (goalErr) console.error("goal save failed:", goalErr.message);
      }
      track("onboarding_completed", {
        level: p.level,
        route: p.route,
        skipped: p.skipped,
        suggested: p.suggested,
        goal: p.goal,
      });
      writeStored(null);
      // Always the real dashboard — not the learner's first recommended
      // lesson. That recommendation still shows on the result/signup cards;
      // it was never meant to be where the account actually lands.
      router.push(params.next);
      } catch (err) {
        // Every new account passes through here. A dropped connection used to
        // leave `saving.current` latched and the step stuck on "saving", so the
        // 🌱 card rendered forever with no button and no error — and reloading
        // re-entered the same trap through the mount effect below. The
        // placement stays in sessionStorage so Retry can replay it.
        console.error("onboarding save failed:", err instanceof Error ? err.message : err);
        writeStored(p);
        setSaveFailed(true);
      } finally {
        saving.current = false;
      }
    },
    [supabase, router, params.next]
  );

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(async ({ data: { user } }) => {
        if (!user) return;
        setUserId(user.id);
        // A signed-in learner who already picked a starting level has finished
        // onboarding — never send them through it again: re-applying it would
        // reset their level and progress.
        //
        // The error has to be checked, not just the rows: a failed select
        // returns no data, which reads as "never placed". Paired with a stale
        // ?p= (an old bookmark, a shared link, Back after sign-up) that used to
        // re-run save() on an established account and reset it to the level in
        // the URL. When we can't tell, assume they're placed and bail out.
        const { data, error } = await supabase
          .from("level_test_results")
          .select("id")
          .eq("user_id", user.id)
          .limit(1);
        if (error) {
          console.error("level_test_results lookup failed:", error.message);
          router.replace(params.next);
          return;
        }
        if (data && data.length > 0) {
          router.replace(params.next);
          return;
        }
        // Back from sign-up with a placement in hand: save it and go.
        const stored = decodePlacement(params.p) ?? readStored();
        if (stored) {
          setPlacement(stored);
          void save(stored, user.id);
        }
      })
      .catch((err) => {
        // Offline on arrival: stay on the gate rather than rejecting unhandled.
        console.error("onboarding session lookup failed:", err instanceof Error ? err.message : err);
      });
  }, [supabase, router, params.next, params.p, save]);

  // ---- steps ----
  function gate(v: boolean) {
    setCanRead(v);
    track("placement_gate", { can_read: v });
    goToStep("goal");
  }

  function afterGoal() {
    if (goal) track("placement_gate", { goal });
    if (canRead) {
      const fresh = SURVEY_KEYS.map(() => null);
      setAnswers(fresh);
      track("level_test_started", { kind: "survey" });
      goToStep("survey", fresh);
    } else {
      showResult(skippedPlacement(false, goal));
    }
  }

  function showResult(p: Placement) {
    setPlacement(p);
    writeStored(p);
    track("placement_finished", {
      level: p.level,
      route: p.route,
      skipped: p.skipped,
      suggested: p.suggested,
    });
    goToStep("result");
  }

  function answer(index: number, level: CefrLevel) {
    const next = answers.map((a, i) => (i === index ? level : a));
    track("placement_question", { key: SURVEY_KEYS[index], level });
    setAnswers(next);
    if (next.every((a): a is CefrLevel => a !== null)) {
      const suggested = suggestLevel(next);
      showResult(surveyPlacement(suggested, suggested, goal));
    } else {
      window.history.pushState({ ...window.history.state, kroot: { step: "survey", answers: next } }, "");
    }
  }

  function skipSurvey() {
    showResult(skippedPlacement(canRead ?? true, goal));
  }

  // The result card's level chips: the survey only suggests, the learner decides.
  function pickLevel(level: CefrLevel) {
    if (!placement || placement.route === "hangul") return;
    const p = { ...placement, level, route: level };
    setPlacement(p);
    writeStored(p);
  }

  function afterResult() {
    if (!placement) return;
    if (userId) {
      void save(placement, userId);
      return;
    }
    track("signup_started", { level: placement.level, goal: placement.goal });
    setError(null);
    goToStep("signup");
  }

  // Where the auth callback should send them: back here, placement attached.
  function callbackNext(p: Placement) {
    const sp = new URLSearchParams({ p: encodePlacement(p) });
    if (customNext) sp.set("next", params.next);
    return `/onboarding?${sp.toString()}`;
  }

  async function google() {
    if (!placement || sending) return;
    setError(null);
    setSending(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackNext(placement))}`,
          // Always show Google's account chooser instead of silently reusing
          // the last session — many learners share devices or test accounts.
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) setError(t(`errors.${authErrorKey(error)}`));
    } catch {
      // Offline, this rejected unhandled: the tap did nothing and said
      // nothing, and the button stayed live as if it hadn't been pressed.
      setError(t("errors.network"));
    } finally {
      setSending(false);
    }
  }

  // Email + password. The password is what every later login uses; the
  // inbox is visited exactly once, to confirm the address (by code).
  async function signUp(rawEmail: string, name: string, password: string) {
    if (!placement) return;
    setError(null);
    // The form's required/minLength attributes are advisory — anyone can
    // strip them in devtools — so the same rules hold here.
    const addr = normalizeEmail(rawEmail);
    if (!addr) {
      setError(t("errors.badEmail"));
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(t("errors.weakPassword"));
      return;
    }
    setSending(true);
    try {
      const redirect = `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackNext(placement))}`;
      const { data, error } = await supabase.auth.signUp({
        email: addr,
        password,
        options: {
          emailRedirectTo: redirect,
          data: { display_name: name.trim().slice(0, 40) || undefined, goal: placement.goal ?? undefined },
        },
      });
      if (error) {
        setError(t(`errors.${authErrorKey(error)}`));
        return;
      }
      // With confirmations on, Supabase answers a sign-up for an address that
      // already has an account with a placeholder user that carries no
      // identities (so the response can't be used to probe for accounts).
      // That learner needs the login page, not another confirmation mail.
      if (data.user && data.user.identities?.length === 0) {
        setError(t("errors.exists"));
        return;
      }
      track("signup", { method: "password", goal: placement.goal });
      setEmail(addr);
      setCodeTries(0);
      // Already confirmed (autoconfirm on) — nothing to wait for.
      if (data.session) {
        window.location.assign(callbackNext(placement));
        return;
      }
      goToStep("confirm");
      // Matches the mailer's minimum gap between two mails to one address
      // (smtp_max_frequency = 60s); a shorter cooldown just surfaced its
      // "for security purposes" refusal.
      setResendCooldown(60);
    } catch {
      setError(t("errors.network"));
    } finally {
      // Sign-up is the one button that must never die on a dropped request:
      // the learner has just picked a level to get here.
      setSending(false);
    }
  }

  // Another copy of the confirmation code to the same address.
  async function resend() {
    if (!placement || !email) return;
    setError(null);
    setSending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackNext(placement))}`,
        },
      });
      if (error) {
        setError(t(`errors.${authErrorKey(error)}`));
        return;
      }
      setResent(true);
      setCodeTries(0);
      setResendCooldown(60);
    } catch {
      setError(t("errors.network"));
    } finally {
      setSending(false);
    }
  }

  // Confirm the address with the emailed code. A typed code (rather than a
  // link) is the one path that works in every inbox: mail providers that
  // scan links for phishing (Naver, most corporate gateways) open a link
  // themselves first, and a one-shot link arrives already spent.
  async function verifyCode(code: string) {
    if (!placement || verifying) return;
    setError(null);
    setVerifying(true);
    try {
      const res = await verifyEmailCode(supabase, email, code);
      if (!res.ok) {
        const tries = res.key === "badCode" ? codeTries + 1 : codeTries;
        setCodeTries(tries);
        setError(t(`errors.${res.key === "badCode" && tries >= MAX_CODE_TRIES ? "tooManyTries" : res.key}`));
        return;
      }
      track("signup_confirmed", { goal: placement.goal });
      // Hand off to the same URL the email link would have landed on, so the
      // placement is saved by the one path that already does it. A full
      // navigation, not router.push: the server has to see the new session
      // cookies this call just wrote.
      window.location.assign(callbackNext(placement));
    } catch {
      setError(t("errors.network"));
    } finally {
      setVerifying(false);
    }
  }

  const active = STEP_INDEX[step];
  const steps = userId ? STEPS.slice(0, 4) : STEPS;
  const loginHref = customNext ? `/auth/login?next=${encodeURIComponent(params.next)}` : "/auth/login";
  const firstLesson = placement ? orderedLessons(placement)[0] : undefined;

  // The first screen is a garden, not a card: the seed intro owns the whole
  // viewport and hands back the same "can you read Hangul?" answer the old
  // gate card did, so everything after it is unchanged.
  if (step === "gate") return <SeedIntro onDone={gate} loginHref={loginHref} />;

  return (
    <div className="min-h-screen flex flex-col bg-cream text-charcoal">
      <header className="border-b border-line">
        <div className="max-w-[1160px] mx-auto flex items-center justify-between gap-4 px-[clamp(18px,5vw,44px)] py-3">
          <Link href="/" className="flex-none flex items-center gap-[9px] font-semibold text-[17px] tracking-[-0.01em]">
            <BrandMark size={30} />
            Kroot
          </Link>
          {/* Five labels run past a 360px phone in longer languages: the row
              scrolls inside itself rather than pushing the page sideways. */}
          <div className="min-w-0 flex items-center gap-1 sm:gap-1.5 overflow-x-auto" aria-label="progress">
            {steps.map((s, i) => (
              <span
                key={s.id}
                className={`flex-none rounded-md px-1.5 sm:px-2 py-[3px] text-[11.5px] font-semibold border transition-colors ${
                  i <= active ? "bg-success-bg border-success-line text-success" : "bg-cream border-line text-faint"
                }`}
              >
                {t(`steps.${s.label}`)}
              </span>
            ))}
          </div>
        </div>
      </header>
      <LanguageLinks className="text-center text-[12px] text-faint pt-3" />

      <main className="flex-1 flex items-center justify-center px-[18px] py-[clamp(24px,4vw,48px)]">
        <div className="w-[min(520px,100%)]">
          {step === "goal" && <GoalCard canRead={!!canRead} goal={goal} onPick={setGoal} onContinue={afterGoal} />}
          {step === "survey" && <SurveyStep answers={answers} onAnswer={answer} onSkip={skipSurvey} />}
          {step === "result" && placement && (
            <PlacementResult
              placement={placement}
              lessons={orderedLessons(placement)}
              signedIn={!!userId}
              busy={false}
              onPickLevel={pickLevel}
              onContinue={afterResult}
            />
          )}
          {step === "signup" && placement && (
            <SignupCard
              placement={placement}
              firstLesson={firstLesson}
              loginHref={loginHref}
              error={error}
              sending={sending}
              onGoogle={google}
              onSignUp={signUp}
            />
          )}
          {step === "confirm" && (
            <ConfirmCard
              email={email}
              firstLesson={firstLesson}
              resent={resent}
              sending={sending}
              cooldown={resendCooldown}
              error={error}
              verifying={verifying}
              onVerifyCode={verifyCode}
              onResend={resend}
              onChangeEmail={() => {
                setResent(false);
                window.history.back();
              }}
            />
          )}
          {step === "saving" && (
            <section className={FADE}>
              <div className={`${CARD} text-center`}>
                {saveFailed ? (
                  <>
                    <p className="text-[34px] mb-1">🌧️</p>
                    <b className="block text-[17px]">{t("saving.failedTitle")}</b>
                    <p className="text-muted text-[13.5px] mt-1">{t("saving.failedSub")}</p>
                    <div className="grid gap-2 mt-4">
                      <button
                        type="button"
                        className={`${BTN_GREEN} w-full`}
                        onClick={() => {
                          if (placement && userId) void save(placement, userId);
                        }}
                      >
                        {t("saving.retry")}
                      </button>
                      {/* Never a dead end: the account exists either way, and
                          the dashboard's own onboarding redirect will ask for a
                          level again if this never landed. */}
                      <button
                        type="button"
                        className={`${BTN_OUTLINE} w-full`}
                        onClick={() => router.push(params.next)}
                      >
                        {t("saving.continueAnyway")}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[34px] mb-1">🌱</p>
                    <b className="block text-[17px]">{t("saving.title")}</b>
                    {placement && (
                      <p className="text-muted text-[13.5px] mt-1">{t("saving.sub", { level: placement.level })}</p>
                    )}
                  </>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      <style>{`@keyframes fade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
