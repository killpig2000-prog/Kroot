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
  {
    id: "sp-a1-5",
    level: "A1",
    topic: "greetings",
    en: "Say goodbye to someone who is leaving: “Goodbye.”",
    kr: "안녕히 가세요",
    altAnswers: ["잘 가요", "안녕히 가십시오"],
  },
  {
    id: "sp-a1-6",
    level: "A1",
    topic: "shopping",
    en: "Say: “I'll take this one.”",
    kr: "이거 주세요",
    altAnswers: ["이걸로 주세요", "이거 살게요"],
  },
  {
    id: "sp-a1-7",
    level: "A1",
    topic: "directions",
    en: "Ask: “Where is the bathroom?”",
    kr: "화장실이 어디예요",
    altAnswers: ["화장실 어디예요", "화장실이 어디에 있어요"],
  },
  {
    id: "sp-a1-8",
    level: "A1",
    topic: "smalltalk",
    en: "Say: “I'm sorry, I don't know.”",
    kr: "죄송해요 잘 모르겠어요",
    altAnswers: ["미안해요 잘 몰라요", "죄송합니다 모르겠어요"],
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
  {
    id: "sp-a2-5",
    level: "A2",
    topic: "cafe",
    en: "Ask: “Can I get this to go?”",
    kr: "이거 포장해 주세요",
    altAnswers: ["포장해 주세요", "테이크아웃 돼요"],
  },
  {
    id: "sp-a2-6",
    level: "A2",
    topic: "greetings",
    en: "Ask politely: “How have you been?”",
    kr: "그동안 잘 지내셨어요",
    altAnswers: ["잘 지내셨어요", "그동안 어떻게 지냈어요"],
  },
  {
    id: "sp-a2-7",
    level: "A2",
    topic: "directions",
    en: "Ask: “How long does it take on foot?”",
    kr: "걸어서 얼마나 걸려요",
    altAnswers: ["걸어가면 얼마나 걸려요", "도보로 얼마나 걸려요"],
  },
  {
    id: "sp-a2-8",
    level: "A2",
    topic: "opinions",
    en: "Say: “I like this one more.”",
    kr: "저는 이게 더 좋아요",
    altAnswers: ["이게 더 마음에 들어요", "이걸 더 좋아해요"],
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
  {
    id: "sp-b1-5",
    level: "B1",
    topic: "cafe",
    en: "Say: “I ordered an iced latte, but this is hot.”",
    kr: "아이스 라떼를 시켰는데 이건 따뜻한 거예요",
    altAnswers: ["아이스로 주문했는데 뜨거운 게 나왔어요"],
  },
  {
    id: "sp-b1-6",
    level: "B1",
    topic: "smalltalk",
    en: "Say: “If I have time this weekend, I want to go hiking.”",
    kr: "이번 주말에 시간이 있으면 등산을 가고 싶어요",
    altAnswers: ["주말에 시간 되면 등산 가고 싶어요"],
  },
  {
    id: "sp-b1-7",
    level: "B1",
    topic: "greetings",
    en: "Say: “Sorry I'm late — the traffic was terrible.”",
    kr: "늦어서 죄송해요 길이 너무 막혔어요",
    altAnswers: ["늦어서 미안해요 차가 많이 막혔어요"],
  },
  {
    id: "sp-b1-8",
    level: "B1",
    topic: "directions",
    en: "Ask: “Is it faster to take a taxi or the subway?”",
    kr: "택시가 빨라요 지하철이 빨라요",
    altAnswers: ["택시 타는 게 빨라요 지하철 타는 게 빨라요", "택시랑 지하철 중에 뭐가 더 빨라요"],
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
  {
    id: "sp-b2-4",
    level: "B2",
    topic: "opinions",
    en: "Say: “I agree to some extent, but I see it a little differently.”",
    kr: "어느 정도 동의하지만 저는 조금 다르게 생각해요",
    altAnswers: ["어느 정도는 공감하는데 제 생각은 좀 달라요"],
  },
  {
    id: "sp-b2-5",
    level: "B2",
    topic: "cafe",
    en: "Say: “Since I'm allergic to peanuts, please leave them out.”",
    kr: "제가 땅콩 알레르기가 있어서 빼고 주시면 좋겠어요",
    altAnswers: ["땅콩 알레르기가 있으니까 땅콩은 빼 주세요"],
  },
  {
    id: "sp-b2-6",
    level: "B2",
    topic: "directions",
    en: "Say: “I was going to walk, but it started raining, so I took a bus.”",
    kr: "걸어가려고 했는데 비가 와서 버스를 탔어요",
    altAnswers: ["걸어갈 생각이었는데 비가 오는 바람에 버스를 탔어요"],
  },
  {
    id: "sp-b2-7",
    level: "B2",
    topic: "greetings",
    en: "Say: “Please give my regards to your family.”",
    kr: "가족분들께도 안부 전해 주세요",
    altAnswers: ["가족들한테 안부 전해 주세요"],
  },
  {
    id: "sp-b2-8",
    level: "B2",
    topic: "shopping",
    en: "Ask: “If it doesn't fit, can I exchange it later?”",
    kr: "사이즈가 안 맞으면 나중에 교환할 수 있어요",
    altAnswers: ["안 맞으면 나중에 교환 가능해요"],
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
  {
    id: "sp-c1-4",
    level: "C1",
    topic: "opinions",
    en: "Say: “Rather than regulating it right away, we should look at the side effects first.”",
    kr: "당장 규제하기보다는 부작용을 먼저 살펴봐야 한다고 봅니다",
    altAnswers: ["바로 규제하기보다 부작용부터 검토하는 게 맞다고 생각해요"],
  },
  {
    id: "sp-c1-5",
    level: "C1",
    topic: "smalltalk",
    en: "Say: “Now that I think about it, that experience taught me a lot.”",
    kr: "돌이켜 보면 그 경험이 저에게 많은 것을 가르쳐 준 것 같아요",
    altAnswers: ["생각해 보니 그 경험에서 정말 많이 배웠어요"],
  },
  {
    id: "sp-c1-6",
    level: "C1",
    topic: "shopping",
    en: "Say: “The design is appealing, but it's hard to justify the price.”",
    kr: "디자인은 마음에 드는데 가격을 생각하면 선뜻 사기가 어렵네요",
    altAnswers: ["디자인은 좋지만 가격을 감안하면 사기 망설여져요"],
  },
  {
    id: "sp-c1-7",
    level: "C1",
    topic: "directions",
    en: "Say: “If I'd known the road would be closed, I would have left earlier.”",
    kr: "길이 통제될 줄 알았더라면 좀 더 일찍 출발했을 텐데요",
    altAnswers: ["도로가 막힐 줄 알았으면 더 일찍 나왔을 거예요"],
  },
  {
    id: "sp-c1-8",
    level: "C1",
    topic: "cafe",
    en: "Say: “This place is worth visiting for the atmosphere alone.”",
    kr: "이 가게는 분위기만으로도 한번 가 볼 만한 곳이에요",
    altAnswers: ["여기는 분위기 하나만 봐도 갈 만한 가치가 있어요"],
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
  {
    id: "sp-c2-3",
    level: "C2",
    topic: "opinions",
    en: "Say: “Policies drawn up without regard for reality end up as empty words.”",
    kr: "현실을 고려하지 않고 만든 정책은 결국 공허한 말에 그치기 마련입니다",
    altAnswers: ["현실을 무시한 정책은 결국 탁상공론에 불과합니다"],
  },
  {
    id: "sp-c2-4",
    level: "C2",
    topic: "smalltalk",
    en: "Say: “I hate to say it, but I told you so.”",
    kr: "이런 말 하기는 좀 그렇지만 제가 그럴 줄 알았다고 했잖아요",
    altAnswers: ["말하기 좀 그렇지만 제가 그렇게 될 거라고 했죠"],
  },
  {
    id: "sp-c2-5",
    level: "C2",
    topic: "greetings",
    en: "Say formally: “Thanks to your help, we were able to finish the project safely.”",
    kr: "도와주신 덕분에 프로젝트를 무사히 마칠 수 있었습니다",
    altAnswers: ["여러모로 도와주신 덕분에 무사히 마무리할 수 있었습니다"],
  },
  {
    id: "sp-c2-6",
    level: "C2",
    topic: "opinions",
    en: "Say: “Weighing the pros and cons, the benefits clearly outweigh the costs.”",
    kr: "장단점을 따져 보면 얻는 것이 잃는 것보다 훨씬 크다고 봅니다",
    altAnswers: ["득실을 따져 보면 이득이 손실보다 훨씬 큽니다"],
  },
  {
    id: "sp-c2-7",
    level: "C2",
    topic: "shopping",
    en: "Say: “I was going to buy it on impulse, but I stopped myself at the last moment.”",
    kr: "충동적으로 살 뻔했는데 마지막 순간에 겨우 참았어요",
    altAnswers: ["하마터면 충동구매할 뻔했는데 간신히 참았습니다"],
  },
  {
    id: "sp-c2-8",
    level: "C2",
    topic: "directions",
    en: "Say: “Whichever route you take, you'll get stuck in traffic at this hour.”",
    kr: "어느 길로 가든 이 시간에는 막힐 수밖에 없을 겁니다",
    altAnswers: ["어떤 길을 택하든 이 시간대에는 정체를 피할 수 없어요"],
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
