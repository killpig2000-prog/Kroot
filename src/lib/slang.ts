// Slang ("Street Talk" 슬랭): a hardcoded list of real Korean 신조어 / slang.
// No database — the flip cards read straight from here, like the writing prompts.

export type SlangVibe = "texting" | "spoken" | "internet";

export type SlangEntry = {
  kr: string;
  romanization: string;
  literal: string;
  meaning: string;
  example: { kr: string; en: string };
  vibe: SlangVibe;
  origin?: string;
};

export const VIBES: { key: SlangVibe; label: string; emoji: string }[] = [
  { key: "spoken", label: "Spoken", emoji: "🗣️" },
  { key: "texting", label: "Texting", emoji: "💬" },
  { key: "internet", label: "Internet", emoji: "🌐" },
];

export const SLANG: SlangEntry[] = [
  {
    kr: "꿀잼",
    romanization: "kkul-jaem",
    literal: "honey fun",
    meaning: "Really fun, a blast",
    example: { kr: "이 드라마 진짜 꿀잼이야.", en: "This drama is seriously so much fun." },
    vibe: "texting",
    origin: "꿀 (honey) + 재미 (fun), clipped to 잼.",
  },
  {
    kr: "노잼",
    romanization: "no-jaem",
    literal: "no fun",
    meaning: "Boring, not funny at all",
    example: { kr: "그 영화 완전 노잼이었어.", en: "That movie was a total snooze." },
    vibe: "texting",
    origin: "English 'no' + 재미 (fun) — the twin of 꿀잼.",
  },
  {
    kr: "대박",
    romanization: "dae-bak",
    literal: "big gourd",
    meaning: "Awesome / no way! (good or bad shock)",
    example: { kr: "대박! 시험 만점 받았어?", en: "No way! You got a perfect score?" },
    vibe: "spoken",
    origin: "From a folk tale where a giant gourd bursts open full of treasure.",
  },
  {
    kr: "헐",
    romanization: "heol",
    literal: "(a gasp)",
    meaning: "Whoa / OMG — pure disbelief",
    example: { kr: "헐, 지금 밖에 눈 와.", en: "Whoa, it's snowing outside right now." },
    vibe: "texting",
    origin: "Just the sound of a sharp intake of breath, written down.",
  },
  {
    kr: "짱",
    romanization: "jjang",
    literal: "the top",
    meaning: "The best, awesome",
    example: { kr: "우리 엄마 요리는 짱이야.", en: "My mom's cooking is the best." },
    vibe: "spoken",
    origin: "1990s schoolyard slang for the toughest kid, now praise for anything.",
  },
  {
    kr: "멘붕",
    romanization: "men-bung",
    literal: "mental collapse",
    meaning: "Brain meltdown, totally overwhelmed",
    example: { kr: "발표 자료 날아가서 멘붕 왔어.", en: "My slides vanished and I lost it." },
    vibe: "internet",
    origin: "멘탈 (mental) + 붕괴 (collapse).",
  },
  {
    kr: "심쿵",
    romanization: "sim-kung",
    literal: "heart thud",
    meaning: "Heart-fluttering, swoon-worthy",
    example: { kr: "그 미소 진짜 심쿵이야.", en: "That smile is honestly swoon-worthy." },
    vibe: "texting",
    origin: "심장 (heart) + 쿵 (thud).",
  },
  {
    kr: "최애",
    romanization: "choe-ae",
    literal: "most loved",
    meaning: "Your absolute favourite (bias)",
    example: { kr: "내 최애 멤버는 저 사람이야.", en: "That one is my favourite member." },
    vibe: "internet",
    origin: "최 (most) + 애 (love) — fandom vocabulary gone mainstream.",
  },
  {
    kr: "불금",
    romanization: "bul-geum",
    literal: "burning Friday",
    meaning: "Fire Friday — the night the week ignites",
    example: { kr: "오늘 불금인데 뭐 할 거야?", en: "It's Fire Friday — what are you up to?" },
    vibe: "spoken",
    origin: "불 (fire) + 금요일 (Friday).",
  },
  {
    kr: "치맥",
    romanization: "chi-maek",
    literal: "chicken-beer",
    meaning: "Fried chicken with beer, the national combo",
    example: { kr: "비 오는 날엔 치맥이 최고지.", en: "On a rainy day, chicken and beer wins." },
    vibe: "spoken",
    origin: "치킨 (chicken) + 맥주 (beer).",
  },
  {
    kr: "JMT",
    romanization: "jei-em-ti",
    literal: "j-m-t",
    meaning: "Ridiculously delicious",
    example: { kr: "여기 떡볶이 진짜 JMT.", en: "The tteokbokki here is unreal." },
    vibe: "internet",
    origin: "Roman-letter spelling of 존맛탱 — softens a rough word.",
  },
  {
    kr: "TMI",
    romanization: "ti-em-ai",
    literal: "too much information",
    meaning: "More detail than anyone asked for",
    example: { kr: "TMI인데 나 오늘 세 번 넘어졌어.", en: "TMI, but I fell over three times today." },
    vibe: "internet",
    origin: "Borrowed from English, but Koreans use it to introduce their own trivia.",
  },
  {
    kr: "갑분싸",
    romanization: "gap-bun-ssa",
    literal: "suddenly the mood goes cold",
    meaning: "That awkward silence after a bad joke",
    example: { kr: "내 농담에 갑분싸 됐어.", en: "My joke killed the whole mood." },
    vibe: "internet",
    origin: "갑자기 분위기 싸해짐, squeezed into four syllables.",
  },
  {
    kr: "인싸",
    romanization: "in-ssa",
    literal: "insider",
    meaning: "A social butterfly, always in the middle of things",
    example: { kr: "쟤는 어딜 가나 인싸야.", en: "They're the life of the party anywhere they go." },
    vibe: "spoken",
    origin: "English 'insider' clipped Korean-style.",
  },
  {
    kr: "아싸",
    romanization: "a-ssa",
    literal: "outsider",
    meaning: "A happy loner who skips the group stuff",
    example: { kr: "난 아싸라서 집이 제일 좋아.", en: "I'm an outsider type — home is best." },
    vibe: "spoken",
    origin: "English 'outsider', the mirror of 인싸.",
  },
  {
    kr: "솔까말",
    romanization: "sol-kka-mal",
    literal: "frankly speaking",
    meaning: "Not gonna lie, honestly…",
    example: { kr: "솔까말 이거 좀 비싸다.", en: "Not gonna lie, this is a bit pricey." },
    vibe: "texting",
    origin: "솔직히 까놓고 말해서 shortened to its first syllables.",
  },
  {
    kr: "혼밥",
    romanization: "hon-bap",
    literal: "alone rice",
    meaning: "Eating a meal by yourself, on purpose",
    example: { kr: "오늘 점심은 혼밥했어.", en: "I ate lunch by myself today." },
    vibe: "spoken",
    origin: "혼자 (alone) + 밥 (rice/meal).",
  },
  {
    kr: "혼술",
    romanization: "hon-sul",
    literal: "alone alcohol",
    meaning: "Drinking solo at home",
    example: { kr: "금요일 밤 혼술 각이다.", en: "Friday night calls for a solo drink." },
    vibe: "spoken",
    origin: "혼자 (alone) + 술 (alcohol).",
  },
  {
    kr: "존맛",
    romanization: "jon-mat",
    literal: "extremely taste",
    meaning: "Insanely tasty (a little crude)",
    example: { kr: "이 라면 존맛이야.", en: "This ramyeon is insanely good." },
    vibe: "internet",
    origin: "An intensifier 존 + 맛 (taste). Keep it for close friends.",
  },
  {
    kr: "케바케",
    romanization: "ke-ba-ke",
    literal: "case by case",
    meaning: "Depends on the situation",
    example: { kr: "그건 케바케지, 사람마다 달라.", en: "That's case by case — it varies." },
    vibe: "texting",
    origin: "케이스 바이 케이스, first syllable of each word.",
  },
  {
    kr: "썸",
    romanization: "sseom",
    literal: "some(thing)",
    meaning: "The maybe-dating stage before it's official",
    example: { kr: "우리 아직 썸 타는 중이야.", en: "We're still in that almost-dating phase." },
    vibe: "spoken",
    origin: "From English 'something' — as in something's going on.",
  },
  {
    kr: "현타",
    romanization: "hyeon-ta",
    literal: "reality strike",
    meaning: "That sudden hit of what am I doing with my life",
    example: { kr: "새벽 세 시에 현타 왔어.", en: "Reality hit me hard at 3 in the morning." },
    vibe: "internet",
    origin: "현실 자각 타임 — 'reality realisation time'.",
  },
  {
    kr: "갓생",
    romanization: "gat-saeng",
    literal: "god life",
    meaning: "Living an impressively disciplined life",
    example: { kr: "요즘 새벽 운동하면서 갓생 살아.", en: "I'm living my best disciplined life with dawn workouts." },
    vibe: "internet",
    origin: "English 'god' + 인생 (life).",
  },
  {
    kr: "억텐",
    romanization: "eok-ten",
    literal: "forced tension",
    meaning: "Fake enthusiasm you're clearly forcing",
    example: { kr: "그 리액션 완전 억텐이잖아.", en: "That reaction is such forced hype." },
    vibe: "internet",
    origin: "억지 (forced) + 텐션 (tension/energy).",
  },
];

// Deterministic pick so everyone sees the same word on the same day.
export function slangOfTheDay(date = new Date()): SlangEntry {
  const dayIndex = Math.floor(date.getTime() / 86_400_000);
  return SLANG[dayIndex % SLANG.length];
}
