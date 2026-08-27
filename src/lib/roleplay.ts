import { SITUATIONS } from "@/lib/listening";
import type { CefrLevel } from "@/lib/tree";

// AI roleplay: the learner plays out one of the eight listening situations
// against a Gemini-driven partner. Each scenario has three concrete goals
// the learner has to achieve in Korean; the goals get harder with CEFR level.

export const MAX_TURNS = 8;
export const ROLEPLAY_MINUTES = 6;

export type RoleplayGoal = { en: string; hint_kr: string };

export type Scenario = {
  key: string;
  title: string;
  icon: string;
  /** Who the AI plays — used verbatim in the prompt. */
  aiRole: string;
  /** Who the learner plays. */
  learnerRole: string;
  /** Display name for the AI bubble. */
  aiName: string;
  opening: { kr: string; en: string };
  goals: Record<"basic" | "twist" | "advanced", RoleplayGoal[]>;
};

type Tier = "basic" | "twist" | "advanced";

export function tierFor(level: CefrLevel): Tier {
  if (level === "A1" || level === "A2") return "basic";
  if (level === "B1" || level === "B2") return "twist";
  return "advanced";
}

const iconOf = (key: string) => SITUATIONS.find((s) => s.key === key)?.icon ?? "💬";

export const SCENARIOS: Scenario[] = [
  {
    key: "cafe",
    title: "Ordering at a cafe",
    icon: iconOf("cafe"),
    aiRole: "a friendly barista at a small cafe in Seoul",
    learnerRole: "a customer ordering a drink",
    aiName: "바리스타",
    opening: { kr: "어서 오세요! 주문하시겠어요?", en: "Welcome! Would you like to order?" },
    goals: {
      basic: [
        { en: "Greet and order a drink", hint_kr: "아메리카노 한 잔 주세요" },
        { en: "Ask for it iced or hot, or choose a size", hint_kr: "아이스로 주세요 / 큰 사이즈로요" },
        { en: "Pay and say thank you", hint_kr: "카드로 할게요. 감사합니다" },
      ],
      twist: [
        { en: "Order a drink and a pastry", hint_kr: "라떼 하나랑 크루아상 하나 주세요" },
        { en: "The pastry is sold out — pick something else", hint_kr: "그럼 다른 거 뭐가 있어요?" },
        { en: "Ask for takeout and pay", hint_kr: "포장해 주세요. 카드로 할게요" },
      ],
      advanced: [
        { en: "Order, and ask about the beans or a recommendation", hint_kr: "오늘 원두는 어떤 거예요?" },
        { en: "Your drink came out wrong — politely ask to have it remade", hint_kr: "죄송한데 이거 제가 시킨 게 아닌 것 같아요" },
        { en: "Ask about a loyalty stamp or discount, then thank them", hint_kr: "적립 되나요?" },
      ],
    },
  },
  {
    key: "restaurant",
    title: "Dinner at a restaurant",
    icon: iconOf("restaurant"),
    aiRole: "a server at a busy Korean restaurant",
    learnerRole: "a diner",
    aiName: "직원",
    opening: { kr: "어서 오세요. 몇 분이세요?", en: "Welcome. How many people?" },
    goals: {
      basic: [
        { en: "Say how many people and get seated", hint_kr: "두 명이에요" },
        { en: "Order a dish and water", hint_kr: "비빔밥 하나랑 물 주세요" },
        { en: "Ask for the bill", hint_kr: "계산해 주세요" },
      ],
      twist: [
        { en: "Ask what they recommend and order it", hint_kr: "뭐가 제일 맛있어요?" },
        { en: "Ask to make it less spicy", hint_kr: "덜 맵게 해 주세요" },
        { en: "The dish is taking long — ask politely how much longer", hint_kr: "음식이 언제쯤 나와요?" },
      ],
      advanced: [
        { en: "Explain a dietary restriction and ask what's safe to eat", hint_kr: "제가 해산물 알레르기가 있어서요" },
        { en: "The order came out wrong — resolve it politely", hint_kr: "이거 제가 주문한 거랑 다른 것 같은데요" },
        { en: "Ask to split the bill and pay separately", hint_kr: "따로 계산할 수 있을까요?" },
      ],
    },
  },
  {
    key: "airport",
    title: "At the airport",
    icon: iconOf("airport"),
    aiRole: "an airline check-in agent at Incheon Airport",
    learnerRole: "a traveler checking in",
    aiName: "직원",
    opening: { kr: "안녕하세요. 여권 보여 주시겠어요?", en: "Hello. May I see your passport?" },
    goals: {
      basic: [
        { en: "Hand over your passport and say where you're flying", hint_kr: "네, 여기요. 도쿄 가요" },
        { en: "Say how many bags you're checking", hint_kr: "가방 하나 부칠게요" },
        { en: "Ask for a window seat", hint_kr: "창가 자리로 주세요" },
      ],
      twist: [
        { en: "Check in and choose a seat", hint_kr: "통로 쪽 자리 있어요?" },
        { en: "Your bag is overweight — ask what your options are", hint_kr: "그럼 어떻게 해야 해요?" },
        { en: "Ask what gate and what time boarding starts", hint_kr: "몇 번 게이트예요?" },
      ],
      advanced: [
        { en: "Ask about an earlier flight or a standby option", hint_kr: "혹시 더 빠른 비행기로 바꿀 수 있을까요?" },
        { en: "Your flight is delayed — ask about compensation or a lounge", hint_kr: "지연되면 라운지 이용 가능한가요?" },
        { en: "Confirm your connection and thank the agent", hint_kr: "환승 시간이 충분할까요?" },
      ],
    },
  },
  {
    key: "shopping",
    title: "Shopping for clothes",
    icon: iconOf("shopping"),
    aiRole: "a shop assistant in a clothing store in Hongdae",
    learnerRole: "a shopper",
    aiName: "점원",
    opening: { kr: "어서 오세요~ 찾으시는 거 있으세요?", en: "Welcome~ Are you looking for anything?" },
    goals: {
      basic: [
        { en: "Say what you're looking for", hint_kr: "티셔츠 보고 있어요" },
        { en: "Ask for a different size or color", hint_kr: "이거 다른 색 있어요?" },
        { en: "Ask the price and buy it", hint_kr: "얼마예요? 이걸로 할게요" },
      ],
      twist: [
        { en: "Ask to try something on", hint_kr: "입어 봐도 돼요?" },
        { en: "It doesn't fit — ask for another size", hint_kr: "조금 작은데 한 사이즈 큰 거 있어요?" },
        { en: "Ask if there's a discount, then pay", hint_kr: "할인 돼요?" },
      ],
      advanced: [
        { en: "Ask about material and how to wash it", hint_kr: "이거 소재가 뭐예요? 세탁은 어떻게 해요?" },
        { en: "Return or exchange an item you bought last week", hint_kr: "지난주에 산 건데 교환하고 싶어서요" },
        { en: "Negotiate politely or ask about the refund policy", hint_kr: "환불 규정이 어떻게 돼요?" },
      ],
    },
  },
  {
    key: "directions",
    title: "Asking for directions",
    icon: iconOf("directions"),
    aiRole: "a helpful passerby on a street in Seoul",
    learnerRole: "a lost visitor",
    aiName: "행인",
    opening: { kr: "네? 뭐 도와드릴까요?", en: "Yes? Can I help you with something?" },
    goals: {
      basic: [
        { en: "Ask where the subway station is", hint_kr: "지하철역이 어디예요?" },
        { en: "Ask if it's far or how long it takes", hint_kr: "멀어요? 얼마나 걸려요?" },
        { en: "Repeat the directions back and thank them", hint_kr: "직진해서 왼쪽이요? 감사합니다" },
      ],
      twist: [
        { en: "Ask how to get to a landmark (e.g. 경복궁)", hint_kr: "경복궁에 어떻게 가요?" },
        { en: "The first route is closed — ask for another way", hint_kr: "다른 길은 없어요?" },
        { en: "Ask which bus or exit to take", hint_kr: "몇 번 출구로 나가요?" },
      ],
      advanced: [
        { en: "Explain where you're trying to go and why you're confused", hint_kr: "지도 앱이 자꾸 다른 길을 알려줘서요" },
        { en: "Compare two routes (taxi vs. subway) and decide", hint_kr: "택시랑 지하철 중에 뭐가 더 나아요?" },
        { en: "Ask about a good place to eat nearby, then thank them warmly", hint_kr: "이 근처에 맛집 있어요?" },
      ],
    },
  },
  {
    key: "hospital",
    title: "Seeing a doctor",
    icon: iconOf("hospital"),
    aiRole: "a doctor at a neighborhood clinic",
    learnerRole: "a patient",
    aiName: "의사",
    opening: { kr: "안녕하세요. 어디가 불편하세요?", en: "Hello. What seems to be the problem?" },
    goals: {
      basic: [
        { en: "Say what hurts", hint_kr: "머리가 아파요" },
        { en: "Say since when", hint_kr: "어제부터요" },
        { en: "Ask about medicine", hint_kr: "약 있어요?" },
      ],
      twist: [
        { en: "Describe two symptoms", hint_kr: "목이 아프고 기침도 나요" },
        { en: "Answer questions about fever or allergies", hint_kr: "열은 조금 있어요. 알레르기는 없어요" },
        { en: "Ask how to take the medicine and when to come back", hint_kr: "약은 하루에 몇 번 먹어요?" },
      ],
      advanced: [
        { en: "Describe symptoms in detail and what you've already tried", hint_kr: "일주일 전부터 그랬고, 진통제를 먹어 봤는데요" },
        { en: "Ask about side effects or alternatives", hint_kr: "부작용은 없어요?" },
        { en: "Ask for a doctor's note or insurance paperwork", hint_kr: "진단서 받을 수 있을까요?" },
      ],
    },
  },
  {
    key: "hotel",
    title: "Checking into a hotel",
    icon: iconOf("hotel"),
    aiRole: "a receptionist at a hotel front desk",
    learnerRole: "a guest",
    aiName: "직원",
    opening: { kr: "안녕하세요, 체크인 도와드릴까요?", en: "Hello, may I help you check in?" },
    goals: {
      basic: [
        { en: "Say you have a reservation and give your name", hint_kr: "예약했어요. 이름은 ○○이에요" },
        { en: "Ask what time breakfast is", hint_kr: "아침 식사는 몇 시예요?" },
        { en: "Ask for the wifi password", hint_kr: "와이파이 비밀번호가 뭐예요?" },
      ],
      twist: [
        { en: "Check in and ask about the room (floor, view)", hint_kr: "높은 층으로 가능해요?" },
        { en: "Your reservation can't be found — sort it out", hint_kr: "이 이메일로 예약 확인해 주시겠어요?" },
        { en: "Ask for late checkout", hint_kr: "체크아웃 좀 늦게 해도 돼요?" },
      ],
      advanced: [
        { en: "Report a problem with the room and ask for a change", hint_kr: "방에서 소음이 심해서 바꿀 수 있을까요?" },
        { en: "Ask about an upgrade or a refund for the inconvenience", hint_kr: "불편을 드렸으니 업그레이드는 어렵겠죠?" },
        { en: "Arrange a taxi or luggage storage for tomorrow", hint_kr: "내일 짐 맡길 수 있어요?" },
      ],
    },
  },
  {
    key: "phone",
    title: "Making a phone call",
    icon: iconOf("phone"),
    aiRole: "a staff member answering the phone at a restaurant",
    learnerRole: "a caller making a reservation",
    aiName: "직원",
    opening: { kr: "네, 감사합니다. 한강식당입니다.", en: "Hello, thank you for calling. This is Hangang Restaurant." },
    goals: {
      basic: [
        { en: "Say you want to make a reservation", hint_kr: "예약하고 싶어요" },
        { en: "Say the day, time, and how many people", hint_kr: "토요일 저녁 7시에 세 명이요" },
        { en: "Give your name and phone number", hint_kr: "이름은 ○○이고 번호는…" },
      ],
      twist: [
        { en: "Ask to book a table for a specific time", hint_kr: "금요일 6시에 자리 있어요?" },
        { en: "That time is full — agree on another", hint_kr: "그럼 7시 반은 어때요?" },
        { en: "Ask about parking or a private room", hint_kr: "주차 가능해요?" },
      ],
      advanced: [
        { en: "Change an existing reservation and explain why", hint_kr: "예약 시간을 좀 바꾸고 싶은데요" },
        { en: "Ask about a group menu or a birthday arrangement", hint_kr: "생일 케이크 반입 가능한가요?" },
        { en: "Confirm all details and end the call politely", hint_kr: "그럼 그렇게 부탁드릴게요. 감사합니다" },
      ],
    },
  },
];

export function scenarioByKey(key: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.key === key);
}

export function goalsFor(scenario: Scenario, level: CefrLevel): RoleplayGoal[] {
  return scenario.goals[tierFor(level)];
}

export type RoleplayMessage = { role: "ai" | "user"; kr: string; en?: string };

export type RoleplayReply = {
  reply_kr: string;
  reply_en: string;
  correction: { original: string; corrected: string; note: string } | null;
  goals_done: number[];
  finished: boolean;
  praise_en: string;
};
