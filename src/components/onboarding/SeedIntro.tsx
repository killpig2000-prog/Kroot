"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import BrandMark from "@/components/ui/BrandMark";
import LanguageLinks from "@/components/ui/LanguageLinks";
import TraceCanvas from "@/components/hangul/TraceCanvas";
import { speakKorean } from "@/lib/tts";
import { playCorrect, playDayComplete, playTap } from "@/lib/sfx";

// The very first screen of the app — one garden scene that changes rather
// than a stack of cards:
//   0 sleeping seed  →  1 a tap opens its eyes  →  2 the Hangul sheet slides
//   up and the learner traces ㅅ  →  3 the seed hops awake, still a seed.
// It replaces the old "Can you read this?" Yes/No card: the two buttons on
// the last beat carry that same answer into the rest of onboarding. Nothing
// here is saved; the seed stays a seed on purpose (🌱 arrives at Lv.3, see
// treeStageForLevel) so the dashboard shows exactly what the learner just met.
//
// The scene is deliberately light-only — it's a picture, not chrome.

type Beat = 0 | 1 | 2 | 3;

const STROKE_KEYS = ["stroke1", "stroke2"] as const;

export default function SeedIntro({
  onDone,
  loginHref,
}: {
  /** Same answer the old gate card gave: can they already read Hangul? */
  onDone: (canRead: boolean) => void;
  loginHref: string;
}) {
  const t = useTranslations("onboarding.intro");
  const [beat, setBeat] = useState<Beat>(0);
  const [stroke, setStroke] = useState(0);
  const [traced, setTraced] = useState(false);
  const wakeTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (wakeTimer.current) window.clearTimeout(wakeTimer.current);
    };
  }, []);

  function wake() {
    if (beat !== 0) return;
    playTap();
    setBeat(1);
  }

  function openSheet() {
    playTap();
    setBeat(2);
  }

  function tracedAll() {
    if (traced) return;
    setTraced(true);
    playCorrect();
    speakKorean("ㅅ");
    wakeTimer.current = window.setTimeout(() => {
      setBeat(3);
      playDayComplete();
    }, 900);
  }

  const sub = traced ? t("traceDone") : t(STROKE_KEYS[Math.min(stroke, 1)]);

  return (
    // Phones: the garden is the whole screen. From md up a monitor of sky
    // around one seed reads as empty, so the same scene becomes a centred
    // 520px card on the cream page — the shape the result screen and the
    // sign-up card already take on desktop.
    <div className="min-h-[100dvh] bg-cream md:flex md:items-center md:justify-center md:px-6 md:py-8">
    <div
      className="relative min-h-[100dvh] overflow-hidden select-none md:min-h-0 md:h-[min(760px,88dvh)] md:w-full md:max-w-[520px] md:rounded-[26px] md:border md:border-line md:shadow-[0_24px_48px_-26px_rgba(74,66,55,.45)]"
      style={{ background: "linear-gradient(180deg,#FFF9EC 0%,#EAF4F3 42%,#BEE3F0 62%,#DFF3E4 100%)", color: "#4A4237" }}
      onClick={wake}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && beat === 0) {
          e.preventDefault();
          wake();
        }
      }}
      role={beat === 0 ? "button" : undefined}
      tabIndex={beat === 0 ? 0 : -1}
      aria-label={beat === 0 ? t("tapToWake") : undefined}
    >
      {/* hills — the width of the scene: the phone screen, or the desktop card */}
      <svg className="absolute left-[-4%] right-[-4%] bottom-0 w-[108%] h-[42%]" viewBox="0 0 800 200" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 110 C140 60 260 90 400 96 C540 102 660 50 800 92 L800 200 L0 200Z" fill="#CFE9D6" />
        <path d="M0 150 C160 120 300 140 440 132 C600 122 700 140 800 128 L800 200 L0 200Z" fill="#B9DDC3" />
        <path d="M0 176 C200 160 400 172 800 164 L800 200 L0 200Z" fill="#DFF3E4" />
      </svg>

      {/* everything the learner reads or taps sits in one phone-width column */}
      <div className="relative mx-auto w-full max-w-[420px] min-h-[100dvh] md:min-h-0 md:h-full">
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-[max(14px,env(safe-area-inset-top))] z-20">
          <Link href="/" className="flex items-center gap-2 font-semibold text-[16px] tracking-[-0.01em]" style={{ color: "#2E5B41" }} onClick={(e) => e.stopPropagation()}>
            <BrandMark size={26} />
            Kroot
          </Link>
          <span onClick={(e) => e.stopPropagation()}>
            <LanguageLinks className="text-[11.5px] text-[#8C8272]" />
          </span>
        </div>

        {/* beat 3 cheer */}
        <div
          className={`absolute left-0 right-0 top-[24%] text-center z-10 px-6 transition-all duration-500 ${
            beat === 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
          }`}
          aria-live="polite"
        >
          <b className="kr block text-[clamp(19px,5.4vw,22px)] font-bold" style={{ color: "#2E5B41" }}>
            첫 글자 완성! 씨앗이 깨어났어
          </b>
          <span className="block text-[12.5px] font-bold mt-1 tracking-[.03em]" style={{ color: "#8C8272" }}>
            {t("cheer")}
          </span>
        </div>

        {/* the seed — the app's own A1 creature, eyes open from beat 1 */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 z-[3] transition-all duration-700 ease-[cubic-bezier(.2,.8,.2,1)] ${
            beat === 2 ? "bottom-[54%] w-[clamp(120px,34vw,170px)]" : "bottom-[21%] w-[clamp(200px,60vw,290px)]"
          }`}
          style={{ aspectRatio: "220/230" }}
          aria-hidden="true"
        >
          <Seed beat={beat} />
        </div>

        {/* beat 1 bubble */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 z-[4] w-[224px] text-center rounded-[18px] px-4 py-3 transition-all duration-300 ${
            beat === 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
          }`}
          style={{
            bottom: "calc(21% + clamp(200px,60vw,290px) * 0.8)",
            background: "#FFFDF6",
            border: "1.5px solid #E3DDD0",
            boxShadow: "0 10px 24px -16px rgba(74,66,55,.5)",
          }}
        >
          <span className="kr block text-[14px] font-semibold leading-[1.5]">안녕! 난 씨앗이야.<br />한글 한 글자만 같이 써볼래?</span>
          <span className="block text-[11.5px] font-bold mt-1" style={{ color: "#8C8272" }}>
            {t("greeting")}
          </span>
          <span
            className="absolute left-1/2 -translate-x-1/2 -bottom-[8px] w-[14px] h-[14px] rotate-45"
            style={{ background: "#FFFDF6", borderRight: "1.5px solid #E3DDD0", borderBottom: "1.5px solid #E3DDD0" }}
          />
        </div>

        {/* bottom: hint / CTA / login */}
        <div className="absolute left-0 right-0 bottom-0 px-6 pb-[max(26px,env(safe-area-inset-bottom))] z-[5] flex flex-col items-center gap-3">
          {beat === 0 && (
            <>
              <span className="kr flex items-center gap-2 text-[13.5px] font-bold motion-safe:animate-[nudge_1.8s_ease-in-out_infinite]" style={{ color: "#2E5B41" }}>
                <span className="relative w-[18px] h-[18px] rounded-full border-2" style={{ borderColor: "#3E7C59" }}>
                  <span className="absolute -inset-[6px] rounded-full border-2 opacity-40 motion-safe:animate-[ripple_1.8s_ease-out_infinite]" style={{ borderColor: "#3E7C59" }} />
                </span>
                {t("tapToWake")}
              </span>
              <LoginLine href={loginHref} label={t("haveAccount")} cta={t("login")} />
            </>
          )}
          {beat === 1 && (
            <>
              <button type="button" className={CTA} onClick={(e) => { e.stopPropagation(); openSheet(); }}>
                {t("letsWrite")}
              </button>
              <LoginLine href={loginHref} label={t("haveAccount")} cta={t("login")} />
            </>
          )}
          {beat === 3 && (
            <>
              <button type="button" className={CTA} onClick={() => { playTap(); onDone(true); }}>
                {t("findLevel")}
              </button>
              <button
                type="button"
                className="text-[12.5px] font-bold underline underline-offset-4 decoration-[#CBC2B2] py-1"
                style={{ color: "#6B6560" }}
                onClick={() => { playTap(); onDone(false); }}
              >
                {t("cantRead")}
              </button>
              <span className="text-[11.5px] font-bold" style={{ color: "#8C8272" }}>{t("sproutNote")}</span>
            </>
          )}
        </div>

        {/* beat 2: the Hangul paper, same idiom as /hangul's bottom sheet */}
        <div
          className={`absolute left-0 right-0 bottom-0 h-[62%] rounded-t-[24px] px-4 pt-2.5 pb-4 z-[6] flex flex-col items-center gap-1.5 transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] ${
            beat === 2 ? "translate-y-0" : "translate-y-[104%]"
          }`}
          style={{ background: "#FFFDF6", borderTop: "1.5px dashed #DDD6C8", boxShadow: "0 -18px 40px -30px rgba(74,66,55,.5)" }}
          aria-hidden={beat !== 2}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="w-10 h-1 rounded-full" style={{ background: "#DDD6C8" }} />
          <h2 className="kr text-[16px] font-bold mt-1 mb-0">{t("traceTitle")}</h2>
          <p className="text-[12.5px] font-semibold m-0" style={{ color: "#6B6560" }} aria-live="polite">
            {sub}
          </p>
          {beat === 2 && (
            <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-center">
              <TraceCanvas
                char="ㅅ"
                mode="practice"
                locked={traced}
                className="w-[min(100%,48dvh)]"
                onActiveStrokeChange={setStroke}
                onPracticeDone={tracedAll}
              />
            </div>
          )}
          {!traced && (
            <button
              type="button"
              className="text-[11.5px] font-bold py-1"
              style={{ color: "#8C8272" }}
              onClick={() => { playTap(); setBeat(3); }}
            >
              {t("skipTrace")}
            </button>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}

const CTA =
  "w-full rounded-[14px] px-4 py-[14px] text-[15px] font-bold text-[#FFFDF6] bg-[#3E7C59] hover:bg-[#2E5B41] active:scale-[.98] transition-[transform,background-color] shadow-[0_10px_22px_-12px_rgba(62,124,89,.8)] focus-visible:outline-[3px] focus-visible:outline-[#FFD66B]";

function LoginLine({ href, label, cta }: { href: string; label: string; cta: string }) {
  return (
    <Link
      href={href}
      className="text-[12px] font-bold py-1"
      style={{ color: "#8C8272" }}
      onClick={(e) => e.stopPropagation()}
    >
      {label} · <u className="decoration-[#CBC2B2]">{cta}</u>
    </Link>
  );
}

// LevelCreature's A1 seed (same paths), but with the eyes as a switch and a
// second leaf + sparkles for the wake beat. Kept local: the dashboard seed
// must stay asleep with its zzz — that's what "Lv.1–2 = seed" looks like.
function Seed({ beat }: { beat: Beat }) {
  const awake = beat >= 1;
  const woke = beat === 3;
  return (
    <svg
      viewBox="0 0 220 230"
      className={`absolute inset-0 w-full h-full ${woke ? "motion-safe:animate-[seedHop_.75s_cubic-bezier(.3,1.6,.4,1)_both]" : ""}`}
      style={woke ? { transform: "translateY(-10px)" } : undefined}
    >
      <defs>
        <radialGradient id="si-seed" cx="38%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#B39066" />
          <stop offset="55%" stopColor="#8A6B4A" />
          <stop offset="100%" stopColor="#66492F" />
        </radialGradient>
        <linearGradient id="si-soil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9B48C" />
          <stop offset="100%" stopColor="#A88F66" />
        </linearGradient>
      </defs>
      <ellipse cx="110" cy="206" rx="46" ry="7.4" fill="url(#si-soil)" />
      <g stroke="#7BA05B" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M76 203 q-1 -6 3 -9 M80 204 q2 -5 6 -6" />
        <path d="M144 202 q1 -6 -3 -9 M140 203 q-2 -5 -6 -6" />
      </g>
      <ellipse cx="110" cy="202" rx="34" ry="7" fill="#DCC79E" />
      <g className="sway">
        <ellipse cx="110" cy="185" rx="25" ry="28" fill="url(#si-seed)" stroke="#5E4A34" strokeWidth="2" />
        <ellipse cx="101" cy="171" rx="7.5" ry="10" fill="#C8A87E" opacity=".55" />
        <path d="M104 190 q-8 1 -11 6" stroke="#6E5238" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity=".6" />
        <path d="M110 158 C110 147 117 141 128 139 C126 150 119 156 110 158Z" fill="#88C9A0" stroke="#5E9A72" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M112 156 C116 151 120 146 124 143" stroke="#5E9A72" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <g className="transition-opacity duration-300 delay-300" style={{ opacity: woke ? 1 : 0 }}>
          <path d="M110 158 C110 147 103 141 92 139 C94 150 101 156 110 158Z" fill="#9AD3AE" stroke="#5E9A72" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M108 156 C104 151 100 146 96 143" stroke="#5E9A72" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M146 150 L148.4 156 L154.4 158.4 L148.4 160.8 L146 166.8 L143.6 160.8 L137.6 158.4 L143.6 156Z" fill="#FFD66B" stroke="#E8B93E" strokeWidth="1" />
          <path d="M76 162 L77.6 165.8 L81.4 167.4 L77.6 169 L76 172.8 L74.4 169 L70.6 167.4 L74.4 165.8Z" fill="#FFD66B" opacity=".85" />
        </g>
        {/* asleep */}
        <g className="transition-opacity duration-200" style={{ opacity: awake ? 0 : 1 }}>
          <path d="M97 183 Q101 186.5 105 183" stroke="#4A3826" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M115 183 Q119 186.5 123 183" stroke="#4A3826" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <ellipse cx="110" cy="192" rx="2.6" ry="1.9" fill="#4A3826" />
          <text x="136" y="160" fontSize="12" fontWeight="800" fill="#A9987C" opacity=".9">z</text>
          <text x="145" y="149" fontSize="15" fontWeight="800" fill="#B9A88C" opacity=".7">z</text>
          <text x="155" y="138" fontSize="18" fontWeight="800" fill="#CBBB9E" opacity=".5">z</text>
        </g>
        {/* awake */}
        <g className="transition-opacity duration-200 delay-150" style={{ opacity: awake ? 1 : 0 }}>
          <g className="blink">
            <circle cx="101" cy="183" r="3" fill="#4A3826" />
            <circle cx="102" cy="182" r="1.1" fill="#fff" />
          </g>
          <g className="blink d2">
            <circle cx="119" cy="183" r="3" fill="#4A3826" />
            <circle cx="120" cy="182" r="1.1" fill="#fff" />
          </g>
          <path d="M104 191 Q110 196 116 191" stroke="#4A3826" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </g>
        <circle cx="93" cy="190" r="4" fill="#FF9E7D" opacity=".5" />
        <circle cx="127" cy="190" r="4" fill="#FF9E7D" opacity=".5" />
      </g>
    </svg>
  );
}
