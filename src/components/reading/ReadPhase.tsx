import type { Passage } from "@/lib/reading";
import { buttonClassName } from "@/components/ui/Button";

const BTN_BLUE = buttonClassName("sky");
const LABEL = "text-[11.5px] font-semibold tracking-[.06em] uppercase text-faint mb-2";

// Shared translation reveal used by every genre-specific layout below —
// blurred placeholder until the reader taps "Show translation".
export function TranslatableText({
  en,
  showTranslation,
  className = "",
}: {
  en: string;
  showTranslation: boolean;
  className?: string;
}) {
  return (
    <p
      className={`transition-all rounded ${
        showTranslation ? "text-muted" : "text-transparent bg-[#F4F4F5] select-none"
      } ${className}`}
    >
      {en || " "}
    </p>
  );
}

// The "read" phase of a reading session: picks a bilingual layout by genre
// (chat bubbles, posted notice, email, interview transcript, numbered
// instructions, review card, or the default book spread) and shows the same
// header/continue-button shell around whichever one applies.
export default function ReadPhase({
  passage,
  chapterIndex,
  showTranslation,
  onToggleTranslation,
  onContinue,
}: {
  passage: Passage;
  chapterIndex: number;
  showTranslation: boolean;
  onToggleTranslation: () => void;
  onContinue: () => void;
}) {
  const genre = passage.genre;
  // Structured genres author real \n line breaks (speaker turns, sign lines,
  // steps, paragraphs) — split ONLY on those so a multi-sentence turn/step
  // doesn't get chopped mid-line. Flowing prose (diary/story/explainer/none)
  // still splits sentence-by-sentence for the book-spread layout.
  const structured = genre === "dialogue" || genre === "message" || genre === "notice" || genre === "email" || genre === "instruction" || genre === "interview";
  const krLines = (structured ? passage.body_kr.split("\n") : passage.body_kr.split(/(?<=[.!?])\s+/)).filter(Boolean);
  const enLines = (structured ? passage.body_en.split("\n") : passage.body_en.split(/(?<=[.!?])\s+/)).filter(Boolean);
  const lines = krLines.map((kr, i) => ({ kr, en: enLines[i] ?? "" }));

  const header = (
    <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
      <span className="text-[11.5px] font-semibold text-sky-deep bg-[#EFF6FF] border border-sky-line rounded-md px-2 py-0.5">
        Chapter {chapterIndex + 1}
      </span>
      <button
        onClick={onToggleTranslation}
        className="text-[12.5px] font-semibold text-muted hover:text-charcoal transition-colors"
      >
        {showTranslation ? "Hide translation" : "Show translation"}
      </button>
    </div>
  );
  const continueButton = (
    <div className="flex justify-end mt-5">
      <button className={BTN_BLUE} onClick={onContinue}>
        Answer the questions →
      </button>
    </div>
  );

  // ---------- Dialogue / Message: chat bubbles (translation beside, not below) ----------
  if (genre === "dialogue" || genre === "message") {
    const speakers: string[] = [];
    const turns = lines.map(({ kr, en }) => {
      const krIdx = kr.indexOf(":");
      const speaker = krIdx === -1 ? "" : kr.slice(0, krIdx).trim();
      const text = krIdx === -1 ? kr : kr.slice(krIdx + 1).trim();
      const enIdx = en.indexOf(":");
      const enText = enIdx === -1 ? en : en.slice(enIdx + 1).trim();
      if (speaker && !speakers.includes(speaker)) speakers.push(speaker);
      const side = speakers.indexOf(speaker) % 2 === 1 ? "right" : "left";
      return { speaker, text, enText, side };
    });

    return (
      <div className="max-w-[780px] border border-line rounded-[14px] p-[clamp(20px,3vw,28px)]">
        {header}
        <div className="rounded-[10px] border border-line bg-[#F5F4F0] p-[clamp(16px,3vw,24px)] grid gap-4">
          {turns.map((t, i) => {
            const bubble = (
              <div className="flex flex-col flex-none max-w-[380px]" key="bubble">
                {t.speaker && (
                  <span className={`text-[11px] font-semibold text-faint mb-1 px-1 ${t.side === "right" ? "text-right" : ""}`}>
                    {t.speaker}
                  </span>
                )}
                <div
                  className={`rounded-[14px] px-4 py-2.5 ${
                    t.side === "right"
                      ? "bg-sky-deep text-white rounded-tr-[4px]"
                      : "bg-white border border-line rounded-tl-[4px]"
                  }`}
                >
                  <p className="kr text-[15px] leading-[1.6]">{t.text}</p>
                </div>
              </div>
            );
            const translation = (
              <TranslatableText
                key="translation"
                en={t.enText}
                showTranslation={showTranslation}
                className={`text-[12.5px] flex-1 min-w-[120px] self-center ${t.side === "right" ? "text-right" : ""}`}
              />
            );
            return (
              <div key={i} className={`flex items-center gap-3 ${t.side === "right" ? "justify-end" : "justify-start"}`}>
                {t.side === "right" ? [translation, bubble] : [bubble, translation]}
              </div>
            );
          })}
        </div>
        {continueButton}
      </div>
    );
  }

  // ---------- Notice: posted sign, bilingual side by side (common on real Korean signs) ----------
  if (genre === "notice") {
    return (
      <div className="max-w-[780px] border border-line rounded-[14px] p-[clamp(20px,3vw,28px)]">
        {header}
        <div className="relative mx-auto max-w-[620px] -rotate-1 bg-[#FFFDF7] border-2 border-dashed border-line rounded-[8px] p-[clamp(22px,4vw,30px)] shadow-[0_2px_10px_rgba(24,20,10,.06)]">
          <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xl drop-shadow-sm">📌</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
            <div className="grid gap-2.5 sm:text-right">
              {lines.map((line, i) => (
                <p key={i} className={`kr leading-[1.7] ${i === 0 ? "font-bold text-[17px]" : "text-[15px]"}`}>
                  {line.kr}
                </p>
              ))}
            </div>
            <div className="grid gap-2.5">
              {lines.map((line, i) => (
                <TranslatableText key={i} en={line.en} showTranslation={showTranslation} className="text-[13px]" />
              ))}
            </div>
          </div>
        </div>
        {continueButton}
      </div>
    );
  }

  // ---------- Email: envelope card, Korean | English columns ----------
  if (genre === "email") {
    return (
      <div className="max-w-[860px] border border-line rounded-[14px] p-[clamp(20px,3vw,28px)]">
        {header}
        <div className="rounded-[10px] border border-line overflow-hidden bg-white">
          <div className="flex items-center gap-2.5 px-5 py-3.5 bg-[#EFF6FF] border-b border-sky-line">
            <span className="text-lg flex-none">✉️</span>
            <div className="min-w-0">
              <p className="text-[10.5px] font-semibold text-muted uppercase tracking-[.05em]">Subject</p>
              <p className="kr font-semibold text-[15px] truncate">{passage.title_kr}</p>
              <TranslatableText en={passage.title_en} showTranslation={showTranslation} className="text-[12px] truncate" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2">
            <div className="p-[clamp(16px,3vw,24px)] sm:border-r border-b sm:border-b-0 border-line grid gap-3 content-start">
              {lines.map((line, i) => (
                <p key={i} className="kr text-[15px] leading-[1.8]">
                  {line.kr}
                </p>
              ))}
            </div>
            <div className="p-[clamp(16px,3vw,24px)] grid gap-3 content-start">
              {lines.map((line, i) => (
                <TranslatableText key={i} en={line.en} showTranslation={showTranslation} className="text-[13.5px] leading-[1.9]" />
              ))}
            </div>
          </div>
        </div>
        {continueButton}
      </div>
    );
  }

  // ---------- Interview: Q&A transcript, speaker name bolded, Korean | English columns ----------
  if (genre === "interview") {
    const turns = lines.map(({ kr, en }) => {
      const krIdx = kr.indexOf(":");
      const speaker = krIdx === -1 ? "" : kr.slice(0, krIdx).trim();
      const text = krIdx === -1 ? kr : kr.slice(krIdx + 1).trim();
      const enIdx = en.indexOf(":");
      const enSpeaker = enIdx === -1 ? "" : en.slice(0, enIdx).trim();
      const enText = enIdx === -1 ? en : en.slice(enIdx + 1).trim();
      const isHost = speaker.includes("진행자") || speaker.includes("기자");
      return { speaker, text, enSpeaker, enText, isHost };
    });
    return (
      <div className="max-w-[860px] border border-line rounded-[14px] p-[clamp(20px,3vw,28px)]">
        {header}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🎙️</span>
          <h2 className="kr text-[16px] font-semibold">{passage.title_kr}</h2>
        </div>
        <TranslatableText en={passage.title_en} showTranslation={showTranslation} className="text-[13px] mb-4" />
        <div className="rounded-[10px] border border-line overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2">
            <div className="p-[clamp(14px,2.5vw,20px)] bg-white sm:border-r border-b sm:border-b-0 border-line grid gap-3">
              {turns.map((t, i) => (
                <p key={i} className={`kr text-[15px] leading-[1.7] ${t.isHost ? "text-muted italic" : ""}`}>
                  <b className={`not-italic font-semibold ${t.isHost ? "text-faint" : "text-sky-deep"}`}>{t.speaker}: </b>
                  {t.text}
                </p>
              ))}
            </div>
            <div className="p-[clamp(14px,2.5vw,20px)] grid gap-3">
              {turns.map((t, i) => (
                <p key={i} className={`text-[13.5px] leading-[1.8] transition-all ${
                  showTranslation ? (t.isHost ? "text-faint italic" : "text-muted") : "text-transparent bg-[#F4F4F5] select-none rounded"
                }`}>
                  <b className={`not-italic font-semibold ${showTranslation ? (t.isHost ? "text-faint" : "text-[#1D4ED8]") : ""}`}>{t.enSpeaker}: </b>
                  {t.enText}
                </p>
              ))}
            </div>
          </div>
        </div>
        {continueButton}
      </div>
    );
  }

  // ---------- Instruction: numbered steps, Korean | English columns ----------
  if (genre === "instruction") {
    const stepLines = lines.filter((l) => /^\d+\./.test(l.kr.trim()));
    const displayLines = stepLines.length > 0 ? stepLines : lines;
    return (
      <div className="max-w-[860px] border border-line rounded-[14px] p-[clamp(20px,3vw,28px)]">
        {header}
        <h2 className="kr text-[17px] font-semibold mb-1">{passage.title_kr}</h2>
        <TranslatableText en={passage.title_en} showTranslation={showTranslation} className="text-[13px] mb-4" />
        <div className="rounded-[10px] border border-line overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2">
            <div className="p-[clamp(14px,2.5vw,20px)] bg-white sm:border-r border-b sm:border-b-0 border-line grid gap-3">
              {displayLines.map((line, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="flex-none w-7 h-7 rounded-full bg-[#EFF6FF] border border-sky-line text-sky-deep text-[13px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="kr text-[15px] leading-[1.6] pt-0.5">{line.kr.replace(/^\d+\.\s*/, "")}</p>
                </div>
              ))}
            </div>
            <div className="p-[clamp(14px,2.5vw,20px)] grid gap-3">
              {displayLines.map((line, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="flex-none w-7 h-7 rounded-full opacity-0">{i + 1}</span>
                  <TranslatableText
                    en={line.en.replace(/^\d+\.\s*/, "")}
                    showTranslation={showTranslation}
                    className="text-[13.5px] leading-[1.7] pt-0.5"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        {continueButton}
      </div>
    );
  }

  // ---------- Review: verdict card, Korean | English columns ----------
  if (genre === "review") {
    return (
      <div className="max-w-[860px] border border-line rounded-[14px] p-[clamp(20px,3vw,28px)]">
        {header}
        <div className="relative rounded-[10px] border border-amber-line bg-[#FFFBEB] p-[clamp(18px,3.2vw,26px)]">
          <span className="absolute -top-3 left-5 bg-white border border-amber-line rounded-full px-2.5 py-1 text-[12.5px] font-semibold text-[#92702B]">
            ⭐ Review
          </span>
          <h2 className="kr text-[16px] font-semibold mt-2.5 mb-1">{passage.title_kr}</h2>
          <TranslatableText en={passage.title_en} showTranslation={showTranslation} className="text-[12.5px] mb-3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
            <div className="grid gap-2">
              {lines.map((line, i) => (
                <p key={i} className="kr text-[15px] leading-[1.75]">
                  {line.kr}
                </p>
              ))}
            </div>
            <div className="grid gap-2">
              {lines.map((line, i) => (
                <TranslatableText key={i} en={line.en} showTranslation={showTranslation} className="text-[13px] leading-[1.8]" />
              ))}
            </div>
          </div>
        </div>
        {continueButton}
      </div>
    );
  }

  // ---------- Default: book spread (diary / story / explainer / untagged) ----------
  return (
    <div className="max-w-[880px] border border-line rounded-[14px] p-[clamp(20px,3vw,28px)]">
      {header}
      <div className="rounded-[10px] border border-line overflow-hidden bg-warm">
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="p-[clamp(14px,2.5vw,22px)] bg-white sm:border-r border-b sm:border-b-0 border-line">
            <p className={LABEL}>Korean</p>
            <h2 className="kr text-[17px] font-medium mb-3">{passage.title_kr}</h2>
            {lines.map((line, i) => (
              <p key={i} className="kr text-base font-medium leading-[2] mb-1.5">
                {line.kr}
              </p>
            ))}
          </div>
          <div className="p-[clamp(14px,2.5vw,22px)]">
            <p className={LABEL}>English</p>
            <h2 className="text-[15px] font-semibold text-muted mb-3">{passage.title_en}</h2>
            {lines.map((line, i) => (
              <TranslatableText key={i} en={line.en} showTranslation={showTranslation} className="text-sm leading-[2.15] mb-1.5" />
            ))}
          </div>
        </div>
      </div>
      {continueButton}
    </div>
  );
}
