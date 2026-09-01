import { useTranslations } from "next-intl";

// A static preview of the Pronunciation Trail — the prompt card you say
// into the mic, and the score card that follows. Not live/interactive, but
// the card chrome (score ring, SAY THIS/HOW TO MAKE IT/YOU SAID/TARGET
// treatment) is pulled from the same pronunciation.* message keys the real
// screen uses (PronunciationChallenge.tsx / ScoreResult.tsx) instead of
// re-typed landing copy, so this stays in sync as that UI evolves.
export default function PronunciationDemo() {
  const t = useTranslations("landing.pronunciation");
  const tp = useTranslations("pronunciation.practice");
  const ts = useTranslations("pronunciation.score");
  return (
    <section className="bg-warm border-t border-dashed border-dash py-[clamp(52px,8vw,88px)] px-6">
      <div className="text-center mb-1.5">
        <span className="inline-block bg-cream border-[1.5px] border-dashed border-dash rounded-full px-4 py-[5px] text-xs font-extrabold text-teal -rotate-1">
          {t("badge")} · <span className="kr">발음 도장깨기</span>
        </span>
      </div>
      <h2 className="text-center font-black text-[clamp(22px,3vw,30px)] tracking-[-0.02em] text-charcoal mb-2 text-balance">
        {t("title")}
      </h2>
      <p className="text-center text-muted text-[13.5px] max-w-[52ch] mx-auto mb-9">
        {t("sub")}
      </p>

      <div className="flex justify-center items-center gap-4 flex-wrap max-w-[820px] mx-auto">
        {/* prompt card — mirrors PronunciationChallenge.tsx's word card */}
        <div className="w-[min(320px,100%)] bg-cream border border-line rounded-[16px] p-5 shadow-[0_14px_30px_-16px_rgba(60,50,30,.3)] -rotate-1">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-teal bg-[var(--tint-teal)] border border-[var(--tint-teal-line)] rounded-full px-3 py-1">
              {t("chapterTag")}
            </span>
            <span className="text-[11px] font-bold text-faint">{t("best")}</span>
          </div>

          <p className="text-[10.5px] font-bold tracking-[.06em] uppercase text-faint mb-1.5">
            {tp("sayThis")}
          </p>
          <p className="kr font-bold text-[34px] leading-[1.2] mb-1">라면</p>
          <p className="text-[13px] text-[#8A8478] mb-4">{t("gloss")}</p>

          <div className="flex items-start gap-2.5 bg-[var(--tint-teal)] border border-[var(--tint-teal-line)] rounded-xl px-3.5 py-3 mb-4">
            <span className="w-8 h-8 rounded-full flex-none bg-teal text-white text-[13px] grid place-items-center">
              🔊
            </span>
            <div className="min-w-0">
              <b className="block text-[10px] font-bold tracking-[.06em] text-faint mb-0.5">
                {tp("howToMakeIt")}
              </b>
              <p className="text-[11.5px] text-charcoal leading-[1.55]">{t("tip")}</p>
            </div>
          </div>

          <div className="flex justify-center">
            <span className="w-[58px] h-[58px] rounded-full bg-teal text-white grid place-items-center text-[22px] shadow-[0_4px_0_#0f766e]">
              🎤
            </span>
          </div>
        </div>

        <span aria-hidden="true" className="text-[26px] text-[#CFC8B8] rotate-90 sm:rotate-0">→</span>

        {/* result card — mirrors ScoreResult.tsx's ring + YOU SAID/TARGET cards */}
        <div className="w-[min(320px,100%)] bg-cream border border-success-line rounded-[16px] p-5 shadow-[0_14px_30px_-16px_rgba(60,50,30,.3)] rotate-1 flex flex-col items-center">
          <div
            className="w-[104px] h-[104px] rounded-full flex items-center justify-center mb-2.5"
            style={{ background: "conic-gradient(#3E7C59 331deg, #E3DDD0 0)" }}
          >
            <div className="w-[86px] h-[86px] rounded-full bg-cream flex flex-col items-center justify-center">
              <span className="font-bold text-[26px] leading-none text-success-deep">92</span>
              <span className="text-[9px] text-faint font-semibold">{ts("match")}</span>
            </div>
          </div>
          <p className="text-[15px] font-bold text-success-deep mb-3.5">{ts("great")}</p>

          <div className="grid gap-2 w-full mb-3.5">
            <div className="bg-warm border border-line rounded-[10px] px-3 py-2">
              <b className="block text-[9.5px] font-bold tracking-[.06em] text-faint mb-0.5">{ts("youSaid")}</b>
              <p className="kr text-[14px] font-medium">라면</p>
            </div>
            <div className="bg-[var(--tint-teal)] border border-[var(--tint-teal-line)] rounded-[10px] px-3 py-2">
              <b className="block text-[9.5px] font-bold tracking-[.06em] text-teal mb-0.5">{ts("target")}</b>
              <p className="kr text-[14px] font-medium">라면</p>
            </div>
          </div>

          <p className="text-center text-[11.5px] text-muted border-t border-dashed border-line pt-3 w-full">
            {t.rich("footer", { b: (chunks) => <b className="text-teal">{chunks}</b> })}
          </p>
        </div>
      </div>
    </section>
  );
}
