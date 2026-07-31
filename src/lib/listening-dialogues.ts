import type { CefrLevel } from "@/lib/tree";

export type DialogueLine = {
  speaker: string;
  kr: string;
  en: string;
};

export type Dialogue = {
  id: string;
  situationKey: string;
  level: CefrLevel;
  title: string;
  lines: DialogueLine[];
};

export const DIALOGUES: Dialogue[] = [
  {
    id: "cafe-a1-order",
    situationKey: "cafe",
    level: "A1",
    title: "Ordering a coffee",
    lines: [
      { speaker: "점원", kr: "어서 오세요! 무엇을 드릴까요?", en: "Welcome! What can I get you?" },
      { speaker: "손님", kr: "아메리카노 한 잔 주세요.", en: "One Americano, please." },
      { speaker: "점원", kr: "네, 뜨거운 거로 드릴까요?", en: "Sure — would you like it hot?" },
      { speaker: "손님", kr: "아니요, 아이스로 주세요.", en: "No, iced please." },
    ],
  },
  {
    id: "cafe-b1-complaint",
    situationKey: "cafe",
    level: "B1",
    title: "Something's wrong with the order",
    lines: [
      { speaker: "손님", kr: "저기요, 제가 주문한 거랑 다른 것 같아요.", en: "Excuse me, this doesn't seem like what I ordered." },
      { speaker: "점원", kr: "죄송합니다, 어떤 걸 주문하셨었죠?", en: "I'm sorry — what did you order?" },
      { speaker: "손님", kr: "카페라떼를 시켰는데 이건 아메리카노 같아요.", en: "I ordered a caffè latte, but this looks like an Americano." },
      { speaker: "점원", kr: "확인해 보겠습니다. 바로 다시 만들어 드릴게요.", en: "Let me check — I'll remake it right away." },
    ],
  },
  {
    id: "restaurant-a1-order",
    situationKey: "restaurant",
    level: "A1",
    title: "Ordering food",
    lines: [
      { speaker: "직원", kr: "몇 분이세요?", en: "How many people?" },
      { speaker: "손님", kr: "두 명이요.", en: "Two people." },
      { speaker: "직원", kr: "이쪽으로 앉으세요. 주문하시겠어요?", en: "Please sit here. Ready to order?" },
      { speaker: "손님", kr: "네, 비빔밥 두 개 주세요.", en: "Yes, two bibimbap please." },
    ],
  },
  {
    id: "restaurant-b2-reservation",
    situationKey: "restaurant",
    level: "B2",
    title: "Changing a reservation",
    lines: [
      { speaker: "손님", kr: "예약을 좀 변경하고 싶은데요, 가능할까요?", en: "I'd like to change my reservation, is that possible?" },
      { speaker: "직원", kr: "네, 성함이 어떻게 되세요?", en: "Sure, may I have your name?" },
      { speaker: "손님", kr: "김민수입니다. 7시에서 8시 반으로 옮기고 싶어요.", en: "Kim Minsu. I'd like to move it from 7 to 8:30." },
      { speaker: "직원", kr: "확인해보니 8시 반도 가능하십니다. 변경해드렸습니다.", en: "I checked, and 8:30 is available. I've made the change." },
    ],
  },
  {
    id: "airport-a2-checkin",
    situationKey: "airport",
    level: "A2",
    title: "Checking in",
    lines: [
      { speaker: "직원", kr: "여권 좀 보여주시겠어요?", en: "Could I see your passport?" },
      { speaker: "승객", kr: "네, 여기 있어요.", en: "Yes, here it is." },
      { speaker: "직원", kr: "짐은 몇 개 부치실 건가요?", en: "How many bags will you check?" },
      { speaker: "승객", kr: "하나만 부칠게요.", en: "Just one." },
    ],
  },
  {
    id: "airport-c1-delay",
    situationKey: "airport",
    level: "C1",
    title: "Flight delay announcement",
    lines: [
      {
        speaker: "안내방송",
        kr: "탑승객 여러분께 안내 말씀드립니다. 기상 악화로 인해 인천행 항공편이 약 두 시간 지연될 예정입니다.",
        en: "Attention passengers: due to severe weather, the flight to Incheon will be delayed by approximately two hours.",
      },
      { speaker: "승객 A", kr: "두 시간이나 늦어진다니 답답하네요.", en: "Two hours late — that's frustrating." },
      { speaker: "승객 B", kr: "그러게요, 대신 라운지에서 좀 쉬고 있죠.", en: "I know, let's just rest in the lounge instead." },
    ],
  },
  {
    id: "shopping-a1-clothes",
    situationKey: "shopping",
    level: "A1",
    title: "Trying on clothes",
    lines: [
      { speaker: "점원", kr: "찾으시는 거 있으세요?", en: "Are you looking for something?" },
      { speaker: "손님", kr: "이 티셔츠 입어봐도 돼요?", en: "Can I try on this t-shirt?" },
      { speaker: "점원", kr: "네, 탈의실은 저쪽이에요.", en: "Sure, the fitting room is over there." },
    ],
  },
  {
    id: "shopping-b1-refund",
    situationKey: "shopping",
    level: "B1",
    title: "Asking for a refund",
    lines: [
      { speaker: "손님", kr: "어제 산 신발인데 사이즈가 안 맞아서 환불하고 싶어요.", en: "I bought these shoes yesterday, but they don't fit — I'd like a refund." },
      { speaker: "점원", kr: "영수증 가지고 계세요?", en: "Do you have the receipt?" },
      { speaker: "손님", kr: "네, 여기 있어요.", en: "Yes, here it is." },
      { speaker: "점원", kr: "확인했습니다. 카드로 환불해 드릴게요.", en: "Confirmed — I'll refund it to your card." },
    ],
  },
  {
    id: "directions-a2-ask",
    situationKey: "directions",
    level: "A2",
    title: "Asking for directions",
    lines: [
      { speaker: "행인 A", kr: "저기요, 지하철역이 어디예요?", en: "Excuse me, where's the subway station?" },
      { speaker: "행인 B", kr: "이 길로 쭉 가시면 오른쪽에 있어요.", en: "Go straight this way, and it's on your right." },
      { speaker: "행인 A", kr: "여기서 멀어요?", en: "Is it far from here?" },
      { speaker: "행인 B", kr: "아니요, 걸어서 5분 정도예요.", en: "No, about a 5-minute walk." },
    ],
  },
  {
    id: "hospital-b1-appointment",
    situationKey: "hospital",
    level: "B1",
    title: "Making a doctor's appointment",
    lines: [
      { speaker: "직원", kr: "어디가 불편해서 오셨어요?", en: "What brings you in today?" },
      { speaker: "환자", kr: "며칠 전부터 목이 아프고 열이 나요.", en: "My throat has hurt and I've had a fever for a few days." },
      { speaker: "직원", kr: "그러시군요. 오늘 오후 2시에 예약 가능하세요.", en: "I see. I can book you for 2pm today." },
      { speaker: "환자", kr: "네, 그때로 해주세요.", en: "Yes, that works." },
    ],
  },
  {
    id: "hotel-a2-checkin",
    situationKey: "hotel",
    level: "A2",
    title: "Checking into a hotel",
    lines: [
      { speaker: "직원", kr: "예약하셨나요?", en: "Do you have a reservation?" },
      { speaker: "손님", kr: "네, 김지은으로 예약했어요.", en: "Yes, it's under Kim Jieun." },
      { speaker: "직원", kr: "확인했습니다. 여권 좀 보여주시겠어요?", en: "Confirmed. May I see your passport?" },
    ],
  },
  {
    id: "phone-b2-reschedule",
    situationKey: "phone",
    level: "B2",
    title: "Rescheduling by phone",
    lines: [
      { speaker: "손님", kr: "안녕하세요, 다음 주 미용실 예약을 좀 미루고 싶어서 전화드렸어요.", en: "Hi, I'm calling to push back my hair salon appointment next week." },
      { speaker: "직원", kr: "네, 어느 요일이 편하세요?", en: "Sure, which day works better for you?" },
      { speaker: "손님", kr: "화요일 대신 목요일 오후로 바꿀 수 있을까요?", en: "Could we change it from Tuesday to Thursday afternoon instead?" },
      { speaker: "직원", kr: "목요일 3시 어떠세요? 그때 자리가 있어요.", en: "How about Thursday at 3? We have an opening then." },
    ],
  },
  {
    id: "directions-a1-station",
    situationKey: "directions",
    level: "A1",
    title: "Where's the station?",
    lines: [
      { speaker: "행인 A", kr: "역이 어디예요?", en: "Where's the station?" },
      { speaker: "행인 B", kr: "저기예요.", en: "It's over there." },
      { speaker: "행인 A", kr: "감사합니다!", en: "Thank you!" },
    ],
  },
  {
    id: "hospital-a1-checkup",
    situationKey: "hospital",
    level: "A1",
    title: "I don't feel well",
    lines: [
      { speaker: "의사", kr: "어디가 아프세요?", en: "Where does it hurt?" },
      { speaker: "환자", kr: "머리가 아파요.", en: "My head hurts." },
      { speaker: "의사", kr: "언제부터 아프셨어요?", en: "Since when?" },
      { speaker: "환자", kr: "어제부터요.", en: "Since yesterday." },
    ],
  },
  {
    id: "hotel-a1-room",
    situationKey: "hotel",
    level: "A1",
    title: "Do you have a room?",
    lines: [
      { speaker: "손님", kr: "방 있어요?", en: "Do you have a room available?" },
      { speaker: "직원", kr: "네, 하루에 얼마나 계세요?", en: "Yes, how many nights will you stay?" },
      { speaker: "손님", kr: "이틀이요.", en: "Two nights." },
    ],
  },
  {
    id: "phone-a1-call",
    situationKey: "phone",
    level: "A1",
    title: "A short phone call",
    lines: [
      { speaker: "친구 A", kr: "여보세요?", en: "Hello?" },
      { speaker: "친구 B", kr: "응, 나야. 지금 뭐 해?", en: "Hi, it's me. What are you doing?" },
      { speaker: "친구 A", kr: "집에 있어. 왜?", en: "I'm at home. Why?" },
      { speaker: "친구 B", kr: "같이 저녁 먹을래?", en: "Want to have dinner together?" },
    ],
  },
  {
    id: "airport-a1-gate",
    situationKey: "airport",
    level: "A1",
    title: "Finding the gate",
    lines: [
      { speaker: "승객", kr: "12번 게이트가 어디예요?", en: "Where's gate 12?" },
      { speaker: "직원", kr: "이쪽으로 쭉 가세요.", en: "Go straight this way." },
      { speaker: "승객", kr: "감사합니다.", en: "Thank you." },
    ],
  },
];

export type DialogueQuiz = {
  q: string;
  opts: string[];
  ans: number;
};

// One comprehension question per dialogue, keyed by dialogue id.
export const QUIZZES: Record<string, DialogueQuiz> = {
  "cafe-a1-order": {
    q: "What did the customer order?",
    opts: ["A hot americano", "An iced americano", "A caffè latte", "A green tea"],
    ans: 1,
  },
  "cafe-b1-complaint": {
    q: "What was the problem with the order?",
    opts: [
      "The drink was cold",
      "The customer got an americano instead of a latte",
      "The order took too long",
      "The customer was overcharged",
    ],
    ans: 1,
  },
  "restaurant-a1-order": {
    q: "What did the customers order?",
    opts: ["One bulgogi", "Two bibimbap", "Two kimchi stews", "Three bibimbap"],
    ans: 1,
  },
  "restaurant-b2-reservation": {
    q: "What change did the customer request?",
    opts: [
      "Moving the reservation from 7 to 8:30",
      "Cancelling the reservation",
      "Adding two more people",
      "Changing to a different restaurant",
    ],
    ans: 0,
  },
  "airport-a2-checkin": {
    q: "How many bags will the passenger check?",
    opts: ["None", "One", "Two", "Three"],
    ans: 1,
  },
  "airport-c1-delay": {
    q: "Why is the flight delayed?",
    opts: ["A mechanical issue", "Severe weather", "A late crew", "Airport congestion"],
    ans: 1,
  },
  "shopping-a1-clothes": {
    q: "What does the customer want to do?",
    opts: ["Return a shirt", "Try on a t-shirt", "Buy shoes", "Ask for a discount"],
    ans: 1,
  },
  "shopping-b1-refund": {
    q: "Why does the customer want a refund?",
    opts: [
      "The shoes are damaged",
      "The color is wrong",
      "The size doesn't fit",
      "They found them cheaper elsewhere",
    ],
    ans: 2,
  },
  "directions-a2-ask": {
    q: "How far is the subway station?",
    opts: ["A 5-minute walk", "A 15-minute walk", "A short bus ride", "Right next door"],
    ans: 0,
  },
  "hospital-b1-appointment": {
    q: "What are the patient's symptoms?",
    opts: [
      "A headache and cough",
      "A sore throat and fever",
      "A stomachache",
      "A sprained ankle",
    ],
    ans: 1,
  },
  "hotel-a2-checkin": {
    q: "What does the clerk ask to see?",
    opts: ["A credit card", "A passport", "A booking confirmation", "A driver's license"],
    ans: 1,
  },
  "phone-b2-reschedule": {
    q: "What does the caller want to change?",
    opts: [
      "A doctor's appointment",
      "A hair salon appointment",
      "A restaurant reservation",
      "A delivery time",
    ],
    ans: 1,
  },
  "directions-a1-station": {
    q: "What is the person looking for?",
    opts: ["A bank", "The station", "A restaurant", "A hotel"],
    ans: 1,
  },
  "hospital-a1-checkup": {
    q: "Since when has the patient's head hurt?",
    opts: ["Today", "Yesterday", "Last week", "This morning"],
    ans: 1,
  },
  "hotel-a1-room": {
    q: "How many nights will the guest stay?",
    opts: ["One", "Two", "Three", "A week"],
    ans: 1,
  },
  "phone-a1-call": {
    q: "What does the caller suggest?",
    opts: ["Watching a movie", "Having dinner together", "Going shopping", "Studying together"],
    ans: 1,
  },
  "airport-a1-gate": {
    q: "Which gate is the passenger looking for?",
    opts: ["Gate 2", "Gate 12", "Gate 20", "Gate 21"],
    ans: 1,
  },
};

export function dialogueById(id: string) {
  return DIALOGUES.find((d) => d.id === id);
}

export function dialoguesFor(level: CefrLevel, situationKey: string) {
  return DIALOGUES.filter((d) => d.level === level && d.situationKey === situationKey);
}
