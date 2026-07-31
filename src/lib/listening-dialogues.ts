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
  {
    id: "cafe-a2-takeout",
    situationKey: "cafe",
    level: "A2",
    title: "Taking it to go",
    lines: [
      { speaker: "점원", kr: "여기서 드시고 가세요, 아니면 포장이세요?", en: "Is it for here, or to go?" },
      { speaker: "손님", kr: "포장해 주세요. 좀 급해서요.", en: "To go, please. I'm in a bit of a hurry." },
      { speaker: "점원", kr: "네, 라떼 두 잔 맞으시죠?", en: "Okay — two lattes, correct?" },
      { speaker: "손님", kr: "네, 하나는 우유 대신 두유로 바꿔 주실 수 있어요?", en: "Yes, and could you make one with soy milk instead of regular milk?" },
      { speaker: "점원", kr: "가능합니다. 오백 원 추가됩니다.", en: "We can do that. It's 500 won extra." },
      { speaker: "손님", kr: "괜찮아요. 카드로 계산할게요.", en: "That's fine. I'll pay by card." },
    ],
  },
  {
    id: "shopping-a2-size",
    situationKey: "shopping",
    level: "A2",
    title: "Looking for another size",
    lines: [
      { speaker: "손님", kr: "이 코트 다른 사이즈도 있어요?", en: "Do you have this coat in another size?" },
      { speaker: "점원", kr: "어떤 사이즈를 찾으세요?", en: "What size are you looking for?" },
      { speaker: "손님", kr: "이건 좀 작아서 라지로 보고 싶어요.", en: "This one is a bit small, so I'd like to see a large." },
      { speaker: "점원", kr: "잠시만요, 창고에서 확인해 볼게요.", en: "One moment, I'll check in the stockroom." },
      { speaker: "점원", kr: "라지는 검은색만 남았어요. 괜찮으세요?", en: "In large we only have black left. Is that okay?" },
      { speaker: "손님", kr: "네, 검은색도 좋아요. 한번 입어 볼게요.", en: "Yes, black is fine too. I'll try it on." },
    ],
  },
  {
    id: "restaurant-b1-recommendation",
    situationKey: "restaurant",
    level: "B1",
    title: "Asking for a recommendation",
    lines: [
      { speaker: "손님", kr: "여기 처음 와 봐서 그런데, 뭐가 제일 인기 있어요?", en: "It's my first time here — what's the most popular dish?" },
      { speaker: "직원", kr: "손님들이 갈비찜을 제일 많이 시키세요.", en: "Most customers order the braised short ribs." },
      { speaker: "손님", kr: "맛있겠네요. 그런데 매운 음식은 잘 못 먹어요.", en: "That sounds good, but I can't really handle spicy food." },
      { speaker: "직원", kr: "그러시면 갈비찜이 딱 좋아요. 전혀 맵지 않거든요.", en: "In that case the short ribs are perfect — they're not spicy at all." },
      { speaker: "손님", kr: "그럼 그걸로 할게요. 둘이 먹기에 양이 충분한가요?", en: "I'll go with that, then. Is it enough for two people?" },
      { speaker: "직원", kr: "네, 중자면 두 분이 드시기에 넉넉해요.", en: "Yes, the medium is plenty for two." },
      { speaker: "손님", kr: "좋아요. 밥도 두 공기 같이 주세요.", en: "Great. Please bring two bowls of rice as well." },
      { speaker: "직원", kr: "알겠습니다. 십 분 정도 걸릴 거예요.", en: "Certainly. It'll take about ten minutes." },
    ],
  },
  {
    id: "phone-b1-delivery",
    situationKey: "phone",
    level: "B1",
    title: "A package that never arrived",
    lines: [
      { speaker: "고객", kr: "안녕하세요, 어제 도착한다던 택배가 아직 안 와서요.", en: "Hello, the package that was supposed to arrive yesterday still hasn't come." },
      { speaker: "상담원", kr: "불편을 드려 죄송합니다. 주문 번호 좀 알려주시겠어요?", en: "I'm sorry for the trouble. Could you give me your order number?" },
      { speaker: "고객", kr: "네, 삼사이공팔이에요.", en: "Sure, it's 3-4-2-0-8." },
      { speaker: "상담원", kr: "확인해 보니 배송 중에 주소가 잘못 입력됐네요.", en: "I see here that the address was entered incorrectly during shipping." },
      { speaker: "고객", kr: "아, 그래요? 그럼 언제쯤 받을 수 있을까요?", en: "Oh, really? Then when can I expect to get it?" },
      { speaker: "상담원", kr: "오늘 다시 보내드리면 내일 오전 중에는 도착할 거예요.", en: "If we resend it today, it should arrive sometime tomorrow morning." },
      { speaker: "고객", kr: "그럼 배송비는 제가 안 내도 되는 거죠?", en: "So I don't have to pay the shipping fee, right?" },
      { speaker: "상담원", kr: "물론입니다. 저희 실수라 전액 저희가 부담합니다.", en: "Of course not. It was our mistake, so we'll cover it entirely." },
    ],
  },
  {
    id: "hotel-b2-complaint",
    situationKey: "hotel",
    level: "B2",
    title: "A noisy room",
    lines: [
      { speaker: "손님", kr: "죄송한데, 방을 바꿀 수 있는지 여쭤보려고요.", en: "Sorry to bother you — I wanted to ask if I could change rooms." },
      { speaker: "직원", kr: "무슨 문제가 있으셨나요?", en: "Was there a problem?" },
      { speaker: "손님", kr: "옆방 공사 소리 때문에 밤새 거의 못 잤어요.", en: "I barely slept all night because of construction noise next door." },
      { speaker: "직원", kr: "정말 죄송합니다. 사전에 안내를 드렸어야 했는데요.", en: "I'm truly sorry. We should have notified you in advance." },
      { speaker: "손님", kr: "이왕이면 반대편 층으로 옮겨 주시면 좋겠어요.", en: "If possible, I'd prefer to move to a floor on the other side." },
      { speaker: "직원", kr: "8층에 조용한 방이 하나 비어 있는데, 그쪽으로 옮겨드릴까요?", en: "There's a quiet room available on the 8th floor — shall I move you there?" },
      { speaker: "손님", kr: "네, 그렇게 해 주세요. 짐은 제가 옮길게요.", en: "Yes, please do that. I'll move my luggage myself." },
      { speaker: "직원", kr: "직원을 보내 도와드리겠습니다. 오늘 조식은 무료로 제공해 드릴게요.", en: "I'll send a staff member to help. And we'll provide today's breakfast free of charge." },
    ],
  },
  {
    id: "hospital-b2-results",
    situationKey: "hospital",
    level: "B2",
    title: "Going over test results",
    lines: [
      { speaker: "의사", kr: "검사 결과가 나왔는데, 다행히 큰 문제는 없습니다.", en: "Your test results are in, and fortunately there's nothing serious." },
      { speaker: "환자", kr: "다행이네요. 그런데 계속 피곤한 건 왜 그럴까요?", en: "That's a relief. But why do I keep feeling tired?" },
      { speaker: "의사", kr: "철분 수치가 조금 낮게 나왔어요. 빈혈 초기 단계로 보입니다.", en: "Your iron levels came back slightly low. It looks like early-stage anemia." },
      { speaker: "환자", kr: "약을 먹어야 하나요?", en: "Do I need to take medication?" },
      { speaker: "의사", kr: "우선 두 달 정도 철분제를 드셔 보시고, 식습관도 같이 조절하시면 좋겠습니다.", en: "Let's start with iron supplements for about two months, and it would help to adjust your diet as well." },
      { speaker: "환자", kr: "어떤 음식을 먹는 게 도움이 될까요?", en: "What kinds of food would help?" },
      { speaker: "의사", kr: "붉은 고기나 시금치처럼 철분이 많은 음식이 좋고, 커피는 좀 줄이시는 게 좋아요.", en: "Iron-rich foods like red meat or spinach are good, and it's best to cut back on coffee." },
      { speaker: "환자", kr: "알겠습니다. 그럼 두 달 뒤에 다시 오면 될까요?", en: "Understood. So should I come back in two months?" },
    ],
  },
  {
    id: "phone-c1-business",
    situationKey: "phone",
    level: "C1",
    title: "A business call about a contract",
    lines: [
      { speaker: "박 과장", kr: "안녕하십니까, 한빛물산 박준호입니다. 지난주에 보내주신 계약서 건으로 연락드렸습니다.", en: "Hello, this is Park Junho from Hanbit Trading. I'm calling regarding the contract you sent last week." },
      { speaker: "이 팀장", kr: "네, 과장님. 검토는 마치셨는지요?", en: "Yes, Mr. Park. Have you finished reviewing it?" },
      { speaker: "박 과장", kr: "대체로 문제는 없습니다만, 납기 조항에 대해서는 조정이 필요할 것 같습니다.", en: "There are no problems overall, but I think the delivery-deadline clause needs some adjustment." },
      { speaker: "이 팀장", kr: "구체적으로 어떤 부분이 걸리시는지 말씀해 주시겠습니까?", en: "Could you tell me specifically which part is a concern?" },
      { speaker: "박 과장", kr: "현재 조건대로라면 저희가 3주 안에 전량을 납품해야 하는데, 원자재 수급이 불안정한 상황이라 현실적으로 어렵습니다.", en: "Under the current terms we'd have to deliver the full quantity within three weeks, but with raw-material supply being unstable, that's not realistic." },
      { speaker: "이 팀장", kr: "그렇군요. 그렇다면 분할 납품 방식은 검토해 보셨습니까?", en: "I see. In that case, have you considered a phased delivery arrangement?" },
      { speaker: "박 과장", kr: "네, 저희도 그 방안이 가장 합리적이라고 보고 있습니다. 1차로 60퍼센트, 나머지는 2주 뒤에 납품하는 조건이면 어떠실까요?", en: "Yes, we also see that as the most reasonable option. How would you feel about 60 percent in the first shipment and the rest two weeks later?" },
      { speaker: "이 팀장", kr: "내부적으로 논의해 보고 늦어도 금요일까지는 회신드리겠습니다.", en: "I'll discuss it internally and get back to you by Friday at the latest." },
      { speaker: "박 과장", kr: "감사합니다. 수정안은 메일로 함께 보내드리겠습니다.", en: "Thank you. I'll send the revised draft by email as well." },
    ],
  },
  {
    id: "hotel-c1-conference",
    situationKey: "hotel",
    level: "C1",
    title: "Arranging a conference venue",
    lines: [
      { speaker: "담당자", kr: "다음 달에 저희 회사 워크숍을 진행하려고 하는데, 대관 가능한 날짜가 있을까요?", en: "We're planning to hold our company workshop next month — do you have any dates available for rental?" },
      { speaker: "지배인", kr: "인원과 희망하시는 기간을 먼저 알려주시면 안내가 수월하겠습니다.", en: "If you could tell me the number of attendees and your preferred dates first, it'll be easier for me to advise you." },
      { speaker: "담당자", kr: "총 80명 정도이고, 1박 2일로 생각하고 있습니다.", en: "About 80 people in total, and we're thinking of a two-day, one-night stay." },
      { speaker: "지배인", kr: "그 정도 규모라면 3층 그랜드홀이 적합합니다. 다만 주말은 이미 예약이 꽉 찬 상태입니다.", en: "For that size, the Grand Hall on the third floor would suit you. However, weekends are already fully booked." },
      { speaker: "담당자", kr: "평일도 상관없습니다. 혹시 빔 프로젝터나 음향 장비도 함께 제공되나요?", en: "Weekdays are fine with us. Are a projector and audio equipment included as well?" },
      { speaker: "지배인", kr: "기본 장비는 대관료에 포함되어 있고, 동시통역 시설은 별도 비용이 발생합니다.", en: "Basic equipment is included in the rental fee, but simultaneous interpretation facilities incur an additional charge." },
      { speaker: "담당자", kr: "통역까지는 필요 없을 것 같습니다. 단체 할인은 적용받을 수 있을까요?", en: "I don't think we'll need interpretation. Would we be eligible for a group discount?" },
      { speaker: "지배인", kr: "50실 이상 예약하시면 객실 요금의 15퍼센트를 할인해 드리고 있습니다.", en: "If you book 50 rooms or more, we offer a 15 percent discount on the room rate." },
      { speaker: "담당자", kr: "그럼 견적서를 받아볼 수 있을까요? 내부 결재를 올려야 해서요.", en: "Could I get a written quote, then? I need to submit it for internal approval." },
      { speaker: "지배인", kr: "오늘 중으로 메일 드리겠습니다. 가예약은 일주일간 유지해 드릴 수 있습니다.", en: "I'll email it to you by the end of today. We can hold a provisional booking for one week." },
    ],
  },
  {
    id: "shopping-c1-consumer",
    situationKey: "shopping",
    level: "C1",
    title: "Disputing a warranty claim",
    lines: [
      { speaker: "고객", kr: "구입한 지 넉 달밖에 안 됐는데 화면이 갑자기 나가 버렸습니다.", en: "I've only had it four months and the screen suddenly went out." },
      { speaker: "직원", kr: "확인해 보겠습니다. 외부 충격이나 침수 이력은 없으셨나요?", en: "Let me take a look. Has there been any external impact or water damage?" },
      { speaker: "고객", kr: "전혀 없습니다. 항상 케이스에 넣어서 사용했고요.", en: "None at all. I always kept it in a case." },
      { speaker: "직원", kr: "그런데 내부 점검 결과 미세한 습기 반응이 감지되었습니다. 이 경우 무상 수리 대상에서 제외됩니다.", en: "However, our internal inspection detected a slight moisture reaction. In that case it falls outside free repair coverage." },
      { speaker: "고객", kr: "납득하기 어렵습니다. 습기에 노출된 적이 없는데 그런 판정이 나온 근거가 뭔가요?", en: "I find that hard to accept. It's never been exposed to moisture, so on what grounds was that determination made?" },
      { speaker: "직원", kr: "제품 내부에 습기 감지 스티커가 부착되어 있는데, 색상이 변색된 상태입니다.", en: "There's a moisture-detection sticker inside the product, and its color has changed." },
      { speaker: "고객", kr: "그렇다면 그 판정에 대해 재검사를 요청하고 싶습니다. 소비자원에 문의할 수도 있는 사안 아닌가요?", en: "In that case I'd like to request a re-inspection. Isn't this something I could also take to the consumer protection agency?" },
      { speaker: "직원", kr: "물론 가능합니다. 원하시면 본사 기술센터로 이관해서 정밀 진단을 진행해 드리겠습니다.", en: "Of course you can. If you'd like, I'll forward it to our headquarters' technical center for a detailed diagnosis." },
      { speaker: "고객", kr: "그렇게 해 주세요. 결과는 서면으로 받아볼 수 있으면 좋겠습니다.", en: "Please do that. I'd appreciate receiving the results in writing." },
      { speaker: "직원", kr: "네, 진단서 사본을 함께 드리겠습니다. 통상 일주일 정도 소요됩니다.", en: "Certainly, I'll include a copy of the diagnostic report. It usually takes about a week." },
    ],
  },
  {
    id: "cafe-c2-debate",
    situationKey: "cafe",
    level: "C2",
    title: "Disagreeing over coffee",
    lines: [
      { speaker: "선배", kr: "요즘 청년들이 집을 안 사는 게 아니라 못 사는 거라는 말, 나는 좀 과장됐다고 봐.", en: "That line about young people not being unable to buy homes but simply choosing not to — I think it's a bit overblown." },
      { speaker: "후배", kr: "글쎄요, 저는 그렇게만 보기는 어렵다고 생각하는데요.", en: "Hmm, I'd find it hard to see it purely that way." },
      { speaker: "선배", kr: "물론 집값이 오른 건 사실이지만, 소비 패턴도 예전과는 확연히 달라졌잖아.", en: "Sure, prices have gone up, but consumption patterns are clearly different from the past too." },
      { speaker: "후배", kr: "그건 원인이라기보다 결과에 가깝지 않을까요? 어차피 못 살 바에야 지금을 즐기자는 심리인 거죠.", en: "Isn't that closer to a consequence than a cause, though? It's the mindset of 'if I can't buy anyway, I might as well enjoy the present.'" },
      { speaker: "선배", kr: "듣고 보니 일리가 있네. 다만 그 논리대로라면 정책이 아무리 나와도 소용없다는 얘기가 되는데.", en: "Now that you say it, that does have a point. Though by that logic, it would mean no policy would make any difference." },
      { speaker: "후배", kr: "꼭 그렇지는 않죠. 다만 공급만 늘린다고 해결될 문제는 아니라는 뜻입니다.", en: "Not necessarily. I just mean it's not a problem that gets solved by increasing supply alone." },
      { speaker: "선배", kr: "그럼 뭐가 더 필요하다고 보는데?", en: "Then what more do you think is needed?" },
      { speaker: "후배", kr: "결국 임금이죠. 집값을 잡는 것보다 소득이 따라가게 만드는 게 근본적이라고 봅니다.", en: "Ultimately, wages. I see making incomes catch up as more fundamental than reining in housing prices." },
      { speaker: "선배", kr: "그건 말처럼 쉬운 일이 아니야. 기업 입장도 생각해야 하고.", en: "That's easier said than done. You have to consider the companies' position too." },
      { speaker: "후배", kr: "그렇긴 하죠. 그래도 지금처럼 방치하면 어느 쪽도 득 볼 게 없다는 건 분명하잖아요.", en: "That's true. Still, it's clear that if things are left as they are, neither side stands to gain anything." },
    ],
  },
  {
    id: "phone-c2-negotiation",
    situationKey: "phone",
    level: "C2",
    title: "Pushing back on a price increase",
    lines: [
      { speaker: "구매팀", kr: "보내주신 단가 인상 통보를 받고 좀 당황스러워서 전화드렸습니다.", en: "I'm calling because we were rather taken aback by the price increase notice you sent." },
      { speaker: "영업팀", kr: "충분히 이해합니다. 저희도 인상은 최후의 수단으로 결정한 사안입니다.", en: "I completely understand. Raising prices was a last resort for us as well." },
      { speaker: "구매팀", kr: "이해는 합니다만, 12퍼센트라는 수치는 업계 평균을 한참 웃도는 수준 아닙니까?", en: "I understand, but isn't 12 percent well above the industry average?" },
      { speaker: "영업팀", kr: "표면적으로는 그렇게 보일 수 있습니다. 다만 저희는 지난 3년간 단가를 동결해 왔다는 점도 감안해 주셨으면 합니다.", en: "On the surface it may look that way. But I'd ask you to also take into account that we've frozen our prices for the past three years." },
      { speaker: "구매팀", kr: "그 부분은 저희도 인정합니다. 그렇다고 해도 이번 분기에 한꺼번에 반영하기에는 부담이 큽니다.", en: "We do acknowledge that. Even so, absorbing it all at once this quarter is a heavy burden." },
      { speaker: "영업팀", kr: "그렇다면 단계적으로 적용하는 방안은 어떠십니까? 상반기에 7퍼센트, 하반기에 나머지를 반영하는 식으로요.", en: "In that case, how about applying it in stages? Seven percent in the first half and the remainder in the second." },
      { speaker: "구매팀", kr: "그 정도면 내부 설득이 어느 정도 가능할 것 같긴 합니다. 대신 물량 보장 조건을 붙이고 싶습니다.", en: "That might be something I could sell internally to some extent. In exchange, we'd want a volume guarantee attached." },
      { speaker: "영업팀", kr: "연간 물량을 확정해 주신다면 저희 쪽에서도 검토할 여지가 있습니다.", en: "If you commit to an annual volume, there'd be room on our end to consider it." },
      { speaker: "구매팀", kr: "서로 한 발씩 물러서는 셈이네요. 초안을 정리해서 보내주시면 검토하겠습니다.", en: "So we'd each be giving a little ground. Send over a draft and we'll review it." },
      { speaker: "영업팀", kr: "그럼 그렇게 진행하겠습니다. 좋은 결론이 나기를 기대하겠습니다.", en: "We'll proceed on that basis, then. I look forward to reaching a good conclusion." },
    ],
  },
  {
    id: "restaurant-c2-review",
    situationKey: "restaurant",
    level: "C2",
    title: "Two critics compare notes",
    lines: [
      { speaker: "평론가 A", kr: "솔직히 말하면 기대에 비해 다소 아쉬웠다는 게 제 평가입니다.", en: "Honestly, my assessment is that it fell somewhat short given the expectations." },
      { speaker: "평론가 B", kr: "의외네요. 저는 오히려 근래 본 것 중 가장 인상적이었다고 생각했거든요.", en: "That's surprising. I actually thought it was the most impressive thing I've seen recently." },
      { speaker: "평론가 A", kr: "재료의 완성도는 나무랄 데가 없었죠. 다만 구성이 지나치게 계산적이라는 인상을 받았습니다.", en: "The quality of the ingredients was beyond reproach. But the composition struck me as excessively calculated." },
      { speaker: "평론가 B", kr: "계산적이라기보다는 정교하다고 표현하는 게 더 맞지 않을까요?", en: "Wouldn't it be more apt to call it refined rather than calculated?" },
      { speaker: "평론가 A", kr: "표현의 차이일 수도 있겠습니다만, 저는 어느 순간부터 요리가 아니라 설계도를 보는 기분이었어요.", en: "It may be a matter of phrasing, but at some point I felt like I was looking at a blueprint rather than a dish." },
      { speaker: "평론가 B", kr: "그 지적은 일부 수긍이 갑니다. 특히 중반부 코스는 흐름이 다소 끊긴 감이 있었죠.", en: "I can partly grant that criticism. The middle of the course did feel somewhat disjointed." },
      { speaker: "평론가 A", kr: "바로 그 부분입니다. 셰프가 하고 싶은 이야기는 많은데 손님에게 전달될 여유는 없었달까요.", en: "That's exactly it. The chef had plenty to say, but there was no room left for it to reach the diner." },
      { speaker: "평론가 B", kr: "그래도 이제 개업 1년 차라는 점은 참작해야 하지 않겠습니까?", en: "Still, shouldn't we make allowances for the fact that they're only a year in?" },
      { speaker: "평론가 A", kr: "물론입니다. 가혹하게 평가할 생각은 없어요. 다음에 다시 가 볼 가치는 충분하다고 봅니다.", en: "Of course. I have no intention of judging harshly. I do think it's well worth a return visit." },
      { speaker: "평론가 B", kr: "그 말씀이면 사실상 호평 아닌가요?", en: "Coming from you, isn't that effectively praise?" },
    ],
  },
  {
    id: "airport-c2-policy",
    situationKey: "airport",
    level: "C2",
    title: "A news-style discussion on air travel",
    lines: [
      { speaker: "진행자", kr: "최근 항공권 가격이 급등하면서 소비자 불만이 커지고 있는데, 어떻게 보십니까?", en: "With airfares surging recently, consumer complaints have been mounting — what's your view?" },
      { speaker: "전문가", kr: "단순히 항공사의 배를 불리기 위한 인상이라고 보기에는 무리가 있습니다.", en: "It's a stretch to see this simply as an increase meant to line the airlines' pockets." },
      { speaker: "진행자", kr: "그렇다면 구조적인 요인이 있다는 말씀이신가요?", en: "So you're saying there are structural factors at play?" },
      { speaker: "전문가", kr: "그렇습니다. 유가와 인건비 상승은 물론이고, 팬데믹 기간에 감축된 노선이 아직 회복되지 않은 탓이 큽니다.", en: "That's right. Beyond fuel and labor costs, a large part of it is that routes cut during the pandemic still haven't been restored." },
      { speaker: "진행자", kr: "그런데 업계에서는 이미 수요가 예년 수준을 넘어섰다고 하지 않습니까?", en: "But hasn't the industry said demand has already surpassed pre-pandemic levels?" },
      { speaker: "전문가", kr: "수요가 회복된 것과 공급이 따라가는 것은 별개의 문제입니다. 항공기 인도 지연이 발목을 잡고 있죠.", en: "Demand recovering and supply keeping pace are two separate matters. Aircraft delivery delays are holding things back." },
      { speaker: "진행자", kr: "그럼 정부가 개입해서 가격을 규제해야 한다는 주장에 대해서는요?", en: "And what about the argument that the government should step in and regulate prices?" },
      { speaker: "전문가", kr: "저는 회의적입니다. 인위적으로 가격을 누르면 결국 노선 축소로 이어져 소비자에게 더 불리해질 수 있습니다.", en: "I'm skeptical. Artificially suppressing prices would ultimately lead to route reductions, which could leave consumers worse off." },
      { speaker: "진행자", kr: "그렇다면 소비자가 당장 기대할 수 있는 변화는 없다는 뜻인가요?", en: "Does that mean there's no change consumers can expect any time soon?" },
      { speaker: "전문가", kr: "적어도 올해 안에 눈에 띄게 내려가기는 어렵다고 봅니다. 내년 하반기쯤이면 안정세로 돌아설 여지가 있습니다.", en: "I don't see a noticeable drop within this year, at least. There's room for things to stabilize around the second half of next year." },
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
  "cafe-a2-takeout": {
    q: "What change did the customer request?",
    opts: [
      "An extra shot in one drink",
      "Soy milk instead of regular milk in one drink",
      "Less ice in both drinks",
      "A larger cup size",
    ],
    ans: 1,
  },
  "shopping-a2-size": {
    q: "What is the only option left in a large?",
    opts: ["Black", "Beige", "Navy", "Grey"],
    ans: 0,
  },
  "restaurant-b1-recommendation": {
    q: "Why does the staff member recommend the braised short ribs?",
    opts: [
      "They are the cheapest dish",
      "They are the newest item on the menu",
      "They are popular and not spicy",
      "They are served the fastest",
    ],
    ans: 2,
  },
  "phone-b1-delivery": {
    q: "Why did the package fail to arrive?",
    opts: [
      "The item was out of stock",
      "The address was entered incorrectly",
      "The customer wasn't home",
      "Bad weather delayed the courier",
    ],
    ans: 1,
  },
  "hotel-b2-complaint": {
    q: "What does the hotel offer in addition to a new room?",
    opts: [
      "A full refund for the night",
      "A free airport transfer",
      "Free breakfast for the day",
      "A late checkout",
    ],
    ans: 2,
  },
  "hospital-b2-results": {
    q: "What did the test results show?",
    opts: [
      "High blood pressure",
      "Slightly low iron levels",
      "A vitamin D deficiency",
      "Nothing at all unusual",
    ],
    ans: 1,
  },
  "phone-c1-business": {
    q: "What solution do the two sides discuss?",
    opts: [
      "Cancelling the contract",
      "Raising the unit price",
      "Delivering in phases, 60 percent first",
      "Switching to a different supplier",
    ],
    ans: 2,
  },
  "hotel-c1-conference": {
    q: "What condition earns the group a discount?",
    opts: [
      "Booking 50 rooms or more",
      "Booking on a weekend",
      "Paying the full amount upfront",
      "Adding interpretation services",
    ],
    ans: 0,
  },
  "shopping-c1-consumer": {
    q: "Why was the free repair refused?",
    opts: [
      "The warranty had expired",
      "The receipt was missing",
      "A moisture-detection sticker had changed color",
      "The screen had visible impact damage",
    ],
    ans: 2,
  },
  "cafe-c2-debate": {
    q: "What does the younger speaker argue is most fundamental?",
    opts: [
      "Increasing the housing supply",
      "Making incomes catch up",
      "Tightening lending rules",
      "Changing young people's spending habits",
    ],
    ans: 1,
  },
  "phone-c2-negotiation": {
    q: "What compromise is reached on the price increase?",
    opts: [
      "It is cancelled entirely",
      "It is cut to 7 percent permanently",
      "It is applied in stages, with a volume guarantee in return",
      "It is delayed until the following year",
    ],
    ans: 2,
  },
  "restaurant-c2-review": {
    q: "What is critic A's main reservation about the restaurant?",
    opts: [
      "The ingredients were poor quality",
      "The composition felt excessively calculated",
      "The service was too slow",
      "The portions were too small",
    ],
    ans: 1,
  },
  "airport-c2-policy": {
    q: "Why is the expert skeptical of price regulation?",
    opts: [
      "It would bankrupt smaller airlines",
      "It would raise fuel costs further",
      "It could lead to route cuts that hurt consumers",
      "It would take too long to legislate",
    ],
    ans: 2,
  },
};

export function dialogueById(id: string) {
  return DIALOGUES.find((d) => d.id === id);
}

export function dialoguesFor(level: CefrLevel, situationKey: string) {
  return DIALOGUES.filter((d) => d.level === level && d.situationKey === situationKey);
}
