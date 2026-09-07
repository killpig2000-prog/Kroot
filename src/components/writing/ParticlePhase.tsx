"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { playCorrect, playWrong } from "@/lib/sfx";
import { explainWrong, PARTICLE_OPTIONS, type Particle, type ParticleItem } from "@/lib/particles";

const BTN_INK =
  "rounded-[11px] px-5 py-[11px] text-sm font-bold text-white bg-success hover:bg-success-deep transition-colors disabled:bg-line disabled:text-faint";
// The wrong-pick ink: one coral, not a token — this is the only place the
// writing flow says "no" in colour, and it must read the same on every theme.
const CORAL = "#D4705C";

/**
 * 조사 빈칸 — closes every writing chapter (2026-09-07 restructure): three
 * sentences with 은/는/이/가 blanked, immediate feedback on the tap, and when
 * the pick is wrong the *reason* under the sentence — the old grammar
 * lesson, arriving exactly when it's needed instead of as a page to read.
 * Order matters and is already checked by the tile boards before this; here
 * only the particle is in question.
 */
export default function ParticlePhase({
  items,
  chapterIndex,
  onDone,
}: {
  items: ParticleItem[];
  chapterIndex: number;
  /** Fired once after the last "Next sentence" with the number right (0..items.length). */
  onDone: (correct: number) => void;
}) {
  const t = useTranslations("writing.particles");
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<Particle | null>(null);
  const [correct, setCorrect] = useState(0);

  const item = items[index];
  const total = items.length;
  const isRight = picked !== null && picked === item.answer;
  const [before, after] = item.kr.split("__");
  const why = picked !== null && !isRight ? explainWrong(item, picked) : null;

  function pick(p: Particle) {
    if (picked !== null) return; // one tap per sentence — the verdict is final
    setPicked(p);
    if (p === item.answer) {
      setCorrect((c) => c + 1);
      playCorrect();
    } else {
      playWrong();
    }
  }

  function next() {
    if (picked === null) return;
    if (index + 1 >= total) {
      onDone(correct);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  }

  return (
    <div className="max-w-[560px] flex flex-col gap-3">
      <div className="flex items-center justify-between text-[12px] text-muted">
        <span className="font-extrabold tracking-[.1em] uppercase text-success">
          {t("eyebrow")} · {t("chapterN", { n: chapterIndex + 1 })}
        </span>
        <span className="tabular-nums">{t("counter", { n: index + 1, total })}</span>
      </div>

      {/* the sentence, the blank underlined — coral while it's empty or wrong, green once right */}
      <div className="border border-line bg-cream rounded-[14px] px-4 py-[18px] text-center">
        <p className="kr font-bold text-[clamp(18px,4.6vw,21px)] tracking-[-0.01em] leading-[1.5]">
          {before}
          <span
            className="inline-block min-w-[34px] border-b-2 px-0.5 mx-px"
            style={{ borderColor: isRight ? "var(--c-success)" : CORAL, color: isRight ? "var(--c-success)" : CORAL }}
          >
            {picked ?? " "}
          </span>
          {after}
        </p>
        <p className="text-[12.5px] text-muted mt-1.5">{item.en}</p>
      </div>

      <p className="text-[12.5px] text-muted -mt-1">{picked === null ? t("prompt") : isRight ? t("right") : t("wrong")}</p>

      {/* four tiles — always the same four, in the same order, so the hand learns them */}
      <div className="grid grid-cols-4 gap-2" role="group" aria-label={t("prompt")}>
        {PARTICLE_OPTIONS.map((p) => {
          const isPick = picked === p;
          const isAnswer = picked !== null && p === item.answer;
          let cls = "border-line bg-cream text-charcoal hover:border-success";
          let style: React.CSSProperties | undefined;
          if (isAnswer) cls = "border-success bg-success-bg text-success-deep";
          else if (isPick) {
            cls = "";
            style = { borderColor: CORAL, color: CORAL, background: "color-mix(in srgb, #D4705C 10%, var(--color-cream))" };
          }
          return (
            <button
              key={p}
              type="button"
              onClick={() => pick(p)}
              disabled={picked !== null}
              aria-pressed={isPick}
              className={`kr min-h-[48px] rounded-[12px] border-[1.5px] text-[18px] font-bold transition-colors disabled:cursor-default ${cls}`}
              style={style}
            >
              {p}
            </button>
          );
        })}
      </div>

      {/* why — the grammar lesson, only when it's needed */}
      {picked !== null && (
        <div
          className="rounded-r-[12px] bg-cream border border-line border-l-[3px] px-4 py-3 text-[13px] leading-[1.65]"
          style={{ borderLeftColor: why ? CORAL : "var(--c-success)" }}
        >
          <b className="block text-[11px] font-extrabold tracking-[.08em] uppercase mb-1" style={{ color: why ? CORAL : "var(--c-success-deep)" }}>
            {why ? t("whyWrong") : t("whyRight")}
          </b>
          {why && <p className="mb-1.5 text-charcoal">{why.headline}</p>}
          <p className="text-charcoal">{(why ?? item.why).rule}</p>
          <ul className="mt-2 flex flex-col gap-0.5 text-muted">
            {(why ?? item.why).examples.map((ex) => (
              <li key={ex} className="kr">
                {ex}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="sticky bottom-[72px] md:bottom-4 pt-1">
        <button type="button" className={`${BTN_INK} w-full`} onClick={next} disabled={picked === null}>
          {index + 1 >= total ? t("finish") : t("next")}
        </button>
      </div>
    </div>
  );
}
