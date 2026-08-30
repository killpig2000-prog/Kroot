"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import BrandMark from "@/components/ui/BrandMark";
import { track } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";
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
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
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

export default function OnboardingFlow({ lessons }: { lessons: FirstLessonsMap }) {
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

  const [step, setStep] = useState<Step>("gate");
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
  const [error, setError] = useState<string | null>(() =>
    params.error === "auth" ? t("errors.authFailed") : params.error ? decodeURIComponent(params.error) : null
  );
  const saving = useRef(false);

  const orderedLessons = useCallback(
    (p: Placement) => orderForGoal(lessons[p.route] ?? lessons[p.level], p.goal),
    [lessons]
  );

  const save = useCallback(
    async (p: Placement, uid: string) => {
      if (saving.current) return;
      saving.current = true;
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
        // Column arrives with migration 0036; harmless until then.
        const { error: goalErr } = await supabase.from("profiles").update({ goal: p.goal }).eq("id", uid);
        if (goalErr && !/goal/.test(goalErr.message)) console.error("goal save failed:", goalErr.message);
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
      const first = orderedLessons(p)[0];
      router.push(customNext ? params.next : (first?.href ?? "/dashboard"));
    },
    [supabase, router, customNext, params.next, orderedLessons]
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
    setStep("goal");
  }

  function afterGoal() {
    if (goal) track("placement_gate", { goal });
    if (canRead) {
      setRun(startRun(buildTest()));
      track("level_test_started", { kind: "placement" });
      setStep("quiz");
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
    setStep("result");
  }

  function answer(choice: number) {
    const q = run.paper[run.index];
    const next = answerRun(run, choice);
    track("placement_question", { band: q.lv, type: q.type, right: choice === q.ans, unknown: choice === -1 });
    setRun(next);
    if (next.done) showResult(placementFromRun(next, goal));
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
    setStep("signup");
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

  async function magicLink(addr: string, name: string) {
    if (!placement) return;
    setError(null);
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: addr,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackNext(placement))}`,
        data: { display_name: name || undefined, goal: placement.goal ?? undefined },
      },
    });
    setSending(false);
    if (error) {
      // The mailer allows only a handful of emails per hour; make that actionable.
      setError(
        /rate limit/i.test(error.message)
          ? t("errors.rateLimit")
          : error.message
      );
      return;
    }
    track("signup", { method: "magic_link", goal: placement.goal });
    if (step === "confirm") setResent(true);
    setEmail(addr);
    setStep("confirm");
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

      <main className="flex-1 flex items-center justify-center px-[18px] py-[clamp(24px,4vw,48px)]">
        <div className="w-[min(520px,100%)]">
          {step === "gate" && <GateCard onAnswer={gate} />}
          {step === "goal" && <GoalCard canRead={!!canRead} goal={goal} onPick={setGoal} onContinue={afterGoal} />}
          {step === "quiz" && (
            <PlacementQuiz run={run} onAnswer={answer} onReplace={() => setRun(replaceCurrent(run))} onSkipAll={skipToA1} />
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
              onMagicLink={magicLink}
            />
          )}
          {step === "confirm" && (
            <ConfirmCard
              email={email}
              firstLesson={firstLesson}
              resent={resent}
              sending={sending}
              onResend={() => magicLink(email, "")}
              onChangeEmail={() => {
                setResent(false);
                setStep("signup");
              }}
            />
          )}
          {step === "saving" && (
            <section className={FADE}>
              <div className={`${CARD} text-center`}>
                <p className="text-[34px] mb-1">🌱</p>
                <b className="block text-[17px]">{t("saving.title")}</b>
                <p className="text-muted text-[13.5px] mt-1">
                  {placement ? t("saving.sub", { level: placement.level }) : t("saving.moment")}
                </p>
              </div>
            </section>
          )}
        </div>
      </main>

      <style>{`@keyframes fade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
