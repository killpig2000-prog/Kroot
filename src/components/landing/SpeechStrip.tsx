const PHRASES = [
  { kr: "안녕하세요", en: "hello" },
  { kr: "대박", en: "awesome" },
  { kr: "감사합니다", en: "thank you" },
  { kr: "진짜?", en: "really?" },
  { kr: "맛있어요", en: "delicious" },
  { kr: "꿀잼", en: "super fun" },
  { kr: "화이팅", en: "you got this" },
  { kr: "사랑해", en: "love you" },
];

export default function SpeechStrip() {
  const track = [...PHRASES, ...PHRASES];
  return (
    <>
      <div className="border-y border-dashed border-dash bg-warm py-3.5 overflow-hidden" aria-hidden="true">
        <div className="flex gap-10 w-max animate-[scroll_30s_linear_infinite] whitespace-nowrap motion-reduce:animate-none">
          {track.map((p, i) => (
            <span key={i} className="text-[13.5px] text-[#8A8478] font-medium">
              <span className="kr text-charcoal text-[15px] mr-[7px]">{p.kr}</span>
              {p.en}
            </span>
          ))}
        </div>
      </div>
      <style>{`@keyframes scroll{to{transform:translateX(-50%)}}`}</style>
    </>
  );
}
