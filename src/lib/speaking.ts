import type { CefrLevel } from "@/lib/tree";

export type SpeakingPrompt = {
  id: string;
  level: CefrLevel;
  topic: string;
  /** English instruction shown to the learner */
  en: string;
  /** The model Korean answer */
  kr: string;
  /** Other Korean phrasings that should also count as correct */
  altAnswers?: string[];
};

export const SPEAKING_TOPICS = [
  { key: "greetings", label: "Greetings", krLabel: "인사", icon: "👋" },
  { key: "cafe", label: "Cafe & Food", krLabel: "카페", icon: "☕" },
  { key: "shopping", label: "Shopping", krLabel: "쇼핑", icon: "🛍️" },
  { key: "directions", label: "Directions", krLabel: "길찾기", icon: "🗺️" },
  { key: "smalltalk", label: "Small Talk", krLabel: "잡담", icon: "💬" },
  { key: "opinions", label: "Opinions", krLabel: "의견", icon: "🧠" },
] as const;

export const SPEAKING_PROMPTS: SpeakingPrompt[] = [
  // ---- A1 ----
  {
    id: "sp-a1-1",
    level: "A1",
    topic: "greetings",
    en: "Say: “Hello, nice to meet you.”",
    kr: "안녕하세요 반갑습니다",
    altAnswers: ["안녕하세요 만나서 반갑습니다", "안녕하세요 반가워요"],
  },
  {
    id: "sp-a1-2",
    level: "A1",
    topic: "greetings",
    en: "Introduce yourself: “My name is Minsu.”",
    kr: "제 이름은 민수입니다",
    altAnswers: ["저는 민수입니다", "제 이름은 민수예요"],
  },
  {
    id: "sp-a1-3",
    level: "A1",
    topic: "cafe",
    en: "Say: “I want to order a coffee.”",
    kr: "커피 주문하고 싶어요",
    altAnswers: ["커피 주세요", "커피 한 잔 주세요"],
  },
  {
    id: "sp-a1-4",
    level: "A1",
    topic: "cafe",
    en: "Ask: “How much is it?”",
    kr: "얼마예요",
    altAnswers: ["얼마입니까", "가격이 얼마예요"],
  },
  // ---- A2 ----
  {
    id: "sp-a2-1",
    level: "A2",
    topic: "cafe",
    en: "Say: “Please make it less spicy.”",
    kr: "덜 맵게 해 주세요",
    altAnswers: ["안 맵게 해 주세요", "조금 덜 맵게 해주세요"],
  },
  {
    id: "sp-a2-2",
    level: "A2",
    topic: "shopping",
    en: "Ask: “Do you have this in a bigger size?”",
    kr: "더 큰 사이즈 있어요",
    altAnswers: ["이거 더 큰 사이즈 있나요", "큰 사이즈 있어요"],
  },
  {
    id: "sp-a2-3",
    level: "A2",
    topic: "directions",
    en: "Ask: “Where is the subway station?”",
    kr: "지하철역이 어디예요",
    altAnswers: ["지하철역 어디예요", "지하철역이 어디에 있어요"],
  },
  {
    id: "sp-a2-4",
    level: "A2",
    topic: "smalltalk",
    en: "Say: “The weather is really nice today.”",
    kr: "오늘 날씨가 정말 좋아요",
    altAnswers: ["오늘 날씨 진짜 좋네요", "날씨가 정말 좋아요"],
  },
  // ---- B1 ----
  {
    id: "sp-b1-1",
    level: "B1",
    topic: "smalltalk",
    en: "Say: “I've been learning Korean for about a year.”",
    kr: "한국어를 배운 지 일 년쯤 됐어요",
    altAnswers: ["한국어 배운 지 일 년 정도 됐어요", "한국어를 일 년 정도 배웠어요"],
  },
  {
    id: "sp-b1-2",
    level: "B1",
    topic: "shopping",
    en: "Ask: “Could you give me a small discount?”",
    kr: "조금만 깎아 주실 수 있어요",
    altAnswers: ["조금 깎아 주세요", "좀 깎아 주실 수 있나요"],
  },
  {
    id: "sp-b1-3",
    level: "B1",
    topic: "directions",
    en: "Say: “I think I got off at the wrong stop.”",
    kr: "정류장을 잘못 내린 것 같아요",
    altAnswers: ["잘못 내린 것 같아요", "역을 잘못 내린 것 같아요"],
  },
  {
    id: "sp-b1-4",
    level: "B1",
    topic: "opinions",
    en: "Say: “I'd rather stay home and rest today.”",
    kr: "오늘은 집에서 쉬는 게 나을 것 같아요",
    altAnswers: ["오늘은 그냥 집에서 쉬고 싶어요"],
  },
  // ---- B2 ----
  {
    id: "sp-b2-1",
    level: "B2",
    topic: "opinions",
    en: "Say: “In my opinion, remote work is more efficient.”",
    kr: "제 생각에는 재택근무가 더 효율적인 것 같아요",
    altAnswers: ["제 의견으로는 재택근무가 더 효율적이에요"],
  },
  {
    id: "sp-b2-2",
    level: "B2",
    topic: "smalltalk",
    en: "Say: “I couldn't sleep well because of the noise last night.”",
    kr: "어젯밤에 소음 때문에 잠을 잘 못 잤어요",
    altAnswers: ["어제 시끄러워서 잠을 못 잤어요"],
  },
  {
    id: "sp-b2-3",
    level: "B2",
    topic: "shopping",
    en: "Say: “I'd like to return this — I have the receipt.”",
    kr: "이거 환불하고 싶은데요 영수증 있어요",
    altAnswers: ["환불하고 싶어요 영수증 여기 있어요"],
  },
  // ---- C1 ----
  {
    id: "sp-c1-1",
    level: "C1",
    topic: "opinions",
    en: "Say: “Rising housing prices are a serious social problem.”",
    kr: "집값 상승은 심각한 사회 문제입니다",
    altAnswers: ["집값이 오르는 것은 심각한 사회 문제예요"],
  },
  {
    id: "sp-c1-2",
    level: "C1",
    topic: "smalltalk",
    en: "Say: “The more I study, the more I realize how much I don't know.”",
    kr: "공부하면 할수록 모르는 게 많다는 걸 깨달아요",
    altAnswers: ["공부할수록 모르는 게 더 많아지는 것 같아요"],
  },
  {
    id: "sp-c1-3",
    level: "C1",
    topic: "greetings",
    en: "Say formally: “Thank you for taking the time to meet me.”",
    kr: "시간 내 주셔서 감사합니다",
    altAnswers: ["귀한 시간 내 주셔서 감사합니다"],
  },
  // ---- C2 ----
  {
    id: "sp-c2-1",
    level: "C2",
    topic: "opinions",
    en: "Say: “That argument sounds plausible, but it lacks evidence.”",
    kr: "그 주장은 그럴듯하지만 근거가 부족합니다",
    altAnswers: ["그 주장은 설득력은 있지만 근거가 부족해요"],
  },
  {
    id: "sp-c2-2",
    level: "C2",
    topic: "smalltalk",
    en: "Say: “Let's not jump to conclusions before we hear both sides.”",
    kr: "양쪽 이야기를 듣기 전에 섣불리 결론 내리지 맙시다",
    altAnswers: ["양쪽 말을 다 듣고 나서 결론을 내립시다"],
  },
];

export function promptsFor(level: CefrLevel): SpeakingPrompt[] {
  return SPEAKING_PROMPTS.filter((p) => p.level === level);
}

export function topicLabel(key: string): string {
  return SPEAKING_TOPICS.find((t) => t.key === key)?.label ?? key;
}

export function topicIcon(key: string): string {
  return SPEAKING_TOPICS.find((t) => t.key === key)?.icon ?? "💬";
}
