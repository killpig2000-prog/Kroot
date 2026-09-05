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
import {
  answerRun,
  buildTest,
  decodePlacement,
  encodePlacement,
  orderForGoal,
  placementFromRun,
  replaceCurrent,
  skippedPlacement,
  startRun,
  type FirstLessonsMap,
  type Goal,
  type Placement,
  type Run,
} from "@/lib/level-test";
import { GateCard, GoalCard } from "./PlacementIntro";
import PlacementQuiz from "./PlacementQuiz";
import PlacementResult from "./PlacementResult";
import { ConfirmCard, SignupCard } from "./SignupCard";
import { CARD, FADE } from "./styles";

// Onboarding, test first and account last:
//   gate (can you read Hangul?) → goal → adaptive test → result → sign-up → inbox
// Nothing is saved until there is a user. The placement survives the sign-up
// round trip in the callback URL (?p=) with sessionStorage as a same-tab
// backup, and is written the moment a signed-in learner lands back here.

type Step = "gate" | "goal" | "quiz" | "result" | "signup" | "confirm" | "saving";

const PLACEMENT_KEY = "kroot-placement";
const STEPS: { id: Step; label: "hangul" | "goal" | "test" | "level" | "account" }[] = [
  { id: "gate", label: "hangul" },
  { id: "goal", label: "goal" },
  { id: "quiz", label: "test" },
  { id: "result", label: "level" },
  { id: "signup", label: "account" },
];
const STEP_INDEX: Record<Step, number> = { gate: 0, goal: 1, quiz: 2, result: 3, signup: 4, confirm: 4, saving: 4 };

function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return stripLocale(raw);
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
  // Seeded until the learner actually starts, so server and client render the
  // same markup; startQuiz() then draws a fresh random paper.
  const [run, setRun] = useState<Run>(() => startRun(buildTest(0)));
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [email, setEmail] = useState("");
  const [resent, setResent] = useState(false);
  const [sending, setSending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(() =>
    params.error === "auth" ? t("errors.authFailed") : params.error ? decodeURIComponent(params.error) : null
  );
  const saving = useRef(false);
  // When the currently-shown question first appeared — lets placement_question
  // report how long each question took, without needing extra state/rerenders.
  const questionShownAt = useRef(Date.now());

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
  // test they had just sat. The entry carries the quiz run too, so Back works
  // question-by-question inside the test.
  useEffect(() => {
    window.history.replaceState({ ...window.history.state, kroot: { step: stepRef.current } }, "");
    function onPop(e: PopStateEvent) {
      // Once we are off /onboarding the browser has left the flow; let it.
      if (!window.location.pathname.endsWith("/onboarding")) return;
      const snap = (e.state as { kroot?: { step: Step; run?: Run } } | null)?.kroot;
      stepRef.current = snap?.step ?? "gate";
      setStep(stepRef.current);
      if (snap?.run) setRun(snap.run);
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Advance a step and record it, so Back can come back to where we were.
  // The pushState must stay outside the setState updater: React re-invokes
  // updaters in development, which would push the entry twice and make Back
  // need two presses per step.
  const goToStep = useCallback((next: Step, snapshotRun?: Run) => {
    if (stepRef.current === next && !snapshotRun) return;
    stepRef.current = next;
    window.history.pushState({ ...window.history.state, kroot: { step: next, run: snapshotRun } }, "");
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
      stepRef.current = "saving";
      setStep("saving");
      await supabase.from("level_test_results").insert({
        user_id: uid,
        result_level: p.level,
        score: p.score,
        total_questions: p.total,
        skipped: p.skipped,
      });
      // Must run after the insert — the RPC requires a recent test row for
      // anything above A1.
      const { error: applyErr } = await supabase.rpc("apply_level_test", { p_level: p.level });
      if (applyErr) console.error("apply_level_test failed:", applyErr.message);
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
        score: p.score,
        total: p.total,
        goal: p.goal,
      });
      writeStored(null);
      // Always the real dashboard (with its first-visit tour) — not the
      // learner's first recommended lesson. That recommendation still shows
      // on the result/signup cards; it was never meant to be where the
      // account actually lands.
      router.push(params.next);
    },
    [supabase, router, params.next]
  );

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      // A signed-in learner who already picked a starting level has finished
      // onboarding — never send them through it again: re-applying it would
      // reset their level and progress.
      const { data } = await supabase.from("level_test_results").select("id").eq("user_id", user.id).limit(1);
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
      const fresh = startRun(buildTest());
      setRun(fresh);
      questionShownAt.current = Date.now();
      track("level_test_started", { kind: "placement" });
      goToStep("quiz", fresh);
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
      questions: p.total,
      stopped_at: p.stoppedAt,
    });
    goToStep("result");
  }

  function answer(choice: number) {
    const q = run.paper[run.index];
    const next = answerRun(run, choice);
    const ms = Date.now() - questionShownAt.current;
    track("placement_question", { band: q.lv, type: q.type, right: choice === q.ans, unknown: choice === -1, ms });
    questionShownAt.current = Date.now();
    setRun(next);
    if (next.done) {
      showResult(placementFromRun(next, goal));
    } else {
      window.history.pushState({ ...window.history.state, kroot: { step: "quiz", run: next } }, "");
    }
  }

  function replaceQuestion() {
    setRun(replaceCurrent(run));
    questionShownAt.current = Date.now();
  }

  function skipToA1() {
    showResult(skippedPlacement(canRead ?? true, goal));
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
    if (!placement) return;
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackNext(placement))}`,
        // Always show Google's account chooser instead of silently reusing
        // the last session — many learners share devices or test accounts.
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) setError(error.message);
  }

  // Email + password. The password is what every later login uses; the
  // inbox is visited exactly once, to confirm the address (link or code).
  async function signUp(addr: string, name: string, password: string) {
    if (!placement) return;
    setError(null);
    setSending(true);
    try {
      const redirect = `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackNext(placement))}`;
      const { data, error } = await supabase.auth.signUp({
        email: addr,
        password,
        options: {
          emailRedirectTo: redirect,
          data: { display_name: name || undefined, goal: placement.goal ?? undefined },
        },
      });
      if (error) {
        setError(
          /rate limit/i.test(error.message)
            ? t("errors.rateLimit")
            : /already registered|already exists/i.test(error.message)
              ? t("errors.exists")
              : error.message
        );
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
      // Already confirmed (autoconfirm on) — nothing to wait for.
      if (data.session) {
        window.location.assign(callbackNext(placement));
        return;
      }
      goToStep("confirm");
      setResendCooldown(30);
    } catch {
      setError(t("errors.network"));
    } finally {
      // Sign-up is the one button that must never die on a dropped request:
      // the learner has just finished the placement test to get here.
      setSending(false);
    }
  }

  // Another copy of the confirmation mail (link + code) to the same address.
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
        setError(/rate limit/i.test(error.message) ? t("errors.rateLimit") : error.message);
        return;
      }
      setResent(true);
      setResendCooldown(30);
    } catch {
      setError(t("errors.network"));
    } finally {
      setSending(false);
    }
  }

  // The same sign-in, by the code printed in the email instead of the link.
  // Mail providers that scan links for phishing (Naver and most corporate
  // gateways do) open the link themselves before the learner ever sees it,
  // and the link is single-use — so it arrives already spent and reads as
  // "expired". A typed code is the one path a scanner cannot consume.
  async function verifyCode(code: string) {
    if (!placement) return;
    setError(null);
    setVerifying(true);
    try {
      const res = await verifyEmailCode(supabase, email, code);
      if (!res.ok) {
        setError(/rate limit/i.test(res.message) ? t("errors.rateLimit") : t("errors.badCode"));
        return;
      }
      track("signup", { method: "email_code", goal: placement.goal });
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

  return (
    <div className="min-h-screen flex flex-col bg-cream text-charcoal">
      <header className="border-b border-line">
        <div className="max-w-[1160px] mx-auto flex items-center justify-between gap-4 px-[clamp(18px,5vw,44px)] py-3">
          <Link href="/" className="flex items-center gap-[9px] font-semibold text-[17px] tracking-[-0.01em]">
            <BrandMark size={30} />
            Kroot
          </Link>
          <div className="flex items-center gap-1.5" aria-label="progress">
            {steps.map((s, i) => (
              <span
                key={s.id}
                className={`rounded-md px-2 py-[3px] text-[11.5px] font-semibold border transition-colors ${
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
          {step === "gate" && <GateCard onAnswer={gate} />}
          {step === "goal" && <GoalCard canRead={!!canRead} goal={goal} onPick={setGoal} onContinue={afterGoal} />}
          {step === "quiz" && (
            <PlacementQuiz run={run} onAnswer={answer} onReplace={replaceQuestion} onSkipAll={skipToA1} />
          )}
          {step === "result" && placement && (
            <PlacementResult
              placement={placement}
              lessons={orderedLessons(placement)}
              signedIn={!!userId}
              busy={false}
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
                <p className="text-[34px] mb-1">🌱</p>
                <b className="block text-[17px]">{t("saving.title")}</b>
                {placement && <p className="text-muted text-[13.5px] mt-1">{t("saving.sub", { level: placement.level })}</p>}
              </div>
            </section>
          )}
        </div>
      </main>

      <style>{`@keyframes fade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
