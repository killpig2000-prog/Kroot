import { useTranslations } from "next-intl";

const PHRASES = [
  { kr: "안녕하세요", key: "hello" },
  { kr: "대박", key: "awesome" },
  { kr: "감사합니다", key: "thankYou" },
  { kr: "진짜?", key: "really" },
  { kr: "맛있어요", key: "delicious" },
  { kr: "꿀잼", key: "superFun" },
  { kr: "화이팅", key: "youGotThis" },
  { kr: "사랑해", key: "loveYou" },
] as const;

export default function SpeechStrip() {
  const t = useTranslations("landing.speech");
  const track = [...PHRASES, ...PHRASES];
  return (
    <>
      <div className="border-y border-dashed border-dash bg-warm py-3.5 overflow-hidden" aria-hidden="true">
        <div className="flex gap-10 w-max animate-[scroll_30s_linear_infinite] whitespace-nowrap motion-reduce:animate-none">
          {track.map((p, i) => (
            <span key={i} className="text-[13.5px] text-[#8A8478] font-medium">
              <span className="kr text-charcoal text-[15px] mr-[7px]">{p.kr}</span>
              {t(p.key)}
            </span>
          ))}
        </div>
      </div>
      <style>{`@keyframes scroll{to{transform:translateX(-50%)}}`}</style>
    </>
  );
}
