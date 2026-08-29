"use client";

import { track } from "@/lib/analytics";

import { useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { speakKorean } from "@/lib/tts";
import Mascot from "@/components/onboarding/Mascot";
import CuteError from "@/components/ui/CuteError";
import Pot from "@/components/onboarding/Pot";
import { LEVELS, buildTest, levelFromWeighted } from "@/lib/level-test";
import { createClient } from "@/lib/supabase/client";
import BrandMark from "@/components/ui/BrandMark";

type Step = "signup" | "confirm" | "choice" | "quiz" | "result";

const STEP_DOT: Record<Step, number> = {
  signup: 1,
  confirm: 1,
  choice: 2,
  quiz: 3,
  result: 4,
};
const DOTS = [
  { id: 1, label: "Account" },
  { id: 2, label: "Start" },
  { id: 3, label: "Test" },
  { id: 4, label: "Level" },
];

const NATIVE_LANGUAGES = [
  "English",
  "Español",
  "Português",
  "日本語",
  "中文",
  "Tiếng Việt",
  "Bahasa Indonesia",
  "Français",
  "Deutsch",
  "العربية",
  "हिन्दी",
  "Other",
];

const CARD = "border border-line rounded-[14px] bg-cream p-[clamp(22px,4vw,32px)]";
const FIELD =
  "w-full px-3.5 py-[11px] text-[14px] border border-line rounded-[9px] bg-cream text-charcoal placeholder:text-faint focus:outline-none focus:border-success transition-colors";
const LABEL = "block text-[12.5px] font-semibold mb-[6px] text-charcoal";
const BTN_DARK =
  "inline-flex items-center justify-center rounded-[9px] bg-charcoal px-[18px] py-[9px] text-[13.5px] font-semibold text-white hover:bg-[#3F3F46] transition-colors";
const BTN_GREEN =
  "inline-flex items-center justify-center rounded-[9px] bg-success px-[18px] py-[9px] text-[13.5px] font-semibold text-white hover:bg-success-deep transition-colors";
const BTN_OUTLINE =
  "inline-flex items-center justify-center rounded-[9px] border border-line bg-cream px-[18px] py-[9px] text-[13.5px] font-semibold text-charcoal hover:bg-warm transition-colors";

function speak(text: string) {
  speakKorean(text, { rate: 0.9 });
}

function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/dashboard";
}

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [step, setStep] = useState<Step>("signup");
  // Seeded until the learner actually starts, so server and client render the
  // same markup; startQuiz() then draws a fresh random paper.
  const [test, setTest] = useState(() => buildTest(0));
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [weighted, setWeighted] = useState(0);
  const [result, setResult] = useState<{ code: string; desc: string; scoreLine: string } | null>(
    null
  );
  const [sproutUp, setSproutUp] = useState(false);
  // Auth callback failures land back here as ?error=<code>.
  const [signupError, setSignupError] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const errorCode = new URLSearchParams(window.location.search).get("error");
    if (!errorCode) return null;
    return errorCode === "auth"
      ? "That sign-in link failed or expired. Please try again."
      : decodeURIComponent(errorCode);
  });
  const [submitting, setSubmitting] = useState(false);
  // Where to land after onboarding. Public pages (e.g. /words/<slug>?save=1)
  // hand us a `next` so a brand-new signup returns to what they were doing.
  const [next] = useState(() =>
    typeof window === "undefined" ? "/dashboard" : safeNext(new URLSearchParams(window.location.search).get("next"))
  );
  const callbackNext = next === "/dashboard" ? "/onboarding" : `/onboarding?next=${encodeURIComponent(next)}`;

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      // A signed-in user who already picked a starting level (test or skip)
      // has finished onboarding — never send them through level choice again:
      // re-applying it would reset their level and progress.
      const { data } = await supabase
        .from("level_test_results")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);
      if (data && data.length > 0) {
        router.replace(next);
        return;
      }
      setStep((s) => (s === "signup" ? "choice" : s));
    });
  }, [supabase, router, next]);

  async function handleGoogleSignup() {
    setSignupError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackNext)}`,
        // Always show Google's account chooser instead of silently reusing
        // the last session — many learners share devices or test accounts.
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) setSignupError(error.message);
  }

  async function handleEmailSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSignupError(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("pw") || "");
    const nativeLanguage = String(form.get("lang") || "English");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name, native_language: nativeLanguage },
        // The confirmation link must land back here, not on the dashboard —
        // a confirmed learner still needs to pick a starting level.
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackNext)}`,
      },
    });

    setSubmitting(false);
    if (!error) track("signup", { native_language: nativeLanguage });

    if (error) {
      // Supabase's built-in mailer allows only a couple of emails per hour;
      // surface that as something a learner can act on.
      setSignupError(
        /rate limit/i.test(error.message)
          ? "We’ve sent too many emails just now — please wait a few minutes and try again, or continue with Google instead."
          : error.message
      );
      return;
    }

    if (data.session) {
      setStep("choice");
    } else {
      // Email confirmation is required before a session exists.
      setStep("confirm");
    }
  }

  function startQuiz() {
    setTest(buildTest());
    setQi(0);
    setScore(0);
    setWeighted(0);
    setStep("quiz");
  }

  async function saveLevelResult(opts: {
    code: string;
    finalScore: number;
    finalWeighted: number;
    skipped: boolean;
  }) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("level_test_results").insert({
      user_id: user.id,
      result_level: opts.code,
      score: opts.finalScore,
      total_questions: test.length,
      skipped: opts.skipped,
    });

    // Must run after the level_test_results insert — the RPC requires a recent
    // test row for anything above A1.
    const { error } = await supabase.rpc("apply_level_test", { p_level: opts.code });
    if (error) console.error("apply_level_test failed:", error.message);
    track("onboarding_completed", { level: opts.code, skipped: !!opts.skipped, score: opts.finalScore });
  }

  function answer(i: number) {
    const q = test[qi];
    let nextScore = score;
    let nextWeighted = weighted;
    if (i === q.ans) {
      nextScore = score + 1;
      nextWeighted = weighted + q.lv;
      setScore(nextScore);
      setWeighted(nextWeighted);
    }
    const nextQi = qi + 1;
    if (nextQi < test.length) {
      setQi(nextQi);
    } else {
      const lv = levelFromWeighted(nextWeighted);
      setResult({
        code: lv.code,
        desc: lv.desc,
        scoreLine: `You got ${nextScore} of ${test.length} right. `,
      });
      setStep("result");
      setSproutUp(false);
      setTimeout(() => setSproutUp(true), 250);
      void saveLevelResult({
        code: lv.code,
        finalScore: nextScore,
        finalWeighted: nextWeighted,
        skipped: false,
      });
    }
  }

  function skipToA1() {
    setResult({
      code: "A1",
      desc: LEVELS[0].desc + " You can take the test anytime from your profile.",
      scoreLine: "",
    });
    setStep("result");
    setSproutUp(false);
    setTimeout(() => setSproutUp(true), 250);
    void saveLevelResult({ code: "A1", finalScore: 0, finalWeighted: 0, skipped: true });
  }

  function finish() {
    router.push(next);
  }

  const activeDot = STEP_DOT[step];
  const pct = (qi / test.length) * 100;
  const q = test[qi];

  return (
    <div className="min-h-screen flex flex-col bg-cream text-charcoal">
      <header className="border-b border-line">
        <div className="max-w-[1160px] mx-auto flex items-center justify-between gap-4 px-[clamp(18px,5vw,44px)] py-3">
          <Link
            href="/"
            className="flex items-center gap-[9px] font-semibold text-[17px] tracking-[-0.01em]"
          >
            <BrandMark size={30} />
            Kroot
          </Link>
          <div className="flex items-center gap-1.5" aria-label="progress">
            {DOTS.map((d) => {
              const on = d.id <= activeDot;
              return (
                <span
                  key={d.id}
                  className={`rounded-md px-2 py-[3px] text-[11.5px] font-semibold border transition-colors ${
                    on
                      ? "bg-success-bg border-success-line text-success"
                      : "bg-cream border-line text-faint"
                  }`}
                >
                  {d.label}
                </span>
              );
            })}
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-[18px] py-[clamp(24px,4vw,48px)]">
        <div className="w-[min(520px,100%)]">
          {step === "signup" && (
            <section className="animate-[fade_.45s_cubic-bezier(.2,.8,.2,1)]">
              <div className={CARD}>
                <Mascot />
                <h1 className="text-center font-semibold text-[clamp(20px,3vw,25px)] tracking-[-0.02em] leading-[1.25] mb-1">
                  Plant your seed
                </h1>
                <p className="text-center text-muted text-[13.5px] mb-6">
                  Every big tree starts tiny. <span className="kr text-success">환영해요!</span>
                </p>

                <button type="button" className={`${BTN_OUTLINE} w-full mb-4`} onClick={handleGoogleSignup}>
                  Continue with Google
                </button>
                <div className="flex items-center gap-3 mb-5 text-[11.5px] font-medium text-faint">
                  <span className="flex-1 h-px bg-line" />
                  or with email
                  <span className="flex-1 h-px bg-line" />
                </div>

                <form onSubmit={handleEmailSignup}>
                  <div className="mb-3.5">
                    <label htmlFor="name" className={LABEL}>
                      What should we call you?
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      placeholder="Maria"
                      autoComplete="name"
                      className={FIELD}
                    />
                  </div>
                  <div className="mb-3.5">
                    <label htmlFor="email" className={LABEL}>
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="maria@email.com"
                      autoComplete="email"
                      className={FIELD}
                    />
                  </div>
                  <div className="mb-3.5">
                    <label htmlFor="pw" className={LABEL}>
                      Password
                    </label>
                    <input
                      id="pw"
                      name="pw"
                      type="password"
                      required
                      minLength={8}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      className={FIELD}
                    />
                  </div>
                  <div className="mb-5">
                    <label htmlFor="lang" className={LABEL}>
                      Your native language
                    </label>
                    <select id="lang" name="lang" className={FIELD}>
                      {NATIVE_LANGUAGES.map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                    <p className="text-[11.5px] text-faint mt-1.5">
                      We&apos;ll explain things in this language.
                    </p>
                  </div>

                  {signupError && <CuteError>{signupError}</CuteError>}

                  <button type="submit" disabled={submitting} className={`${BTN_GREEN} w-full disabled:opacity-60`}>
                    {submitting ? "Planting…" : "Plant my seed"}
                  </button>
                </form>
                <p className="text-center text-[12.5px] text-muted mt-4">
                  Already growing here?{" "}
                  <Link href="/auth/login" className="text-charcoal font-semibold hover:underline">
                    Log in
                  </Link>
                </p>
              </div>
            </section>
          )}

          {step === "confirm" && (
            <section className="animate-[fade_.45s_cubic-bezier(.2,.8,.2,1)]">
              <div className={`${CARD} text-center`}>
                <Mascot />
                <h1 className="font-semibold text-[clamp(20px,3vw,25px)] tracking-[-0.02em] leading-[1.25] mb-1.5">
                  Check your inbox
                </h1>
                <p className="text-muted text-[13.5px] leading-[1.6] mb-5">
                  We sent you a confirmation link — tap it, then log in to pick where your Korean
                  begins.
                </p>
                <Link
                  href="/auth/login"
                  className="inline-flex rounded-[9px] bg-success px-[22px] py-2.5 text-sm font-semibold text-white hover:bg-success-deep transition-colors"
                >
                  I confirmed — log me in
                </Link>
              </div>
            </section>
          )}

          {step === "choice" && (
            <section className="animate-[fade_.45s_cubic-bezier(.2,.8,.2,1)]">
              <div className={CARD}>
                <h1 className="text-center font-semibold text-[clamp(20px,3vw,25px)] tracking-[-0.02em] leading-[1.25] mb-1">
                  Where does your Korean begin?
                </h1>
                <p className="text-center text-muted text-[13.5px] mb-6">
                  A quick test finds your level — or start from the beginning.
                </p>

                <div className="grid gap-2.5">
                  <button
                    onClick={startQuiz}
                    className="text-left border border-line rounded-[14px] bg-cream px-[18px] py-4 transition-all duration-150 hover:border-success hover:bg-success-bg"
                  >
                    <span className="flex-none w-9 h-9 rounded-[9px] bg-success-bg border border-success-line flex items-center justify-center text-base mb-3">
                      🗺️
                    </span>
                    <b className="flex items-center gap-2 font-semibold text-[15px] mb-1">
                      Find my level
                      <span className="text-[11px] font-semibold text-success bg-success-bg border border-success-line rounded-md px-2 py-0.5">
                        Recommended
                      </span>
                    </b>
                    <span className="block text-[13px] text-muted leading-[1.55]">
                      10 short questions — words, grammar, and listening. Start right where you
                      belong.
                    </span>
                    <span className="inline-block mt-2.5 text-[11.5px] font-medium text-faint">
                      ~3 minutes
                    </span>
                  </button>
                  <button
                    onClick={skipToA1}
                    className="text-left border border-line rounded-[14px] bg-cream px-[18px] py-4 transition-all duration-150 hover:border-success hover:bg-success-bg"
                  >
                    <span className="flex-none w-9 h-9 rounded-[9px] bg-warm border border-line flex items-center justify-center text-base mb-3">
                      📖
                    </span>
                    <b className="block font-semibold text-[15px] mb-1">Start from the beginning</b>
                    <span className="block text-[13px] text-muted leading-[1.55]">
                      Begin fresh at A1. You can take the test anytime from your profile.
                    </span>
                    <span className="inline-block mt-2.5 text-[11.5px] font-medium text-faint">
                      Start at A1
                    </span>
                  </button>
                </div>
              </div>
            </section>
          )}

          {step === "quiz" && q && (
            <section className="animate-[fade_.45s_cubic-bezier(.2,.8,.2,1)]">
              <div className={CARD}>
                <div className="flex justify-between items-baseline mb-2.5 text-[12.5px] text-muted">
                  <span className="font-medium">
                    Question {qi + 1} of {test.length}
                  </span>
                  <span className="text-[11.5px] text-faint font-semibold">≈ 3 min</span>
                </div>
                <div className="h-1.5 bg-line rounded-full overflow-hidden mb-5">
                  <i
                    className="block h-full bg-success rounded-full transition-[width] duration-500 not-italic"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div>
                  <span className="inline-block text-[11.5px] font-semibold uppercase tracking-[0.06em] text-faint mb-2.5">
                    {q.type}
                  </span>
                  {q.audio ? (
                    <>
                      <div>
                        <button
                          onClick={() => speak(q.audio!)}
                          className={`${BTN_OUTLINE} gap-2 mb-4`}
                        >
                          🔊 Play the sound
                        </button>
                      </div>
                      <p className="text-[13.5px] text-muted mb-4">{q.ask}</p>
                    </>
                  ) : (
                    <>
                      <p className="kr text-[clamp(24px,3.6vw,30px)] text-charcoal mb-1.5 leading-[1.3]">
                        {q.word}
                      </p>
                      <p className="text-[13.5px] text-muted mb-4">{q.ask}</p>
                    </>
                  )}
                  <div className="grid gap-2">
                    {q.opts.map((opt, i) => (
                      <button
                        key={opt}
                        onClick={() => answer(i)}
                        className="text-left px-[14px] py-[11px] rounded-[9px] text-[13.5px] font-medium bg-cream border border-line text-charcoal transition-colors hover:border-success hover:bg-success-bg"
                      >
                        {opt}
                      </button>
                    ))}
                    <button
                      onClick={() => answer(-1)}
                      className="text-left px-[14px] py-[11px] rounded-[9px] text-[13.5px] font-medium bg-warm border border-dashed border-[#CFC8B8] text-muted transition-colors hover:border-faint hover:text-charcoal"
                    >
                      🤷 I don&apos;t know yet
                    </button>
                  </div>
                </div>

                <button
                  onClick={skipToA1}
                  className="block text-center mx-auto mt-5 text-[12.5px] font-medium text-faint hover:text-charcoal transition-colors"
                >
                  Not now — start at A1
                </button>
              </div>
            </section>
          )}

          {step === "result" && result && (
            <section className="animate-[fade_.45s_cubic-bezier(.2,.8,.2,1)]">
              <div className={`${CARD} text-center`}>
                <h1 className="font-semibold text-[clamp(20px,3vw,25px)] tracking-[-0.02em] leading-[1.25] mb-1">
                  Your seed is planted
                </h1>
                <p className="text-muted text-[13.5px] mb-6">
                  Here&apos;s where your Korean begins.
                </p>

                <Pot grown={sproutUp} />

                <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-faint mb-3">
                  Your level
                </p>
                <div className="flex gap-2 justify-center flex-wrap mb-4">
                  {LEVELS.map((lv) => (
                    <span
                      key={lv.code}
                      className={`rounded-[9px] px-3.5 py-1.5 text-[13px] font-semibold border ${
                        lv.code === result.code
                          ? "bg-success border-success text-white"
                          : "bg-cream border-line text-faint"
                      }`}
                    >
                      {lv.code}
                    </span>
                  ))}
                </div>
                <p className="text-[13px] text-muted max-w-[400px] mx-auto mb-6 leading-[1.6]">
                  {result.scoreLine}
                  {result.desc}
                </p>
                <button className={BTN_DARK} onClick={finish}>
                  Go to my garden
                </button>
                <p className="text-[11.5px] text-faint mt-3.5">
                  Retake the test anytime — your level grows as you do.
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
